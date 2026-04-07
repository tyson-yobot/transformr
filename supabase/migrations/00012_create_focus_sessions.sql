CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_description TEXT,
  category TEXT CHECK (category IN ('coding','business','marketing','learning','admin','creative','other')),
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  distractions_count INTEGER DEFAULT 0,
  productivity_rating INTEGER CHECK (productivity_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
