CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('saas','service','product','consulting','other')),
  valuation NUMERIC,
  monthly_revenue NUMERIC DEFAULT 0,
  monthly_expenses NUMERIC DEFAULT 0,
  customer_count INTEGER DEFAULT 0,
  logo_url TEXT,
  stripe_account_id TEXT,
  stripe_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE revenue_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('subscription','one_time','consulting','affiliate','other')),
  source TEXT DEFAULT 'manual',
  customer_name TEXT,
  description TEXT,
  stripe_payment_id TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expense_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  category TEXT CHECK (category IN ('infrastructure','marketing','tools','payroll','legal','contractors','office','travel','other')),
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_interval TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  plan_tier TEXT,
  mrr NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('trial','active','churned','paused')) DEFAULT 'trial',
  started_at DATE,
  churned_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE business_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_metric TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  target_date DATE,
  celebration_message TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
