-- =============================================================================
-- Migration 00040: Health sync columns
-- Adds step_logs table and missing health-platform columns to existing tables.
-- These columns are written by the useHealthData sync path (Apple Health /
-- Google Fit) which uses a date-keyed upsert rather than bedtime/wake_time.
-- =============================================================================

-- ------------------------------------------------------------------ step_logs
CREATE TABLE IF NOT EXISTS step_logs (
  id         UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID       REFERENCES profiles(id) ON DELETE CASCADE,
  date       DATE       NOT NULL,
  steps      INTEGER    NOT NULL DEFAULT 0,
  source     TEXT       NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE step_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own step logs"
  ON step_logs FOR ALL USING (auth.uid() = user_id);

-- ------------------------------------------------------------------ sleep_logs
-- Add health-platform columns (nullable so manual entries are unaffected)
ALTER TABLE sleep_logs
  ADD COLUMN IF NOT EXISTS date          DATE,
  ADD COLUMN IF NOT EXISTS duration_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS quality_score  NUMERIC,
  ADD COLUMN IF NOT EXISTS source         TEXT;

-- Unique index for health-platform upsert (only when date is set)
CREATE UNIQUE INDEX IF NOT EXISTS sleep_logs_user_date_ux
  ON sleep_logs (user_id, date)
  WHERE date IS NOT NULL;

-- ------------------------------------------------------------------ weight_logs
-- Add health-platform columns (nullable so manual entries are unaffected)
ALTER TABLE weight_logs
  ADD COLUMN IF NOT EXISTS date      DATE,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS source    TEXT;

-- Unique index for health-platform upsert (only when date is set)
CREATE UNIQUE INDEX IF NOT EXISTS weight_logs_user_date_ux
  ON weight_logs (user_id, date)
  WHERE date IS NOT NULL;
