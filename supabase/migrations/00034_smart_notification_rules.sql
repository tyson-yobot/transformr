-- =============================================================================
-- TRANSFORMR -- Smart Notification Rules (Module 8)
-- Stores user-customizable notification rules and AI-driven trigger configs.
-- The smart-notification-engine Edge Function evaluates these per user.
-- =============================================================================

CREATE TABLE smart_notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'missed_workout',
    'missed_meal_log',
    'water_reminder',
    'supplement_reminder',
    'sleep_window',
    'streak_at_risk',
    'weight_logged_weekly',
    'journal_prompt',
    'focus_session_reminder',
    'goal_deadline_approaching',
    'mood_check_in',
    'recovery_day'
  )),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  cooldown_hours INTEGER NOT NULL DEFAULT 24,
  custom_message TEXT,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_notification_rules_user_trigger
  ON smart_notification_rules(user_id, trigger_type);

CREATE INDEX idx_notification_rules_enabled
  ON smart_notification_rules(user_id, is_enabled)
  WHERE is_enabled = true;

ALTER TABLE smart_notification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own notification rules"
  ON smart_notification_rules FOR ALL
  USING (auth.uid() = user_id);

-- Seed default rules for existing users via a function
CREATE OR REPLACE FUNCTION seed_notification_rules()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO smart_notification_rules (user_id, trigger_type)
  VALUES
    (NEW.id, 'missed_workout'),
    (NEW.id, 'missed_meal_log'),
    (NEW.id, 'water_reminder'),
    (NEW.id, 'supplement_reminder'),
    (NEW.id, 'sleep_window'),
    (NEW.id, 'streak_at_risk'),
    (NEW.id, 'weight_logged_weekly'),
    (NEW.id, 'journal_prompt'),
    (NEW.id, 'focus_session_reminder'),
    (NEW.id, 'goal_deadline_approaching'),
    (NEW.id, 'mood_check_in'),
    (NEW.id, 'recovery_day');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_seed_notification_rules
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION seed_notification_rules();
