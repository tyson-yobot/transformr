// NOTE: No AI API calls — compliance preamble not required
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const HUBSPOT_TOKEN = Deno.env.get('HUBSPOT_ACCESS_TOKEN');
const HUBSPOT_API = 'https://api.hubapi.com';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

interface HubSpotSearchResult {
  total: number;
  results: Array<{ id: string }>;
}

interface HubSpotCreateResult {
  id: string;
}

async function findContact(email: string): Promise<string | null> {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [
        { filters: [{ propertyName: 'email', operator: 'EQ', value: email }] },
      ],
      properties: ['email'],
      limit: 1,
    }),
  });
  const data = (await res.json()) as HubSpotSearchResult;
  return data.total > 0 ? data.results[0].id : null;
}

async function upsertContact(
  email: string,
  properties: Record<string, string>,
): Promise<{ id: string; created: boolean }> {
  const existingId = await findContact(email);

  if (existingId) {
    const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/${existingId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HubSpot PATCH failed: ${res.status} ${err}`);
    }
    return { id: existingId, created: false };
  }

  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties: { email, ...properties } }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HubSpot POST failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as HubSpotCreateResult;
  return { id: data.id, created: true };
}

// Best-effort split of a single display_name field into firstname/lastname
function splitDisplayName(displayName: string): { firstname: string; lastname: string } {
  const parts = (displayName ?? '').trim().split(/\s+/);
  return {
    firstname: parts[0] ?? '',
    lastname: parts.slice(1).join(' '),
  };
}

serve(async (req: Request) => {
  if (!HUBSPOT_TOKEN) {
    console.error('[hubspot-sync] HUBSPOT_ACCESS_TOKEN not configured');
    return new Response('HubSpot not configured', { status: 500 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { type, table, record } = payload;

  const ok = (extra: Record<string, unknown> = {}) =>
    new Response(JSON.stringify({ success: true, table, type, ...extra }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    // ── profiles ──────────────────────────────────────────────────────────
    if (table === 'profiles') {
      const email = record.email as string | undefined;
      if (!email) return ok({ skipped: 'no_email' });

      const { firstname, lastname } = splitDisplayName(record.display_name as string);

      const properties: Record<string, string> = {
        firstname,
        lastname,
        transformr_user_id: (record.id as string) ?? '',
        transformr_tier: (record.subscription_tier as string) ?? 'free',
        transformr_onboarding_complete: record.onboarding_completed ? 'true' : 'false',
        transformr_goal_direction: (record.goal_direction as string) ?? '',
      };

      if (record.current_weight != null)
        properties.transformr_current_weight = String(record.current_weight);
      if (record.goal_weight != null)
        properties.transformr_target_weight = String(record.goal_weight);
      if (record.date_of_birth)
        properties.transformr_date_of_birth = record.date_of_birth as string;

      const result = await upsertContact(email, properties);
      return ok({ hubspot_id: result.id, created: result.created });
    }

    // ── subscriptions ─────────────────────────────────────────────────────
    if (table === 'subscriptions') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', record.user_id)
        .single();

      if (!profile?.email) return ok({ skipped: 'no_profile_email' });

      const result = await upsertContact(profile.email, {
        transformr_tier: (record.tier as string) ?? 'free',
        transformr_subscription_status: (record.status as string) ?? '',
      });
      return ok({ hubspot_id: result.id, created: result.created });
    }

    // ── weight_logs ───────────────────────────────────────────────────────
    if (table === 'weight_logs') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', record.user_id)
        .single();

      if (!profile?.email) return ok({ skipped: 'no_profile_email' });

      const result = await upsertContact(profile.email, {
        transformr_current_weight: String(record.weight ?? ''),
        transformr_last_active: new Date().toISOString().split('T')[0],
      });
      return ok({ hubspot_id: result.id, created: result.created });
    }

    return ok({ skipped: 'unhandled_table' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[hubspot-sync] Error on ${table}:`, message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
