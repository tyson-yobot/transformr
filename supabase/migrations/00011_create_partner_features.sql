CREATE TABLE partner_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('encouragement','reminder','celebration','challenge','reaction')),
  message TEXT,
  emoji TEXT,
  reaction_to TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE partner_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID REFERENCES partnerships(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK (challenge_type IN ('both_complete','competition','streak','custom')),
  metric TEXT,
  target_value NUMERIC,
  duration_days INTEGER,
  start_date DATE,
  end_date DATE,
  user_a_progress NUMERIC DEFAULT 0,
  user_b_progress NUMERIC DEFAULT 0,
  winner_id UUID REFERENCES profiles(id),
  stake_amount NUMERIC,
  status TEXT CHECK (status IN ('active','completed','expired')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
