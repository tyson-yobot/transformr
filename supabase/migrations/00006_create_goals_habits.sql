CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partnership_id UUID REFERENCES partnerships(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('fitness','nutrition','business','financial','personal','relationship','education','health','mindset')),
  goal_type TEXT CHECK (goal_type IN ('target','habit','milestone','project')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  countdown_id UUID REFERENCES countdowns(id),
  status TEXT CHECK (status IN ('active','completed','paused','abandoned')) DEFAULT 'active',
  priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 5),
  color TEXT,
  icon TEXT,
  is_staked BOOLEAN DEFAULT false,
  stake_amount NUMERIC,
  stake_charity TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC,
  target_date DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  celebration_message TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('fitness','nutrition','business','health','personal','mindset','finance','learning')),
  frequency TEXT CHECK (frequency IN ('daily','weekdays','weekends','custom')),
  custom_days INTEGER[],
  target_count INTEGER DEFAULT 1,
  unit TEXT,
  reminder_time TIME,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_shields INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  completed_count INTEGER DEFAULT 1,
  value NUMERIC,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT now()
);
