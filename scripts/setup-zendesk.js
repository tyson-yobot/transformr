#!/usr/bin/env node
/**
 * TRANSFORMR — Zendesk Setup Script
 * Sets up TRANSFORMR as a second brand in the existing Zendesk account.
 * Run: node scripts/setup-zendesk.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Load .env ───────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const raw = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const SUBDOMAIN = env.ZENDESK_SUBDOMAIN;
const EMAIL = env.ZENDESK_EMAIL;
const TOKEN = env.ZENDESK_API_TOKEN;

if (!SUBDOMAIN || !EMAIL || !TOKEN) {
  console.error('✗ Missing Zendesk credentials in .env');
  process.exit(1);
}

const BASE_URL = `${SUBDOMAIN}.zendesk.com`;
const AUTH = Buffer.from(`${EMAIL}/token:${TOKEN}`).toString('base64');

// ─── Tracking ────────────────────────────────────────────────────────────────
const results = {
  brandId: null,
  brandName: 'TRANSFORMR',
  fields: { created: 0, fieldIds: [] },
  form: { created: false, formId: null },
  email: { status: 'pending' },
  triggers: { created: 0 },
  automations: { created: 0 },
  macros: { created: 0 },
  views: { created: 0 },
  sla: { created: false },
  satisfaction: { status: 'pending' },
  businessHours: { created: false, scheduleId: null },
  helpCenter: { created: 0 },
  manualActions: [],
};

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: 443,
      path,
      method,
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiCall(method, path, body, label) {
  await sleep(500);
  try {
    const res = await request(method, path, body);
    if (res.status === 401) {
      console.error(`\n✗ AUTH FAILURE (401) — check ZENDESK_EMAIL and ZENDESK_API_TOKEN`);
      process.exit(1);
    }
    if (res.status === 422) {
      console.log(`  ↩ ${label} — already exists (422), skipping`);
      return { skipped: true, body: res.body };
    }
    if (res.status === 403) {
      console.log(`  ⚠ ${label} — plan limitation (403), adding to manual actions`);
      return { planLimit: true, body: res.body };
    }
    if (res.status >= 400) {
      const errMsg = typeof res.body === 'object' ? JSON.stringify(res.body) : res.body;
      console.log(`  ✗ ${label} — HTTP ${res.status}: ${errMsg}`);
      return { error: true, status: res.status, body: res.body };
    }
    console.log(`  ✓ ${label}`);
    return { success: true, body: res.body };
  } catch (e) {
    console.log(`  ✗ ${label} — Network error: ${e.message}`);
    return { error: true, message: e.message };
  }
}

// ─── STEP 3A: Brand ───────────────────────────────────────────────────────────
async function setupBrand() {
  console.log('\n══ 3A: Brand ══════════════════════════════════════════════════');

  // Check existing brands
  const list = await apiCall('GET', '/api/v2/brands.json', null, 'List brands');
  if (list.success) {
    const existing = list.body.brands?.find(
      (b) => b.name === 'TRANSFORMR' || b.subdomain === 'transformr'
    );
    if (existing) {
      console.log(`  ↩ TRANSFORMR brand already exists (ID: ${existing.id})`);
      results.brandId = existing.id;
      return;
    }
  }

  const res = await apiCall('POST', '/api/v2/brands.json', {
    brand: {
      name: 'TRANSFORMR',
      subdomain: 'transformr-support',
      active: true,
      default: false,
    }
  }, 'Create TRANSFORMR brand');

  if (res.success) {
    results.brandId = res.body.brand?.id;
    console.log(`    Brand ID: ${results.brandId}`);
  } else if (res.skipped) {
    // Try fetching to get ID
    const retry = await apiCall('GET', '/api/v2/brands.json', null, 'Re-fetch brands for ID');
    if (retry.success) {
      const found = retry.body.brands?.find((b) => b.name === 'TRANSFORMR');
      if (found) results.brandId = found.id;
    }
  } else {
    results.manualActions.push('Create TRANSFORMR brand manually in Zendesk Admin → Account → Brands');
  }
}

// ─── STEP 3B: Custom Ticket Fields ──────────────────────────────────────────
async function setupCustomFields() {
  console.log('\n══ 3B: Custom Ticket Fields ═══════════════════════════════════');

  const fields = [
    {
      type: 'tagger',
      title: 'Issue Category',
      required_in_portal: true,
      custom_field_options: [
        { name: 'Account & Login', value: 'account_login' },
        { name: 'AI Coach / Chat', value: 'ai_coach_chat' },
        { name: 'Workout Tracking', value: 'workout_tracking' },
        { name: 'Nutrition / Meal Logging', value: 'nutrition_meal_logging' },
        { name: 'AI Meal Camera', value: 'ai_meal_camera' },
        { name: 'Barcode Scanner', value: 'barcode_scanner' },
        { name: 'Supplements & Evidence', value: 'supplements_evidence' },
        { name: 'Lab Results & Interpretation', value: 'lab_results' },
        { name: 'Habits & Streaks', value: 'habits_streaks' },
        { name: 'Sleep & Mood Tracking', value: 'sleep_mood' },
        { name: 'Challenges (75 Hard etc.)', value: 'challenges' },
        { name: 'Partner / Couples Features', value: 'partner_couples' },
        { name: 'Business & Revenue Tracking', value: 'business_revenue' },
        { name: 'Personal Finance', value: 'personal_finance' },
        { name: 'Billing & Subscription', value: 'billing_subscription' },
        { name: 'Data Sync / Offline Issues', value: 'data_sync_offline' },
        { name: 'App Crash / Performance', value: 'app_crash_performance' },
        { name: 'Push Notifications', value: 'push_notifications' },
        { name: 'Feature Request', value: 'feature_request' },
        { name: 'Other', value: 'other' },
      ],
    },
    {
      type: 'tagger',
      title: 'Severity',
      required_in_portal: true,
      custom_field_options: [
        { name: 'Critical — App unusable or data lost', value: 'severity_critical' },
        { name: 'High — Major feature broken', value: 'severity_high' },
        { name: 'Medium — Partially working', value: 'severity_medium' },
        { name: 'Low — Minor issue or question', value: 'severity_low' },
      ],
    },
    {
      type: 'tagger',
      title: 'Device Platform',
      required_in_portal: true,
      custom_field_options: [
        { name: 'iPhone', value: 'platform_iphone' },
        { name: 'Android', value: 'platform_android' },
      ],
    },
    {
      type: 'text',
      title: 'App Version',
      required_in_portal: false,
      description: 'Found in Settings → About',
    },
    {
      type: 'text',
      title: 'Device Model',
      required_in_portal: false,
      description: 'e.g. iPhone 15 Pro, Pixel 9',
    },
    {
      type: 'tagger',
      title: 'Subscription Tier',
      required_in_portal: false,
      custom_field_options: [
        { name: 'Free', value: 'tier_free' },
        { name: 'Pro ($9.99/mo)', value: 'tier_pro' },
        { name: 'Elite ($14.99/mo)', value: 'tier_elite' },
        { name: 'Partners ($19.99/mo)', value: 'tier_partners' },
        { name: 'Not sure', value: 'tier_unknown' },
      ],
    },
  ];

  for (const field of fields) {
    const res = await apiCall('POST', '/api/v2/ticket_fields.json', { ticket_field: field }, `Create field: ${field.title}`);
    if (res.success) {
      results.fields.created++;
      results.fields.fieldIds.push(res.body.ticket_field?.id);
    } else if (res.skipped) {
      // Try to find existing field ID
      const list = await apiCall('GET', '/api/v2/ticket_fields.json', null, `Lookup existing field: ${field.title}`);
      if (list.success) {
        const found = list.body.ticket_fields?.find((f) => f.title === field.title);
        if (found) results.fields.fieldIds.push(found.id);
      }
    }
  }
  console.log(`  → ${results.fields.created} fields created, ${results.fields.fieldIds.length} field IDs collected`);
}

// ─── STEP 3C: Ticket Form ────────────────────────────────────────────────────
async function setupTicketForm() {
  console.log('\n══ 3C: Ticket Form ════════════════════════════════════════════');

  const allFieldIds = results.fields.fieldIds.filter(Boolean);
  const ticketFieldIds = [
    { id: 'subject' },
    { id: 'description' },
    ...allFieldIds.map((id) => ({ id })),
  ];

  const res = await apiCall('POST', '/api/v2/ticket_forms.json', {
    ticket_form: {
      name: 'TRANSFORMR Support Request',
      default: false,
      end_user_visible: true,
      active: true,
      ticket_field_ids: allFieldIds,
    }
  }, 'Create TRANSFORMR ticket form');

  if (res.success) {
    results.form.created = true;
    results.form.formId = res.body.ticket_form?.id;
  }
}

// ─── STEP 3D: Email Channel ───────────────────────────────────────────────────
async function setupEmailChannel() {
  console.log('\n══ 3D: Email Channel ══════════════════════════════════════════');

  const res = await apiCall('POST', '/api/v2/recipient_addresses.json', {
    recipient_address: {
      name: 'TRANSFORMR Support',
      email: 'support@transformr.ai',
      default: false,
      ...(results.brandId ? { brand_id: results.brandId } : {}),
    }
  }, 'Create support@transformr.ai email address');

  if (res.success) {
    results.email.status = 'created — needs SPF/DKIM verification';
    results.manualActions.push(
      'EMAIL: Verify support@transformr.ai in Zendesk Admin → Channels → Email → support@transformr.ai → Verify'
    );
    results.manualActions.push(
      'EMAIL: Set up email forwarding from support@transformr.ai → your Zendesk support address'
    );
  } else {
    results.email.status = 'manual action needed';
    results.manualActions.push(
      'EMAIL: Manually add support@transformr.ai in Zendesk Admin → Channels → Email → Add address'
    );
    results.manualActions.push(
      'EMAIL: Set up forwarding from support@transformr.ai to your Zendesk support address'
    );
  }
}

// ─── STEP 3E: SMS Channel (manual) ───────────────────────────────────────────
async function setupSmsChannel() {
  console.log('\n══ 3E: SMS Channel ════════════════════════════════════════════');
  console.log('  ℹ SMS channel creation is not supported via Zendesk API — manual setup required');
  results.manualActions.push(
    'SMS: Purchase a dedicated Twilio phone number for TRANSFORMR (~$1.15/mo) at twilio.com/console'
  );
  results.manualActions.push(
    'SMS: In Zendesk Admin → Channels → Text → Add number → connect new Twilio number'
  );
  results.manualActions.push(
    `SMS: Existing Construktr Twilio number: ${env.TWILIO_PHONE_NUMBER} — do NOT use this for TRANSFORMR`
  );
}

// ─── STEP 3F: Triggers ────────────────────────────────────────────────────────
async function setupTriggers() {
  console.log('\n══ 3F: Triggers ═══════════════════════════════════════════════');

  const brandCondition = results.brandId
    ? [{ field: 'brand_id', operator: 'is', value: String(results.brandId) }]
    : [];

  const triggers = [
    // 1. New ticket auto-reply (Email)
    {
      title: 'TRANSFORMR — New ticket auto-reply (Email)',
      active: true,
      conditions: {
        all: [
          { field: 'status', operator: 'is', value: 'new' },
          { field: 'update_type', operator: 'is', value: 'Create' },
          ...brandCondition,
        ],
      },
      actions: [
        {
          field: 'notification_user',
          value: [
            'requester_id',
            'TRANSFORMR Support — Ticket #{{ticket.id}} Received',
            `Hi {{ticket.requester.name}},

Thank you for reaching out to TRANSFORMR Support. We've received your request and our team will respond within 24 hours.

Your ticket number is #{{ticket.id}} — please reference this in any future replies.

To help us resolve this faster, please include:
• App version (Settings → About)
• Device model (e.g. iPhone 15 Pro, Pixel 9)
• Steps to reproduce the issue
• Screenshots or screen recordings (if applicable)

— TRANSFORMR Support
support@transformr.ai`,
          ],
        },
      ],
    },
    // 2. New ticket auto-reply (SMS)
    {
      title: 'TRANSFORMR — New ticket auto-reply (SMS)',
      active: true,
      conditions: {
        all: [
          { field: 'status', operator: 'is', value: 'new' },
          { field: 'update_type', operator: 'is', value: 'Create' },
          { field: 'via_id', operator: 'is', value: '57' },
          ...brandCondition,
        ],
      },
      actions: [
        {
          field: 'notification_sms_user',
          value: [
            'requester_id',
            `Hi {{ticket.requester.name}}, TRANSFORMR Support received your message. Ticket #{{ticket.id}}. We'll reply within 24 hours. Reply to this message to continue. — TRANSFORMR Support`,
          ],
        },
      ],
    },
    // 3. Escalate critical tickets
    {
      title: 'TRANSFORMR — Escalate critical severity tickets',
      active: true,
      conditions: {
        all: [
          { field: 'update_type', operator: 'is', value: 'Create' },
          { field: 'current_tags', operator: 'includes', value: 'severity_critical' },
          ...brandCondition,
        ],
      },
      actions: [
        { field: 'priority', value: 'urgent' },
        { field: 'add_tags', value: 'escalated critical_issue' },
        { field: 'assignee_id', value: 'current_user' },
      ],
    },
    // 4. Tag billing tickets
    {
      title: 'TRANSFORMR — Tag and prioritize billing tickets',
      active: true,
      conditions: {
        all: [
          { field: 'update_type', operator: 'is', value: 'Create' },
          { field: 'current_tags', operator: 'includes', value: 'billing_subscription' },
          ...brandCondition,
        ],
      },
      actions: [
        { field: 'priority', value: 'high' },
        { field: 'add_tags', value: 'billing transformr_billing' },
      ],
    },
    // 5. Tag data sync tickets
    {
      title: 'TRANSFORMR — Tag and prioritize data sync tickets',
      active: true,
      conditions: {
        all: [
          { field: 'update_type', operator: 'is', value: 'Create' },
          { field: 'current_tags', operator: 'includes', value: 'data_sync_offline' },
          ...brandCondition,
        ],
      },
      actions: [
        { field: 'priority', value: 'high' },
        { field: 'add_tags', value: 'data_sync transformr_sync' },
      ],
    },
    // 6. Tag crash reports
    {
      title: 'TRANSFORMR — Tag and prioritize crash reports',
      active: true,
      conditions: {
        all: [
          { field: 'update_type', operator: 'is', value: 'Create' },
          { field: 'current_tags', operator: 'includes', value: 'app_crash_performance' },
          ...brandCondition,
        ],
      },
      actions: [
        { field: 'priority', value: 'high' },
        { field: 'add_tags', value: 'crash_report transformr_crash' },
      ],
    },
    // 7. Satisfaction survey on solve
    {
      title: 'TRANSFORMR — Send satisfaction survey on solve',
      active: true,
      conditions: {
        all: [
          { field: 'status', operator: 'is', value: 'solved' },
          { field: 'update_type', operator: 'is', value: 'Change' },
          ...brandCondition,
        ],
      },
      actions: [
        {
          field: 'notification_user',
          value: [
            'requester_id',
            'How did we do? — TRANSFORMR Support (Ticket #{{ticket.id}})',
            `Hi {{ticket.requester.name}},

Your support ticket #{{ticket.id}} has been marked as solved. We'd love to hear how we did!

Rate your experience: {{satisfaction.rating_url}}

If your issue isn't fully resolved, just reply to this email and we'll reopen your ticket right away.

Keep transforming. 💪

— TRANSFORMR Support
support@transformr.ai`,
          ],
        },
      ],
    },
    // 8. Auto-troubleshoot AI Coach
    {
      title: 'TRANSFORMR — Auto-troubleshoot AI Coach issues',
      active: true,
      conditions: {
        all: [
          { field: 'update_type', operator: 'is', value: 'Create' },
          { field: 'current_tags', operator: 'includes', value: 'ai_coach_chat' },
          ...brandCondition,
        ],
      },
      actions: [
        {
          field: 'notification_user',
          value: [
            'requester_id',
            'TRANSFORMR AI Coach Troubleshooting — Ticket #{{ticket.id}}',
            `Hi {{ticket.requester.name}},

While our team reviews your ticket #{{ticket.id}}, here are the most common fixes for AI Coach issues:

1. **Check your internet connection** — The AI Coach requires an active connection for each response.
2. **Force-close and reopen TRANSFORMR** — Swipe the app up from the app switcher, then relaunch.
3. **Start a new conversation** — Tap the "+" icon to begin a fresh chat session.
4. **Complete your profile** — The AI Coach personalizes responses based on your goals, stats, and preferences. An incomplete profile can affect response quality.
5. **Update the app** — Go to the App Store or Google Play and install any available updates.

If none of these resolve the issue, our team will follow up shortly.

— TRANSFORMR Support
support@transformr.ai`,
          ],
        },
      ],
    },
    // 9. Auto-troubleshoot Meal Camera
    {
      title: 'TRANSFORMR — Auto-troubleshoot AI Meal Camera issues',
      active: true,
      conditions: {
        all: [
          { field: 'update_type', operator: 'is', value: 'Create' },
          { field: 'current_tags', operator: 'includes', value: 'ai_meal_camera' },
          ...brandCondition,
        ],
      },
      actions: [
        {
          field: 'notification_user',
          value: [
            'requester_id',
            'TRANSFORMR AI Meal Camera Tips — Ticket #{{ticket.id}}',
            `Hi {{ticket.requester.name}},

Thanks for contacting us about ticket #{{ticket.id}}. Here are tips for getting the best results from the AI Meal Camera:

1. **Lighting** — Use natural light or a well-lit room. Avoid dark shadows or backlighting.
2. **Angle** — Hold your phone 12–18 inches above the meal, pointing straight down.
3. **Separate items** — If possible, spread items so the camera can identify each component.
4. **Try the barcode scanner** — For packaged foods, use the barcode scanner instead for exact nutrition data.
5. **Edit after scanning** — You can always tap any item in the scan results to edit quantities or swap items.
6. **Manual entry** — If the camera struggles, tap "Log manually" to search our 6M+ food database.

Our team is also reviewing your ticket and will follow up if needed.

— TRANSFORMR Support
support@transformr.ai`,
          ],
        },
      ],
    },
    // 10. Auto-troubleshoot Partner linking
    {
      title: 'TRANSFORMR — Auto-troubleshoot Partner linking issues',
      active: true,
      conditions: {
        all: [
          { field: 'update_type', operator: 'is', value: 'Create' },
          { field: 'current_tags', operator: 'includes', value: 'partner_couples' },
          ...brandCondition,
        ],
      },
      actions: [
        {
          field: 'notification_user',
          value: [
            'requester_id',
            'TRANSFORMR Partner Linking Help — Ticket #{{ticket.id}}',
            `Hi {{ticket.requester.name}},

We received your ticket #{{ticket.id}} about Partner / Couples features. Here's how to link accounts successfully:

1. **Both people must have TRANSFORMR accounts** — Make sure your partner has signed up and completed their profile.
2. **Generate a link code** — One partner goes to Profile → Partner → Generate Link Code.
3. **Share and enter the code** — The other partner goes to Profile → Partner → Enter Code and types it in.
4. **Codes expire in 24 hours** — If the code expired, generate a new one.
5. **Both must be online** — Make sure both phones have an active internet connection when linking.
6. **Check your plan** — Partner features require the Partners plan ($19.99/mo). Go to Profile → Subscription to verify.

If you're still having trouble, our team will follow up shortly.

— TRANSFORMR Support
support@transformr.ai`,
          ],
        },
      ],
    },
  ];

  for (const trigger of triggers) {
    const res = await apiCall('POST', '/api/v2/triggers.json', { trigger }, `Create trigger: ${trigger.title}`);
    if (res.success) results.triggers.created++;
  }
}

// ─── STEP 3G: Automations ─────────────────────────────────────────────────────
async function setupAutomations() {
  console.log('\n══ 3G: Automations ════════════════════════════════════════════');

  const brandCondition = results.brandId
    ? [{ field: 'brand_id', operator: 'is', value: String(results.brandId) }]
    : [];

  const automations = [
    // 1. Follow up after 24 hours pending
    {
      title: 'TRANSFORMR — Follow up after 24 hours pending',
      active: true,
      conditions: {
        all: [
          { field: 'status', operator: 'is', value: 'pending' },
          { field: 'hours_since_update', operator: 'greater_than', value: '24' },
          ...brandCondition,
        ],
      },
      actions: [
        {
          field: 'notification_user',
          value: [
            'requester_id',
            'Following up on your TRANSFORMR support request — Ticket #{{ticket.id}}',
            `Hi {{ticket.requester.name}},

We wanted to check in on ticket #{{ticket.id}}. It looks like we may be waiting on information from you, or your issue may have been resolved.

If you're still experiencing the issue, please reply to this email with any additional details and we'll jump right back in.

Please note: if we don't hear back within 72 hours, this ticket will be automatically closed. You can always reopen it by replying.

— TRANSFORMR Support
support@transformr.ai`,
          ],
        },
      ],
    },
    // 2. Auto-close after 5 days no response
    {
      title: 'TRANSFORMR — Auto-close after 5 days no response',
      active: true,
      conditions: {
        all: [
          { field: 'status', operator: 'is', value: 'pending' },
          { field: 'hours_since_update', operator: 'greater_than', value: '120' },
          ...brandCondition,
        ],
      },
      actions: [
        { field: 'status', value: 'solved' },
        {
          field: 'notification_user',
          value: [
            'requester_id',
            'Your TRANSFORMR support ticket has been closed — Ticket #{{ticket.id}}',
            `Hi {{ticket.requester.name}},

Since we haven't heard back, we've gone ahead and closed ticket #{{ticket.id}}.

If your issue is still happening, just reply to this email and we'll reopen it immediately — no need to submit a new request.

Keep transforming. 💪

— TRANSFORMR Support
support@transformr.ai`,
          ],
        },
      ],
    },
    // 3. Escalate tickets open > 48 hours
    {
      title: 'TRANSFORMR — Escalate open tickets after 48 hours',
      active: true,
      conditions: {
        all: [
          { field: 'status', operator: 'less_than', value: 'solved' },
          { field: 'hours_since_created', operator: 'greater_than', value: '48' },
          { field: 'priority', operator: 'is_not', value: 'urgent' },
          ...brandCondition,
        ],
      },
      actions: [
        { field: 'priority', value: 'high' },
        { field: 'add_tags', value: 'overdue transformr_overdue' },
      ],
    },
  ];

  for (const automation of automations) {
    const res = await apiCall('POST', '/api/v2/automations.json', { automation }, `Create automation: ${automation.title}`);
    if (res.success) results.automations.created++;
  }
}

// ─── STEP 3H: Macros ─────────────────────────────────────────────────────────
async function setupMacros() {
  console.log('\n══ 3H: Macros ═════════════════════════════════════════════════');

  const macros = [
    {
      title: 'TRANSFORMR — Request device info',
      actions: [
        {
          field: 'comment_value',
          value: `Hi {{ticket.requester.name}},

To help us investigate your issue with ticket #{{ticket.id}}, could you provide the following?

• **App version** — Settings → About → App Version
• **Device model** — e.g. iPhone 15 Pro, Samsung Galaxy S24
• **Operating system version** — e.g. iOS 17.4, Android 14
• **Steps to reproduce** — What exactly were you doing when the issue occurred?
• **Screenshots or screen recordings** — Attach to this reply if possible

The more detail you can share, the faster we can resolve this.

— TRANSFORMR Support
support@transformr.ai`,
        },
        { field: 'status', value: 'pending' },
      ],
    },
    {
      title: 'TRANSFORMR — Login / account fix',
      actions: [
        {
          field: 'comment_value',
          value: `Hi {{ticket.requester.name}},

Here are the steps to resolve most login and account issues on TRANSFORMR:

1. **Force-close the app** — Swipe TRANSFORMR up from the app switcher, then reopen it.
2. **Check your internet connection** — Try switching between Wi-Fi and cellular data.
3. **Use "Forgot Password"** — On the login screen, tap "Forgot Password" and follow the email reset link.
4. **Try a different sign-in method** — If you registered with Apple, Google, or email, try logging in with the same method you used originally.
5. **Reinstall the app** — Delete TRANSFORMR, reinstall from the App Store or Google Play, and sign in again. Your data is saved to your account.

If none of these work, reply with your registered email address and we'll look into your account directly.

— TRANSFORMR Support
support@transformr.ai`,
        },
        { field: 'status', value: 'pending' },
      ],
    },
    {
      title: 'TRANSFORMR — App crash troubleshoot',
      actions: [
        {
          field: 'comment_value',
          value: `Hi {{ticket.requester.name}},

Sorry to hear TRANSFORMR is crashing! Here's what to try:

1. **Update the app** — Open the App Store or Google Play and install any available updates.
2. **Restart your phone** — A full reboot clears memory and can resolve many crash issues.
3. **Check available storage** — Go to your phone settings and ensure you have at least 1GB of free space.
4. **Which screen does it crash on?** — Knowing exactly where the crash happens helps us identify the cause.
5. **Reinstall if needed** — Delete and reinstall TRANSFORMR. Your data is saved to your account.

Could you also let us know:
• Your device model and OS version?
• What you were doing right before the crash?
• Does it crash every time or occasionally?

— TRANSFORMR Support
support@transformr.ai`,
        },
        { field: 'status', value: 'pending' },
      ],
    },
    {
      title: 'TRANSFORMR — Billing / subscription',
      actions: [
        {
          field: 'comment_value',
          value: `Hi {{ticket.requester.name}},

TRANSFORMR subscriptions are managed directly through the App Store (iOS) or Google Play (Android). Here's what you need to know:

**Plans:**
• Free — Core tracking features
• Pro — $9.99/mo — AI Coach, advanced analytics, meal camera
• Elite — $14.99/mo — Lab results, supplements evidence, business tracking
• Partners — $19.99/mo — All Elite features + couples dashboard

**To manage your subscription:**
• **iPhone/iPad:** Settings → [Your Name] → Subscriptions → TRANSFORMR
• **Android:** Google Play → Profile → Payments & subscriptions → Subscriptions → TRANSFORMR

**For refunds:**
• Apple: [reportaproblem.apple.com](https://reportaproblem.apple.com)
• Google: Google Play → Order History → Request refund

If your subscription isn't reflecting in the app after purchase, try: Profile → Subscription → Restore Purchases.

Let me know if you need anything else!

— TRANSFORMR Support
support@transformr.ai`,
        },
        { field: 'status', value: 'pending' },
      ],
    },
    {
      title: 'TRANSFORMR — Data sync / lost workout',
      actions: [
        {
          field: 'comment_value',
          value: `Hi {{ticket.requester.name}},

Here are steps to recover or sync your TRANSFORMR data:

1. **Pull to refresh** — On the Home or History screen, pull down to force a sync.
2. **Check the sync indicator** — Look for the sync icon in the top corner. A spinning icon means it's still syncing.
3. **Force-close and reopen** — Swipe TRANSFORMR up from the app switcher and reopen it.
4. **Check your connection** — Data syncs automatically when online. If you were offline, sync happens when you reconnect.

To help us investigate further, could you tell us:
• When did the data go missing?
• What type of data (workout, meal, habit, etc.)?
• Were you online or offline at the time?

We'll look into this right away.

— TRANSFORMR Support
support@transformr.ai`,
        },
        { field: 'status', value: 'pending' },
      ],
    },
    {
      title: 'TRANSFORMR — Lab results not parsing',
      actions: [
        {
          field: 'comment_value',
          value: `Hi {{ticket.requester.name}},

Here are tips for getting accurate lab result scanning in TRANSFORMR:

1. **Photo clarity** — Hold the phone steady and ensure the text is sharp and in focus. Use good lighting.
2. **PDFs scan better than photos** — If your lab provider offers a PDF download, upload that instead of photographing the printout.
3. **Manual entry option** — After scanning, you can tap any result to manually adjust the value if the scan was off.
4. **Edit after scanning** — Tap the pencil icon on any result to correct a misread value.
5. **Partial results** — TRANSFORMR may not recognize every lab panel. For unsupported markers, use manual entry.

**Important:** TRANSFORMR provides informational tracking only and is not a medical diagnostic tool. Always consult your healthcare provider to interpret lab results.

If the issue persists, please attach the original file or a screenshot so we can investigate.

— TRANSFORMR Support
support@transformr.ai`,
        },
        { field: 'status', value: 'pending' },
      ],
    },
    {
      title: 'TRANSFORMR — Supplements / evidence question',
      actions: [
        {
          field: 'comment_value',
          value: `Hi {{ticket.requester.name}},

Great question about the supplements evidence system! Here's how it works:

**Evidence Badges:**
• 🟢 Strong — Multiple large, peer-reviewed studies support this supplement for your goals
• 🟡 Moderate — Some evidence exists; results vary by individual
• 🔴 Weak — Limited, conflicting, or low-quality evidence
• ⚪ Insufficient — Not enough data to assess

**Why does evidence vary by person?**
The ratings are personalized based on your profile: age, sex, health goals, existing conditions, and current supplement stack. The same supplement may show different evidence levels for different users.

**Plan availability:**
Supplement evidence ratings and AI-powered stack analysis are available on the Elite ($14.99/mo) and Partners ($19.99/mo) plans.

**Disclaimer:** TRANSFORMR's supplement information is for educational purposes only and is not medical advice. Always consult a healthcare provider before starting any new supplement.

Is there a specific supplement or rating you'd like us to look into?

— TRANSFORMR Support
support@transformr.ai`,
        },
        { field: 'status', value: 'pending' },
      ],
    },
    {
      title: 'TRANSFORMR — Feature request received',
      actions: [
        {
          field: 'comment_value',
          value: `Hi {{ticket.requester.name}},

Thank you for your feature suggestion! We've logged it for our product team.

We read every request — user feedback is a huge part of how we decide what to build next. While we can't promise a timeline or guarantee every feature will be added, your input genuinely shapes the roadmap.

Keep the ideas coming!

— TRANSFORMR Support
support@transformr.ai`,
        },
        { field: 'status', value: 'solved' },
      ],
    },
    {
      title: 'TRANSFORMR — Issue resolved — close ticket',
      actions: [
        {
          field: 'comment_value',
          value: `Hi {{ticket.requester.name}},

Glad we could help with ticket #{{ticket.id}}! I'm going to go ahead and mark this as resolved.

If the issue comes back or you have any other questions, just reply to this email and we'll reopen your ticket immediately.

Keep transforming. 💪

— TRANSFORMR Support
support@transformr.ai`,
        },
        { field: 'status', value: 'solved' },
      ],
    },
  ];

  for (const macro of macros) {
    const res = await apiCall('POST', '/api/v2/macros.json', { macro }, `Create macro: ${macro.title}`);
    if (res.success) results.macros.created++;
  }
}

// ─── STEP 3I: SLA Policy ─────────────────────────────────────────────────────
async function setupSla() {
  console.log('\n══ 3I: SLA Policy ═════════════════════════════════════════════');

  const slaBody = {
    sla_policy: {
      title: 'TRANSFORMR SLA Policy',
      description: 'Response time targets for TRANSFORMR support tickets',
      filter: {
        all: results.brandId
          ? [{ field: 'brand_id', operator: 'is', value: String(results.brandId) }]
          : [],
        any: [],
      },
      policy_metrics: [
        { priority: 'urgent', metric: 'first_reply_time', target: 60, business_hours: false },
        { priority: 'high', metric: 'first_reply_time', target: 240, business_hours: false },
        { priority: 'normal', metric: 'first_reply_time', target: 1440, business_hours: false },
        { priority: 'low', metric: 'first_reply_time', target: 2880, business_hours: false },
      ],
    },
  };

  const res = await apiCall('POST', '/api/v2/slas/policies.json', slaBody, 'Create TRANSFORMR SLA policy');
  if (res.success) {
    results.sla.created = true;
  } else {
    results.manualActions.push(
      'SLA: Create SLA policy manually in Zendesk Admin → Business rules → Service level agreements'
    );
  }
}

// ─── STEP 3J: Satisfaction Ratings ───────────────────────────────────────────
async function setupSatisfaction() {
  console.log('\n══ 3J: Satisfaction Ratings ═══════════════════════════════════');

  const res = await apiCall(
    'PUT',
    '/api/v2/account/settings.json',
    { settings: { satisfaction: { enabled: true } } },
    'Enable satisfaction ratings'
  );
  if (res.success || res.skipped) {
    results.satisfaction.status = 'enabled';
  } else {
    results.satisfaction.status = 'manual action needed';
    results.manualActions.push(
      'SATISFACTION: Enable in Zendesk Admin → Account → Satisfaction ratings → Turn on'
    );
  }
}

// ─── STEP 3K: Help Center Categories ────────────────────────────────────────
async function setupHelpCenter() {
  console.log('\n══ 3K: Help Center Categories ═════════════════════════════════');

  const categories = [
    'Getting Started',
    'AI Coach & Chat',
    'Workouts & Fitness',
    'Nutrition & Meals',
    'Supplements & Lab Results',
    'Habits, Goals & Challenges',
    'Sleep, Mood & Wellness',
    'Partner & Couples',
    'Business & Finance',
    'Billing & Plans',
    'Troubleshooting',
    'Privacy & Security',
  ];

  for (const name of categories) {
    const body = {
      category: {
        locale: 'en-us',
        name,
        ...(results.brandId ? { brand_id: results.brandId } : {}),
      },
    };
    const res = await apiCall('POST', '/api/v2/help_center/categories.json', body, `Create category: ${name}`);
    if (res.success) results.helpCenter.created++;
  }

  if (results.helpCenter.created < categories.length) {
    results.manualActions.push(
      'HELP CENTER: Some categories may need manual creation at Zendesk Admin → Guide → Categories'
    );
    results.manualActions.push(
      'HELP CENTER: Help Center must be activated first — Admin → Guide → Getting started → Activate Guide'
    );
  }
}

// ─── STEP 3L: Views ──────────────────────────────────────────────────────────
async function setupViews() {
  console.log('\n══ 3L: Agent Views ════════════════════════════════════════════');

  const brandCond = results.brandId
    ? [{ field: 'brand_id', operator: 'is', value: String(results.brandId) }]
    : [];

  const views = [
    {
      title: 'TRANSFORMR — All open tickets',
      active: true,
      conditions: {
        all: [{ field: 'status', operator: 'less_than', value: 'solved' }, ...brandCond],
      },
      columns: [
        { id: 'status' }, { id: 'requester' }, { id: 'created' },
        { id: 'subject' }, { id: 'priority' },
      ],
      group_by: 'priority',
      group_order: 'desc',
      sort_by: 'created',
      sort_order: 'asc',
    },
    {
      title: 'TRANSFORMR — Critical & escalated',
      active: true,
      conditions: {
        all: [
          { field: 'status', operator: 'less_than', value: 'solved' },
          { field: 'priority', operator: 'is', value: 'urgent' },
          ...brandCond,
        ],
      },
      sort_by: 'created',
      sort_order: 'asc',
    },
    {
      title: 'TRANSFORMR — Billing tickets',
      active: true,
      conditions: {
        all: [
          { field: 'status', operator: 'less_than', value: 'solved' },
          { field: 'current_tags', operator: 'includes', value: 'billing' },
          ...brandCond,
        ],
      },
      sort_by: 'created',
      sort_order: 'asc',
    },
    {
      title: 'TRANSFORMR — Crash reports',
      active: true,
      conditions: {
        all: [
          { field: 'status', operator: 'less_than', value: 'solved' },
          { field: 'current_tags', operator: 'includes', value: 'crash_report' },
          ...brandCond,
        ],
      },
      sort_by: 'created',
      sort_order: 'asc',
    },
    {
      title: 'TRANSFORMR — Feature requests',
      active: true,
      conditions: {
        all: [
          { field: 'current_tags', operator: 'includes', value: 'feature_request' },
          ...brandCond,
        ],
      },
      sort_by: 'created',
      sort_order: 'asc',
    },
    {
      title: 'TRANSFORMR — Pending > 24 hours',
      active: true,
      conditions: {
        all: [
          { field: 'status', operator: 'is', value: 'pending' },
          { field: 'hours_since_update', operator: 'greater_than', value: '24' },
          ...brandCond,
        ],
      },
      sort_by: 'updated',
      sort_order: 'asc',
    },
  ];

  for (const view of views) {
    const res = await apiCall('POST', '/api/v2/views.json', { view }, `Create view: ${view.title}`);
    if (res.success) results.views.created++;
  }
}

// ─── STEP 3M: Business Hours ─────────────────────────────────────────────────
async function setupBusinessHours() {
  console.log('\n══ 3M: Business Hours ═════════════════════════════════════════');

  const res = await apiCall('POST', '/api/v2/business_hours/schedules.json', {
    schedule: {
      name: 'TRANSFORMR Business Hours',
      time_zone: 'America/Phoenix',
      intervals: [
        { start_time: 540, end_time: 1020 },   // Mon 9AM-5PM MST (in minutes from Sun midnight)
        { start_time: 1980, end_time: 2460 },  // Tue
        { start_time: 3420, end_time: 3900 },  // Wed
        { start_time: 4860, end_time: 5340 },  // Thu
        { start_time: 6300, end_time: 6780 },  // Fri
      ],
    },
  }, 'Create TRANSFORMR business hours schedule');

  if (res.success) {
    results.businessHours.created = true;
    results.businessHours.scheduleId = res.body.schedule?.id;
  } else {
    results.manualActions.push(
      'BUSINESS HOURS: Create schedule manually — Zendesk Admin → Account → Business hours → Add schedule → Mon-Fri 9AM-5PM MST (America/Phoenix)'
    );
  }
}

// ─── STEP 3N: Finalize manual actions ────────────────────────────────────────
function finalizeManualActions() {
  // Always-manual items
  results.manualActions.push(
    'BRAND LOGO: Upload TRANSFORMR logo in Zendesk Admin → Account → Brands → TRANSFORMR → Upload logo\n  Source: C:\\dev\\transformr\\assets\\icons\\app-icon\\'
  );
  results.manualActions.push(
    'BRAND COLOR: Set brand color to #A855F7 in Zendesk Admin → Account → Brands → TRANSFORMR → Brand color'
  );
  results.manualActions.push(
    'HELP CENTER THEME: Customize Guide theme for TRANSFORMR brand — Admin → Guide → Customize design'
  );
  results.manualActions.push(
    'VOICE CHANNEL: Disable voice for TRANSFORMR brand — Admin → Channels → Voice → TRANSFORMR → Disable'
  );
  results.manualActions.push(
    'TESTING: Send a test email to support@transformr.ai and verify ticket creation'
  );
  results.manualActions.push(
    'TESTING: Verify auto-reply triggers fire correctly on new ticket creation'
  );
  results.manualActions.push(
    'TESTING: Test a macro by opening a ticket → Apply macro → Verify message'
  );
  results.manualActions.push(
    'TESTING: Solve a ticket and confirm satisfaction survey is sent'
  );
}

// ─── Print final report ───────────────────────────────────────────────────────
function printReport() {
  console.log('\n');
  console.log('TRANSFORMR ZENDESK SETUP — COMPLETE');
  console.log('════════════════════════════════════════════════════\n');

  console.log('BRAND');
  console.log(`  Name:                 TRANSFORMR`);
  console.log(`  Brand ID:             ${results.brandId || 'manual action needed'}`);

  console.log('\nCHANNELS');
  console.log(`  Email:                support@transformr.ai [${results.email.status}]`);
  console.log(`  SMS:                  manual — needs dedicated Twilio number`);
  console.log(`  Voice:                DISABLED (by design)`);

  console.log('\nTICKET SYSTEM');
  console.log(`  Custom fields:        ${results.fields.fieldIds.length} (IDs: ${results.fields.fieldIds.join(', ')})`);
  console.log(`  Ticket form:          ${results.form.created ? `created (ID: ${results.form.formId})` : 'not created'}`);

  console.log('\nAUTOMATION');
  console.log(`  Triggers:             ${results.triggers.created} (incl. 3 auto-troubleshoot)`);
  console.log(`  Automations:          ${results.automations.created}`);
  console.log(`  Macros:               ${results.macros.created}`);
  console.log(`  Views:                ${results.views.created}`);

  console.log('\nPOLICIES');
  console.log(`  SLA:                  ${results.sla.created ? 'created' : 'manual action needed'}`);
  console.log(`  Satisfaction:         ${results.satisfaction.status}`);
  console.log(`  Business hours:       ${results.businessHours.created ? `created (ID: ${results.businessHours.scheduleId})` : 'manual action needed'}`);

  console.log('\nHELP CENTER');
  console.log(`  Categories:           ${results.helpCenter.created} created`);

  console.log('\nMANUAL ACTIONS FOR TYSON:');
  results.manualActions.forEach((action, i) => {
    console.log(`  ${i + 1}. ${action}`);
  });

  console.log('\nLOG FILE: C:\\dev\\logs\\ZENDESK_TRANSFORMR_SETUP.txt');
  console.log('');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log('TRANSFORMR — Zendesk Setup');
  console.log(`Account: https://${BASE_URL}`);
  console.log(`Auth: ${EMAIL}`);
  console.log('');

  // Test auth first
  console.log('Testing authentication...');
  const test = await request('GET', '/api/v2/account.json');
  if (test.status === 401) {
    console.error('✗ Authentication failed. Check ZENDESK_EMAIL and ZENDESK_API_TOKEN in .env');
    process.exit(1);
  }
  if (test.status === 200) {
    console.log(`✓ Authenticated — account: ${test.body.account?.name || 'unknown'}`);
  }

  await setupBrand();
  await setupCustomFields();
  await setupTicketForm();
  await setupEmailChannel();
  await setupSmsChannel();
  await setupTriggers();
  await setupAutomations();
  await setupMacros();
  await setupSla();
  await setupSatisfaction();
  await setupHelpCenter();
  await setupViews();
  await setupBusinessHours();
  finalizeManualActions();
  printReport();
})();
