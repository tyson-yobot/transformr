-- =============================================================================
-- TRANSFORMR -- Seed Challenge-Specific Achievements (16 total)
-- Migration 00026
-- =============================================================================

-- First, add 'challenge' to the category CHECK constraint
ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_category_check;
ALTER TABLE achievements ADD CONSTRAINT achievements_category_check
  CHECK (category IN ('fitness','nutrition','body','business','finance','consistency','partner','community','mindset','learning','challenge'));

-- Insert 16 challenge achievements
INSERT INTO achievements (key, title, description, icon, category, tier, requirement_type, requirement_value, secret) VALUES

-- GENERAL CHALLENGE
('challenge_day_one',       'Day One',              'Start any challenge',                                      '🚀', 'challenge', 'bronze',  'challenges_started',          1, false),
('challenge_halfway',       'Halfway There',        'Reach 50% of any challenge',                               '⏳', 'challenge', 'bronze',  'challenge_halfway',           1, false),
('challenge_stacker',       'Challenge Stacker',    'Complete 3 or more challenges in a year',                  '📚', 'challenge', 'gold',    'challenges_completed_year',   3, false),
('challenge_never_give_up', 'Never Give Up',        'Restart a challenge after failure and complete it',        '💪', 'challenge', 'gold',    'challenge_restart_complete',  1, false),
('challenge_power_couple',  'Power Couple',         'Complete any challenge alongside your partner',            '👫', 'challenge', 'gold',    'challenge_partner_completed', 1, false),
('challenge_creator',       'Challenge Creator',    'Create and complete a custom challenge',                   '🛠️', 'challenge', 'silver',  'challenge_custom_completed',  1, false),

-- 75 HARD / 75 SOFT
('challenge_75_hard',       '75 Hard Survivor',     'Complete 75 Hard',                                         '💎', 'challenge', 'diamond', 'challenge_75_hard_completed', 1, false),
('challenge_75_soft',       '75 Soft Champion',     'Complete 75 Soft with 90%+ compliance',                    '🏆', 'challenge', 'gold',    'challenge_75_soft_completed', 1, false),

-- MURPH
('challenge_murph',         'Murph Finisher',       'Complete a full Murph',                                    '🎖️', 'challenge', 'gold',    'challenge_murph_completed',   1, false),
('challenge_murph_sub40',   'Sub-40 Murph',         'Complete Murph in under 40 minutes',                       '⚡', 'challenge', 'diamond', 'challenge_murph_time',        1, false),

-- RUNNING
('challenge_c25k',          'Couch to Runner',      'Complete Couch to 5K',                                     '🏃', 'challenge', 'silver',  'challenge_c25k_completed',    1, false),

-- STRENGTH
('challenge_squat',         'Squat Machine',        'Complete 30-Day Squat Challenge',                          '🦵', 'challenge', 'silver',  'challenge_squat_completed',   1, false),
('challenge_plank',         'Iron Plank',           'Hold a 5-minute plank',                                    '🧱', 'challenge', 'gold',    'challenge_plank_300s',        1, false),

-- LIFESTYLE
('challenge_sober',         'Sober Streak',         'Complete 30 days alcohol-free',                            '🚫', 'challenge', 'silver',  'challenge_sober_completed',   1, false),
('challenge_whole30',       'Whole30 Clean',        'Complete Whole30 with zero violations',                    '🥗', 'challenge', 'gold',    'challenge_whole30_completed', 1, false),
('challenge_steps',         'Step Master',          'Walk 10,000 steps for 30 consecutive days',               '👟', 'challenge', 'silver',  'challenge_steps_completed',   1, false)

ON CONFLICT (key) DO NOTHING;
