-- =============================================================================
-- TRANSFORMR -- Smart Supplement Reorder Predictions
-- Adds inventory tracking columns to user_supplements and creates the
-- proactive_messages table for AI-generated reminders and nudges.
-- =============================================================================

-- 1. Add inventory/reorder columns to user_supplements
ALTER TABLE user_supplements
  ADD COLUMN IF NOT EXISTS bottle_size INTEGER,
  ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reorder_reminder_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS purchase_url TEXT;

-- 2. Proactive messages table — used by reorder predictor, pattern detector,
--    and all AI-driven nudges across the app.
CREATE TABLE proactive_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'reorder',
    'plateau',
    'overtraining',
    'pr_approaching',
    'weight_stall',
    'calorie_deficit_risk',
    'sleep_debt',
    'streak_risk',
    'goal_ahead',
    'goal_behind',
    'dehydration_risk',
    'recovery_needed',
    'general',
    'meal_gap',
    'supplement_reminder',
    'lab_followup'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical'))
    DEFAULT 'info',
  action_label TEXT,
  action_url TEXT,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_proactive_messages_user_id
  ON proactive_messages(user_id, created_at DESC);
CREATE INDEX idx_proactive_messages_unread
  ON proactive_messages(user_id, is_read, is_dismissed, created_at DESC)
  WHERE is_dismissed = false;
CREATE INDEX idx_proactive_messages_category
  ON proactive_messages(user_id, category, created_at DESC);

-- 4. RLS
ALTER TABLE proactive_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own proactive messages"
  ON proactive_messages FOR ALL
  USING (auth.uid() = user_id);
