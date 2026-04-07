CREATE TABLE partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_b UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending','active','paused','ended')) DEFAULT 'pending',
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  shared_preferences JSONB DEFAULT '{
    "can_see_weight": true,
    "can_see_workouts": true,
    "can_see_nutrition": true,
    "can_see_habits": true,
    "can_see_goals": true,
    "can_see_mood": false,
    "can_see_journal": false,
    "can_see_business": false,
    "can_see_finance": false,
    "can_nudge": true,
    "can_challenge": true,
    "live_sync_enabled": true
  }'::jsonb,
  joint_streak INTEGER DEFAULT 0,
  longest_joint_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a, user_b)
);
