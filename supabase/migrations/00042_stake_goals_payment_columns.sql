-- Add payment hold columns to stake_goals (hold/capture pattern)
ALTER TABLE stake_goals
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('pending_hold', 'active', 'passed', 'failed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS goal_type TEXT,
  ADD COLUMN IF NOT EXISTS target_value NUMERIC,
  ADD COLUMN IF NOT EXISTS goal_direction TEXT
    CHECK (goal_direction IN ('reach', 'maintain', 'not_exceed', 'lose', 'gain')),
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS evaluation_date DATE,
  ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS evaluation_evidence JSONB,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';

-- Copy existing stripe_payment_intent_id into payment_intent_id where set
UPDATE stake_goals
  SET payment_intent_id = stripe_payment_intent_id
  WHERE stripe_payment_intent_id IS NOT NULL AND payment_intent_id IS NULL;

-- Add stripe_payment_method_id to profiles (for saved payment methods)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
  ADD COLUMN IF NOT EXISTS estimated_hourly_value NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS grocery_budget_weekly NUMERIC DEFAULT 100,
  ADD COLUMN IF NOT EXISTS health_conditions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS goal_deadline DATE,
  ADD COLUMN IF NOT EXISTS workout_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_mrr NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_goal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_count INTEGER DEFAULT 0;
