CREATE TABLE stake_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stake_amount NUMERIC NOT NULL,
  evaluation_frequency TEXT CHECK (evaluation_frequency IN ('daily','weekly','monthly')),
  charity_name TEXT,
  charity_url TEXT,
  partner_receives BOOLEAN DEFAULT false,
  stripe_payment_intent_id TEXT,
  evaluation_criteria JSONB,
  total_lost NUMERIC DEFAULT 0,
  total_saved NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stake_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_goal_id UUID REFERENCES stake_goals(id) ON DELETE CASCADE,
  period_start DATE,
  period_end DATE,
  passed BOOLEAN NOT NULL,
  evaluation_data JSONB,
  amount_at_risk NUMERIC,
  amount_charged NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
