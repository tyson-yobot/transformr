CREATE TABLE nfc_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL,
  label TEXT NOT NULL,
  action TEXT NOT NULL,
  action_params JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE geofence_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  radius_meters INTEGER DEFAULT 100,
  trigger_on TEXT CHECK (trigger_on IN ('enter','exit','both')) DEFAULT 'enter',
  action TEXT NOT NULL,
  action_params JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
