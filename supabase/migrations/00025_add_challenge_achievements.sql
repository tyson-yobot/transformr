-- =============================================================================
-- TRANSFORMR -- Challenge-Specific Achievements
-- =============================================================================

INSERT INTO achievements (name, description, icon, category, tier, condition_type, condition_value) VALUES
-- Challenge General
('Day One', 'Start any challenge', '🚀', 'challenges', 'bronze', 'challenge_started', 1),
('Halfway There', 'Reach 50% of any challenge', '⏳', 'challenges', 'bronze', 'challenge_halfway', 1),
('Challenge Stacker', 'Complete 3+ challenges in a year', '📚', 'challenges', 'gold', 'challenges_completed_year', 3),
('Never Give Up', 'Restart a challenge after failure and complete it', '💪', 'challenges', 'gold', 'challenge_restart_complete', 1),
('Power Couple', 'Complete any challenge alongside partner', '💑', 'challenges', 'gold', 'challenge_partner_complete', 1),
('Challenge Creator', 'Create and complete a custom challenge', '🎨', 'challenges', 'silver', 'custom_challenge_complete', 1),

-- 75 Hard Specific
('75 Hard Survivor', 'Complete 75 Hard without a single restart', '💎', 'challenges', 'diamond', 'challenge_complete_75hard_no_restart', 1),
('75 Hard Finisher', 'Complete 75 Hard (any number of restarts)', '🏆', 'challenges', 'gold', 'challenge_complete_75hard', 1),

-- 75 Soft / Medium
('75 Soft Champion', 'Complete 75 Soft with 90%+ compliance', '🥇', 'challenges', 'gold', 'challenge_complete_75soft_90', 1),
('75 Medium Master', 'Complete 75 Medium', '🥈', 'challenges', 'silver', 'challenge_complete_75medium', 1),

-- Murph
('Murph Finisher', 'Complete a full Murph workout', '🎖️', 'challenges', 'gold', 'challenge_complete_murph', 1),
('Sub-40 Murph', 'Complete Murph in under 40 minutes', '⚡', 'challenges', 'diamond', 'murph_sub_40', 1),

-- Running
('Couch to Runner', 'Complete Couch to 5K program', '🏃', 'challenges', 'silver', 'challenge_complete_c25k', 1),

-- Strength
('Squat Machine', 'Complete 30-Day Squat Challenge', '🦵', 'challenges', 'silver', 'challenge_complete_squat30', 1),
('Iron Plank', 'Hold a 5-minute plank', '🧱', 'challenges', 'gold', 'plank_5_minutes', 1),

-- Lifestyle
('Sober Streak', 'Complete 30 days alcohol-free', '🍃', 'challenges', 'silver', 'challenge_complete_sober30', 1),
('Whole30 Clean', 'Complete Whole30 with zero violations', '🥗', 'challenges', 'gold', 'challenge_complete_whole30_clean', 1),
('Step Master', '10,000 steps for 30 consecutive days', '👟', 'challenges', 'silver', 'challenge_complete_steps30', 1);
