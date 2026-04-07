CREATE TABLE countdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date DATE NOT NULL,
  emoji TEXT DEFAULT '🎯',
  is_primary BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#6366F1',
  linked_goal_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
