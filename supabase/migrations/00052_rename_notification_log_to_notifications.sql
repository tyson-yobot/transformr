-- Rename notification_log → notifications to align with Edge Function
-- expectations (audit 2026-04-30 finding).
--
-- Seven Edge Functions (daily-reminder, daily-accountability, partner-nudge,
-- streak-calculator, achievement-evaluator, stake-evaluator, stripe-webhook)
-- insert into "notifications" which did not exist. The actual table was
-- "notification_log". This rename fixes the mismatch.
--
-- A backward-compatible view keeps challenge-evaluator (which references
-- "notification_log") working without code changes.

ALTER TABLE public.notification_log RENAME TO notifications;

-- Indexes and RLS policies follow the renamed table automatically.
-- No data loss; this is a metadata rename only.

-- Backward-compatible view so existing code referencing the old name
-- continues to work (challenge-evaluator uses "notification_log").
CREATE VIEW public.notification_log AS SELECT * FROM public.notifications;
