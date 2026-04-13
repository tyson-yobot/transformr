-- =============================================================================
-- Migration 00036: Add gamification_style / coaching tone column
-- Adds the gamification_style column with 4 coaching tones.
-- Default: 'motivational' — the most universally appealing default.
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gamification_style TEXT DEFAULT 'motivational';

ALTER TABLE profiles
  ADD CONSTRAINT profiles_gamification_style_check
  CHECK (gamification_style IN ('drill_sergeant', 'motivational', 'balanced', 'calm'));
