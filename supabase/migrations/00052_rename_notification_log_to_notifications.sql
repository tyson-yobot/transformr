-- Rename notification_log → notifications to align with Edge Function expectations.
-- Audit reference: docs/audit/NOTIFICATIONS-AUDIT-2026-04-30.md (Bug 2)
alter table public.notification_log
  rename to notifications;

-- Backward-compatible view for any code still referencing the old name
create or replace view public.notification_log as
  select * from public.notifications;

-- Grant select on view so existing RLS-policied selects continue working
grant select on public.notification_log to authenticated;
