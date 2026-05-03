# Prompt 10: AI Feedback Table Migration

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt creates ONE new migration file in `supabase/migrations/`. No other files are touched. Existing migrations are NEVER modified.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Create the `ai_feedback` table needed for the transparency "Why this?" layer. This table stores user feedback on AI recommendations.

## Migration File
Create `supabase/migrations/00053_ai_feedback.sql`:

```sql
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
```

## Verification Gates
- [ ] Migration file created at correct path
- [ ] Migration number is sequential (check last migration number)
- [ ] No existing migration files modified
- [ ] RLS policies enable users to manage only their own feedback
- [ ] Table has proper foreign key to profiles
- [ ] CHECK constraint on feedback_type limits to valid values

## Important Notes
- If migration 00053 already exists (check first!), use the next available number
- Do NOT run the migration locally (Tyson manages Supabase migrations)
- Do NOT modify any existing migration file
