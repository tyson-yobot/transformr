-- =============================================================================
-- TRANSFORMR Migration 00047 — Monthly Retrospectives
-- Stores AI-generated monthly retrospective letters per user per month.
-- One row per user/month combination.
-- =============================================================================

CREATE TABLE IF NOT EXISTS monthly_retrospectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  letter text,
  headline text,
  key_stats jsonb,
  wins text[],
  growth_areas text[],
  next_month_focus text,
  generated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, month)
);

ALTER TABLE monthly_retrospectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own retrospectives"
  ON monthly_retrospectives
  FOR ALL
  USING (auth.uid() = user_id);
