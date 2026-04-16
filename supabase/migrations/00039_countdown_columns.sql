-- =============================================================================
-- Migration 00039: Add countdown goal columns to profiles
-- countdown_date and countdown_label are referenced by client code but were
-- missing from all prior migrations.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'countdown_date'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN countdown_date TIMESTAMPTZ,
      ADD COLUMN countdown_label TEXT DEFAULT 'My Goal Deadline';
  END IF;
END $$;
