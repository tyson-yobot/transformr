# HubSpot Integration Setup

## 1. Private App Token

The token is already configured in `.env` as `HUBSPOT_ACCESS_TOKEN`.
Both TRANSFORMR and Construktr share the same HubSpot account.

If you want a separate Private App scoped to TRANSFORMR only
(recommended for per-product API usage visibility):

1. HubSpot → Settings → Integrations → Private Apps → Create a private app
2. Name: **TRANSFORMR Backend**
3. Scopes required:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`
   - `crm.schemas.contacts.read`
   - `crm.schemas.contacts.write`
4. Copy the access token → update `HUBSPOT_ACCESS_TOKEN` in `.env`

---

## 2. Add Token to Supabase Secrets

### Local development
Already in `.env` — the CLI picks it up when you `supabase functions serve`.

### Production
```
Supabase Dashboard → Project Settings → Edge Functions → Secrets
Add: HUBSPOT_ACCESS_TOKEN = pat-na2-xxxxxxxx-...
```

### Deploy the function
```powershell
cd C:\dev\transformr
supabase functions deploy hubspot-sync
```

---

## 3. Create Custom Contact Properties in HubSpot

**First create a property group:**
Settings → Properties → Groups tab → Create group → Name: **TRANSFORMR**

**Then create these contact properties inside that group:**

| Display Name | Internal Name | Type | Options |
|---|---|---|---|
| TRANSFORMR User ID | transformr_user_id | Single-line text | — |
| Subscription Tier | transformr_tier | Dropdown | free, pro, elite, partners |
| Subscription Status | transformr_subscription_status | Dropdown | active, trialing, past_due, canceled, paused |
| Onboarding Complete | transformr_onboarding_complete | Dropdown | true, false |
| Goal Direction | transformr_goal_direction | Dropdown | gain, lose, maintain |
| Current Weight (lbs) | transformr_current_weight | Number | — |
| Target Weight (lbs) | transformr_target_weight | Number | — |
| Date of Birth | transformr_date_of_birth | Date | — |
| Last Active Date | transformr_last_active | Date | — |

---

## 4. How the Sync Works

```
User action (signup / profile edit / weight log / subscription change)
  → Supabase DB write
    → PostgreSQL trigger (00050_hubspot_triggers.sql)
      → pg_net HTTP POST → hubspot-sync Edge Function
        → HubSpot API (create or update contact)
```

The trigger is **non-blocking**: a HubSpot API failure raises a database
WARNING but never rolls back the user's original transaction.

### What fires what

| DB event | Trigger | HubSpot action |
|---|---|---|
| New user signs up | profiles INSERT | Create contact with email, name, tier, onboarding flag |
| Profile edited | profiles UPDATE | Update all mapped fields |
| Subscription purchased / changed | subscriptions INSERT or UPDATE (tier/status columns) | Update transformr_tier + transformr_subscription_status |
| Weight logged | weight_logs INSERT | Update transformr_current_weight + transformr_last_active |

---

## 5. Vault Secrets (required for triggers)

The pg_net trigger reads `project_url` and `service_role_key` from Supabase
Vault — the same secrets used by the cron jobs in migration 00048.

Verify they exist:
```sql
select name from vault.decrypted_secrets
where name in ('project_url', 'service_role_key');
```

If missing, add them via the Supabase Dashboard:
Settings → Vault → Add new secret

---

## 6. Testing

After deploying:

1. Create a new test account in the app
2. Check HubSpot CRM → Contacts — the contact should appear within seconds
3. Complete onboarding → verify `transformr_onboarding_complete` flips to `true`
4. Log a weight → verify `transformr_current_weight` updates
5. Purchase a subscription → verify `transformr_tier` updates

To invoke the function manually for testing:
```powershell
cd C:\dev\transformr
supabase functions invoke hubspot-sync --body '{
  "type": "INSERT",
  "table": "profiles",
  "schema": "public",
  "record": {
    "id": "test-uuid",
    "email": "test@example.com",
    "display_name": "Test User",
    "subscription_tier": "free",
    "onboarding_completed": false
  },
  "old_record": null
}'
```
