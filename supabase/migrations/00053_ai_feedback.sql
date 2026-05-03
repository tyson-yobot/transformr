-- =============================================================================
-- TRANSFORMR Migration 00053: AI Feedback Table
-- Stores user feedback on AI-generated recommendations for the transparency
-- "Why this?" layer. Enables recommendation quality tracking and model improvement.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ai_service TEXT NOT NULL,
  recommendation_id TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('not_helpful', 'regenerate', 'helpful', 'dismissed')),
  context_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON ai_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_service ON ai_feedback(ai_service);
CREATE INDEX idx_ai_feedback_created ON ai_feedback(created_at DESC);
