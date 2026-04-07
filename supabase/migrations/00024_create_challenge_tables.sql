-- Challenge Center feature
-- Provides pre-loaded and custom challenge definitions, user enrollments,
-- and daily completion tracking (e.g., 75 Hard, Couch to 5K).

-- 1. Challenge definitions (system + custom)
CREATE TABLE challenge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  category TEXT CHECK (category IN ('mental_toughness','fitness','nutrition','running','strength','lifestyle','custom')),
  rules JSONB NOT NULL,
  restart_on_failure BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  icon TEXT,
  color TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced','extreme')),
  estimated_daily_time_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. User challenge enrollments
CREATE TABLE challenge_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenge_definitions(id),
  partnership_id UUID REFERENCES partnerships(id),
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE NOT NULL,
  actual_end_date DATE,
  status TEXT CHECK (status IN ('active','completed','failed','abandoned')) DEFAULT 'active',
  current_day INTEGER DEFAULT 1,
  restart_count INTEGER DEFAULT 0,
  configuration JSONB,
  stake_goal_id UUID REFERENCES stake_goals(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Daily completion tracking
CREATE TABLE challenge_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES challenge_enrollments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed JSONB NOT NULL,
  all_tasks_completed BOOLEAN DEFAULT false,
  auto_verified JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(enrollment_id, date)
);

-- Indexes
CREATE INDEX idx_challenge_enrollments_user_id ON challenge_enrollments(user_id);
CREATE INDEX idx_challenge_enrollments_challenge_id ON challenge_enrollments(challenge_id);
CREATE INDEX idx_challenge_enrollments_status ON challenge_enrollments(status);
CREATE INDEX idx_challenge_daily_logs_enrollment_id ON challenge_daily_logs(enrollment_id);
CREATE INDEX idx_challenge_daily_logs_date ON challenge_daily_logs(date);

-- RLS: challenge_definitions
ALTER TABLE challenge_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system challenge definitions"
  ON challenge_definitions FOR SELECT
  USING (is_system = true);

CREATE POLICY "Users can read their own custom challenge definitions"
  ON challenge_definitions FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create custom challenge definitions"
  ON challenge_definitions FOR INSERT
  WITH CHECK (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Users can update their own custom challenge definitions"
  ON challenge_definitions FOR UPDATE
  USING (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Users can delete their own custom challenge definitions"
  ON challenge_definitions FOR DELETE
  USING (auth.uid() = created_by AND is_system = false);

-- RLS: challenge_enrollments
ALTER TABLE challenge_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own enrollments"
  ON challenge_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments"
  ON challenge_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON challenge_enrollments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollments"
  ON challenge_enrollments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS: challenge_daily_logs
ALTER TABLE challenge_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own daily logs"
  ON challenge_daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily logs"
  ON challenge_daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs"
  ON challenge_daily_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily logs"
  ON challenge_daily_logs FOR DELETE
  USING (auth.uid() = user_id);
