-- =============================================================================
-- TRANSFORMR -- AI Screen Insights Cache (Module 6)
-- Caches contextual AI micro-insights per screen so they load instantly and
-- refresh on a cooldown (default 4 hours). One insight per user per screen_key.
-- =============================================================================

CREATE TABLE ai_screen_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  screen_key TEXT NOT NULL,
  insight TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One insight per user per screen
CREATE UNIQUE INDEX idx_screen_insights_user_screen
  ON ai_screen_insights(user_id, screen_key);

CREATE INDEX idx_screen_insights_freshness
  ON ai_screen_insights(user_id, refreshed_at DESC);

-- RLS
ALTER TABLE ai_screen_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own screen insights"
  ON ai_screen_insights FOR ALL
  USING (auth.uid() = user_id);
