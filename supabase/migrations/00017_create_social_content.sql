CREATE TABLE social_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('transformation','weekly_recap','pr_celebration','milestone','time_lapse','custom')),
  template TEXT,
  content_data JSONB,
  image_url TEXT,
  video_url TEXT,
  caption TEXT,
  platform TEXT,
  is_shared BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
