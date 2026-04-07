CREATE TABLE community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT,
  metric TEXT,
  target_value NUMERIC,
  start_date DATE,
  end_date DATE,
  max_participants INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_progress NUMERIC DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE community_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('consistency','volume','streaks','prs','overall')),
  score NUMERIC DEFAULT 0,
  rank INTEGER,
  period TEXT CHECK (period IN ('weekly','monthly','all_time')),
  period_start DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);
