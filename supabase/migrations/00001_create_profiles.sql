CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height_inches NUMERIC,
  current_weight NUMERIC,
  goal_weight NUMERIC,
  goal_direction TEXT CHECK (goal_direction IN ('gain', 'lose', 'maintain')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'extra_active')),
  daily_calorie_target INTEGER,
  daily_protein_target INTEGER,
  daily_carb_target INTEGER,
  daily_fat_target INTEGER,
  daily_water_target_oz INTEGER DEFAULT 100,
  timezone TEXT DEFAULT 'America/Phoenix',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  notification_preferences JSONB DEFAULT '{
    "wake_up": {"enabled": true, "time": "07:00"},
    "meals": {"enabled": true, "times": ["08:00","12:00","15:00","18:00","21:00"]},
    "gym": {"enabled": true, "time": "09:00"},
    "sleep": {"enabled": true, "time": "23:00"},
    "water": {"enabled": true, "interval_minutes": 60},
    "daily_checkin": {"enabled": true, "time": "22:00"},
    "weekly_review": {"enabled": true, "day": "sunday", "time": "10:00"},
    "focus_reminder": {"enabled": true, "time": "10:00"},
    "supplement": {"enabled": true},
    "partner_activity": {"enabled": true}
  }'::jsonb,
  voice_commands_enabled BOOLEAN DEFAULT true,
  narrator_enabled BOOLEAN DEFAULT false,
  narrator_voice TEXT DEFAULT 'default',
  spotify_connected BOOLEAN DEFAULT false,
  spotify_access_token TEXT,
  spotify_refresh_token TEXT,
  stripe_customer_id TEXT,
  watch_paired BOOLEAN DEFAULT false,
  expo_push_token TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
