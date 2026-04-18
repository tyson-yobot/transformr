-- Add posture_analysis_results table
CREATE TABLE IF NOT EXISTS posture_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analyzed_at timestamptz DEFAULT now(),
  image_base64 text,
  front_view jsonb,
  side_view jsonb,
  overall_score integer CHECK (overall_score BETWEEN 0 AND 100),
  issues text[],
  recommendations text[],
  exercises_prescribed jsonb,
  follow_up_date date
);
CREATE INDEX IF NOT EXISTS idx_posture_user ON posture_analysis_results(user_id, analyzed_at DESC);
ALTER TABLE posture_analysis_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own posture" ON posture_analysis_results FOR ALL USING (auth.uid() = user_id);
