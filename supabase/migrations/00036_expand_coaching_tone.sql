-- =============================================================================
-- Migration 00036: Expand coaching tone options
-- Expands gamification_style from 2 values (competitive, supportive)
-- to 4 coaching tones (drill_sergeant, motivational, balanced, calm).
-- Migrates existing rows: competitive → motivational, supportive → calm.
-- =============================================================================

-- Drop the existing constraint so we can expand the allowed values
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_gamification_style_check;

-- Add updated constraint with all 6 values (old + new) during migration window
ALTER TABLE profiles
  ADD CONSTRAINT profiles_gamification_style_check
  CHECK (
    gamification_style IN (
      'competitive',
      'supportive',
      'drill_sergeant',
      'motivational',
      'balanced',
      'calm'
    )
  );

-- Migrate existing rows to the new tone system
UPDATE profiles SET gamification_style = 'motivational' WHERE gamification_style = 'competitive';
UPDATE profiles SET gamification_style = 'calm' WHERE gamification_style = 'supportive';

-- Tighten the constraint to only allow the 4 new values
ALTER TABLE profiles
  DROP CONSTRAINT profiles_gamification_style_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_gamification_style_check
  CHECK (
    gamification_style IN ('drill_sergeant', 'motivational', 'balanced', 'calm')
  );
