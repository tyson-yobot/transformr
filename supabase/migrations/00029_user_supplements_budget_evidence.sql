-- =============================================================================
-- TRANSFORMR -- Budget-Aware Supplements + Evidence
-- user_supplements: enhanced supplement tracking with tiers, evidence levels,
-- cost tracking, and priority ranking. The ai-chat-coach Edge Function already
-- queries this table (defensively) so this migration wires up the schema it
-- expects. Also adds a supplement_budget_monthly column to profiles.
-- =============================================================================

-- 1. Add monthly supplement budget to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS supplement_budget_monthly NUMERIC DEFAULT 0;

-- 2. user_supplements table
CREATE TABLE user_supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  timing TEXT CHECK (timing IN (
    'morning',
    'pre_workout',
    'post_workout',
    'with_meals',
    'evening',
    'bedtime',
    'as_needed'
  )) DEFAULT 'morning',
  frequency TEXT DEFAULT 'daily',
  category TEXT CHECK (category IN (
    'protein',
    'creatine',
    'vitamin',
    'mineral',
    'amino_acid',
    'pre_workout',
    'post_workout',
    'sleep',
    'adaptogen',
    'omega',
    'probiotic',
    'other'
  )) DEFAULT 'other',
  tier TEXT NOT NULL CHECK (tier IN ('essential', 'recommended', 'optional'))
    DEFAULT 'recommended',
  priority INTEGER NOT NULL DEFAULT 50,
  evidence_level TEXT CHECK (evidence_level IN (
    'strong',
    'moderate',
    'emerging',
    'anecdotal'
  )) DEFAULT 'moderate',
  evidence_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  monthly_cost NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_ai_recommended BOOLEAN NOT NULL DEFAULT false,
  ai_recommendation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Supplement log for daily tracking (links to user_supplements)
CREATE TABLE user_supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES user_supplements(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Indexes
CREATE INDEX idx_user_supplements_user_id
  ON user_supplements(user_id, priority ASC);
CREATE INDEX idx_user_supplements_active
  ON user_supplements(user_id, is_active, tier)
  WHERE is_active = true;
CREATE INDEX idx_user_supplement_logs_user_id
  ON user_supplement_logs(user_id, taken_at DESC);
CREATE INDEX idx_user_supplement_logs_supplement
  ON user_supplement_logs(supplement_id, taken_at DESC);

-- 5. Row Level Security
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_supplement_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own user_supplements"
  ON user_supplements FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage their own supplement logs"
  ON user_supplement_logs FOR ALL
  USING (auth.uid() = user_id);

-- 6. Auto-update user_supplements.updated_at
CREATE OR REPLACE FUNCTION touch_user_supplement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_supplements_touch_updated_at
BEFORE UPDATE ON user_supplements
FOR EACH ROW EXECUTE FUNCTION touch_user_supplement_updated_at();
