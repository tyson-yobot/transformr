-- HubSpot CRM sync: fire the hubspot-sync Edge Function on every
-- meaningful profile or subscription change.
--
-- Uses pg_net (already enabled via 00048) and vault secrets
-- (same pattern as stake-evaluator-daily / monthly-retrospective).
--
-- The trigger is intentionally non-blocking: any HubSpot failure
-- raises a WARNING but never aborts the originating transaction.

-- pg_net is already enabled; this line is idempotent.
create extension if not exists pg_net with schema extensions;

-- ─────────────────────────────────────────────────────────────────────────────
-- Shared trigger function
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function notify_hubspot_sync()
returns trigger as $$
begin
  perform net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/hubspot-sync',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body    := jsonb_build_object(
      'type',       TG_OP,
      'table',      TG_TABLE_NAME,
      'schema',     TG_TABLE_SCHEMA,
      'record',     to_jsonb(NEW),
      'old_record', case when TG_OP = 'UPDATE' then to_jsonb(OLD) else null end
    )
  );
  return NEW;
exception when others then
  raise warning '[hubspot-sync] trigger failed for % on %: %', TG_OP, TG_TABLE_NAME, sqlerrm;
  return NEW;
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles: every signup and profile update syncs to HubSpot
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists hubspot_profile_sync on profiles;
create trigger hubspot_profile_sync
  after insert or update on profiles
  for each row
  execute function notify_hubspot_sync();

-- ─────────────────────────────────────────────────────────────────────────────
-- subscriptions: tier + status changes sync to HubSpot
-- (subscription-sync Edge Function writes here from Stripe webhooks,
--  so this trigger captures all subscription lifecycle events)
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists hubspot_subscription_sync on subscriptions;
create trigger hubspot_subscription_sync
  after insert or update of tier, status on subscriptions
  for each row
  execute function notify_hubspot_sync();

-- ─────────────────────────────────────────────────────────────────────────────
-- weight_logs: new weight entries update transformr_current_weight in HubSpot
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists hubspot_weight_sync on weight_logs;
create trigger hubspot_weight_sync
  after insert on weight_logs
  for each row
  execute function notify_hubspot_sync();
