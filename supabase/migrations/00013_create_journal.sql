CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_prompt TEXT,
  entry_text TEXT,
  wins TEXT[],
  struggles TEXT[],
  gratitude TEXT[],
  tomorrow_focus TEXT[],
  ai_response TEXT,
  ai_patterns_detected JSONB,
  mood_at_entry INTEGER CHECK (mood_at_entry BETWEEN 1 AND 10),
  tags TEXT[],
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE monthly_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  letter_text TEXT NOT NULL,
  highlights JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);
