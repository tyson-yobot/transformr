-- Schedule edge functions via pg_cron + pg_net.
-- These replace the [cron] block that was removed from config.toml
-- (Supabase CLI 2.90+ does not support a top-level [cron] config key).

-- Enable required extensions (idempotent)
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net  with schema extensions;

-- Unschedule first so this migration is idempotent on re-runs.
select cron.unschedule('stake-evaluator-daily')   where exists (select 1 from cron.job where jobname = 'stake-evaluator-daily');
select cron.unschedule('monthly-retrospective')   where exists (select 1 from cron.job where jobname = 'monthly-retrospective');
select cron.unschedule('health-roi-report')       where exists (select 1 from cron.job where jobname = 'health-roi-report');

-- stake-evaluator: runs daily at 02:00 UTC
select cron.schedule(
  'stake-evaluator-daily',
  '0 2 * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/stake-evaluator',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ai-monthly-retrospective: runs on the 1st of each month at 08:00 UTC
select cron.schedule(
  'monthly-retrospective',
  '0 8 1 * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/ai-monthly-retrospective',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ai-correlation (health-roi-report): runs on the 1st of each month at 06:00 UTC
select cron.schedule(
  'health-roi-report',
  '0 6 1 * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/ai-correlation',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);
