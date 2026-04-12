-- =============================================================================
-- TRANSFORMR -- Lab Work Scanner + Interpreter
-- Users upload lab work (bloodwork, hormone panels, etc.), the app stores the
-- original document in a private storage bucket, and Claude Sonnet extracts
-- biomarkers + generates a wellness interpretation. Every interpretation is
-- prefaced with compliance language and uses "reference range" framing --
-- never diagnosis, treatment, or cure.
-- =============================================================================

-- 1. Private storage bucket for lab files (PDFs and images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-uploads', 'lab-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Lab uploads table -- one row per uploaded document
CREATE TABLE lab_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Lab Work',
  lab_name TEXT,
  collected_at DATE,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf')),
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'complete',
    'failed'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Lab interpretations table -- the AI summary of an upload
CREATE TABLE lab_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES lab_uploads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  overall_summary TEXT NOT NULL,
  wellness_score INTEGER CHECK (wellness_score BETWEEN 0 AND 100),
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  concerns JSONB NOT NULL DEFAULT '[]'::jsonb,
  lifestyle_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  follow_up_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  disclaimer_text TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_in INTEGER,
  tokens_out INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Lab biomarkers table -- one row per detected marker (HDL, LDL, TSH, etc.)
CREATE TABLE lab_biomarkers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES lab_uploads(id) ON DELETE CASCADE,
  interpretation_id UUID REFERENCES lab_interpretations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'metabolic',
    'lipid',
    'hormone',
    'thyroid',
    'vitamin',
    'mineral',
    'inflammation',
    'liver',
    'kidney',
    'blood_count',
    'other'
  )) DEFAULT 'other',
  value NUMERIC,
  unit TEXT,
  reference_low NUMERIC,
  reference_high NUMERIC,
  flag TEXT CHECK (flag IN ('low', 'normal', 'high', 'optimal', 'suboptimal', 'unknown'))
    DEFAULT 'unknown',
  trend_note TEXT,
  collected_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Indexes
CREATE INDEX idx_lab_uploads_user_id
  ON lab_uploads(user_id, created_at DESC);
CREATE INDEX idx_lab_uploads_status
  ON lab_uploads(user_id, status);
CREATE INDEX idx_lab_interpretations_user_id
  ON lab_interpretations(user_id, created_at DESC);
CREATE INDEX idx_lab_interpretations_upload_id
  ON lab_interpretations(upload_id);
CREATE INDEX idx_lab_biomarkers_user_id
  ON lab_biomarkers(user_id, collected_at DESC);
CREATE INDEX idx_lab_biomarkers_upload_id
  ON lab_biomarkers(upload_id);
CREATE INDEX idx_lab_biomarkers_name
  ON lab_biomarkers(user_id, name, collected_at DESC);

-- 6. Row Level Security
ALTER TABLE lab_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_biomarkers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own lab uploads"
  ON lab_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own lab uploads"
  ON lab_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own lab uploads"
  ON lab_uploads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own lab uploads"
  ON lab_uploads FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users read their own lab interpretations"
  ON lab_interpretations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own lab interpretations"
  ON lab_interpretations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own lab interpretations"
  ON lab_interpretations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users read their own lab biomarkers"
  ON lab_biomarkers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own lab biomarkers"
  ON lab_biomarkers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own lab biomarkers"
  ON lab_biomarkers FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Storage policies -- lab files live under {user_id}/{upload_id}.{ext}
CREATE POLICY "Users read their own lab files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lab-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users upload their own lab files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lab-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete their own lab files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lab-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 8. Trigger -- keep lab_uploads.updated_at fresh
CREATE OR REPLACE FUNCTION touch_lab_upload_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lab_uploads_touch_updated_at
BEFORE UPDATE ON lab_uploads
FOR EACH ROW EXECUTE FUNCTION touch_lab_upload_updated_at();
