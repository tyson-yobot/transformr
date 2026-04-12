-- =============================================================================
-- TRANSFORMR -- AI Predictions Table (Module 7)
-- Stores AI-generated predictive alerts (plateau detection, overtraining,
-- PR approaching, goal pacing, etc.) for the insights screen and dashboard.
-- =============================================================================

CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'plateau', 'overtraining', 'pr_approaching', 'weight_stall',
    'calorie_deficit_risk', 'sleep_debt', 'streak_risk',
    'goal_ahead', 'goal_behind', 'dehydration_risk', 'recovery_needed'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  data_points JSONB NOT NULL DEFAULT '{}',
  action_label TEXT,
  action_route TEXT,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_predictions_user_active
  ON ai_predictions(user_id, is_acknowledged, created_at DESC)
  WHERE is_acknowledged = false;
CREATE INDEX idx_predictions_category
  ON ai_predictions(user_id, category, created_at DESC);

ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own predictions"
  ON ai_predictions FOR ALL
  USING (auth.uid() = user_id);
