CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bedtime TIMESTAMPTZ NOT NULL,
  wake_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (wake_time - bedtime)) / 60
  ) STORED,
  quality INTEGER CHECK (quality BETWEEN 1 AND 5),
  caffeine_cutoff_time TIME,
  screen_cutoff_time TIME,
  notes TEXT,
  ai_sleep_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mood INTEGER CHECK (mood BETWEEN 1 AND 10),
  energy INTEGER CHECK (energy BETWEEN 1 AND 10),
  stress INTEGER CHECK (stress BETWEEN 1 AND 10),
  motivation INTEGER CHECK (motivation BETWEEN 1 AND 10),
  context TEXT CHECK (context IN ('morning','midday','afternoon','evening','post_workout','post_meal')),
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE readiness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER CHECK (score BETWEEN 1 AND 100),
  sleep_component INTEGER,
  soreness_component INTEGER,
  stress_component INTEGER,
  energy_component INTEGER,
  training_load_component INTEGER,
  recommendation TEXT CHECK (recommendation IN ('go_hard','moderate','light','rest')),
  ai_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);
