CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  is_active BOOLEAN DEFAULT true,
  layout JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
