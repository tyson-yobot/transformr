CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('technical','business','fitness','nutrition','language','creative','leadership','other')),
  proficiency INTEGER CHECK (proficiency BETWEEN 1 AND 10),
  target_proficiency INTEGER CHECK (target_proficiency BETWEEN 1 AND 10),
  hours_practiced NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT,
  status TEXT CHECK (status IN ('want_to_read','reading','completed','abandoned')) DEFAULT 'want_to_read',
  pages_total INTEGER,
  pages_read INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  key_takeaways TEXT[],
  ai_recommended BOOLEAN DEFAULT false,
  ai_recommendation_reason TEXT,
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT,
  category TEXT,
  url TEXT,
  progress_percent INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('planned','in_progress','completed','abandoned')) DEFAULT 'planned',
  certificate_url TEXT,
  notes TEXT,
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
