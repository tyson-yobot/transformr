-- Add longest_streak tracking column to challenge_enrollments.
-- The TypeScript type already declares this field; the DB column was missing.
ALTER TABLE challenge_enrollments
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
