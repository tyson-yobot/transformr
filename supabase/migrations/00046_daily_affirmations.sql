-- =============================================================================
-- TRANSFORMR Migration 00046 — Daily Affirmations
-- Stores AI-generated morning affirmations and evening wind-down content
-- per user per day. One row per user/date/type combination.
-- =============================================================================

CREATE TABLE IF NOT EXISTS daily_affirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('morning', 'evening')),
  affirmation text,
  intention text,
  action_tip text,
  reflection_prompt text,
  gratitude_cue text,
  wind_down_exercise text,
  tomorrow_prep text,
  audio_script text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date, type)
);

CREATE INDEX IF NOT EXISTS idx_affirmations_user_date
  ON daily_affirmations(user_id, date DESC);

ALTER TABLE daily_affirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own affirmations"
  ON daily_affirmations
  FOR ALL
  USING (auth.uid() = user_id);
