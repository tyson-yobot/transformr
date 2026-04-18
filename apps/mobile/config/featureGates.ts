// =============================================================================
// TRANSFORMR — Feature Gates Configuration
// Canonical source of truth for tier requirements and upgrade triggers.
// =============================================================================

import type { SubscriptionTier } from '@stores/subscriptionStore';
export type { SubscriptionTier };

export type FeatureKey =
  // Fitness
  | 'workout_logging'
  | 'exercise_library'
  | 'ai_adaptive_programming'
  | 'ghost_mode_training'
  | 'ai_form_check_video'
  | 'apple_watch_companion'
  | 'unlimited_workout_history'
  // Nutrition
  | 'manual_food_logging'
  | 'barcode_scanner_v2'
  | 'ai_meal_camera_v2'
  | 'restaurant_menu_scanner'
  | 'ai_meal_plans_weekly'
  | 'ai_grocery_lists'
  | 'batch_cook_meal_prep'
  | 'saved_meals'
  // Body & Health
  | 'weight_logging'
  | 'ai_progress_photo_analysis'
  | 'readiness_score_basic'
  | 'readiness_score_detailed'
  | 'ai_sleep_optimizer_v2'
  | 'injury_prevention_tracker'
  | 'guided_mobility'
  | 'daily_readiness_score'
  // Habits & Goals
  | 'habit_tracking_limited'
  | 'habit_tracking_unlimited'
  | 'streak_tracking'
  | 'streak_shields'
  | 'goal_setting'
  | 'data_history_7day'
  | 'data_history_unlimited'
  // AI Features
  | 'ai_daily_coaching'
  | 'ai_trajectory_simulator_v2'
  | 'ai_weekly_report_v2'
  | 'ai_journal_prompts'
  | 'ai_supplement_advisor_v2'
  | 'body_business_correlation_basic'
  | 'body_business_correlation_full'
  | 'mood_performance_correlation_weekly'
  | 'mood_performance_correlation_daily'
  | 'ai_vision_board'
  | 'ai_workout_narrator_v2'
  | 'context_aware_motivation'
  // Productivity
  | 'voice_commands_v2'
  | 'deep_work_focus_mode'
  | 'ai_journaling_v2'
  | 'siri_google_shortcuts'
  | 'nfc_geofence_triggers_v2'
  // Dashboard & Widgets
  | 'dashboard_default'
  | 'dashboard_builder_v2'
  | 'home_screen_widgets'
  // Community & Social
  | 'community_challenges_view'
  | 'community_challenges_join'
  | 'leaderboards_v2'
  | 'auto_generated_social_content'
  | 'stake_goals_v2'
  // Business & Finance
  | 'personal_finance_tracker'
  | 'business_revenue_tracker'
  | 'business_milestone_tracker'
  | 'skill_knowledge_tracker'
  // Integrations
  | 'spotify_integration_v2'
  // Partners Tier (Couples)
  | 'partner_linking'
  | 'partner_dashboard_v2'
  | 'couples_live_sync_workout'
  | 'joint_streaks'
  | 'partner_nudges'
  | 'partner_challenges'
  | 'partner_activity_feed'
  | 'partner_reactions'
  | 'shared_vision_board'
  | 'couples_weekly_review'
  | 'partner_data_permissions';

export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  elite: 2,
  partners: 3,
};

export const FEATURE_TIER_REQUIREMENTS: Record<FeatureKey, SubscriptionTier> = {
  // ── FREE ──────────────────────────────────────────────────────────
  workout_logging: 'free',
  exercise_library: 'free',
  manual_food_logging: 'free',
  barcode_scanner_v2: 'free',
  weight_logging: 'free',
  readiness_score_basic: 'free',
  streak_tracking: 'free',
  habit_tracking_limited: 'free',
  data_history_7day: 'free',
  goal_setting: 'free',
  dashboard_default: 'free',
  community_challenges_view: 'free',
  saved_meals: 'free',
  daily_readiness_score: 'free',

  // ── PRO ───────────────────────────────────────────────────────────
  ai_adaptive_programming: 'pro',
  ai_meal_camera_v2: 'pro',
  restaurant_menu_scanner: 'pro',
  ai_meal_plans_weekly: 'pro',
  ai_grocery_lists: 'pro',
  batch_cook_meal_prep: 'pro',
  habit_tracking_unlimited: 'pro',
  streak_shields: 'pro',
  data_history_unlimited: 'pro',
  ai_daily_coaching: 'pro',
  ai_journal_prompts: 'pro',
  body_business_correlation_basic: 'pro',
  mood_performance_correlation_weekly: 'pro',
  ai_workout_narrator_v2: 'pro',
  context_aware_motivation: 'pro',
  voice_commands_v2: 'pro',
  deep_work_focus_mode: 'pro',
  ai_journaling_v2: 'pro',
  siri_google_shortcuts: 'pro',
  home_screen_widgets: 'pro',
  community_challenges_join: 'pro',
  leaderboards_v2: 'pro',
  personal_finance_tracker: 'pro',
  business_revenue_tracker: 'pro',
  business_milestone_tracker: 'pro',
  skill_knowledge_tracker: 'pro',
  spotify_integration_v2: 'pro',
  injury_prevention_tracker: 'pro',
  guided_mobility: 'pro',

  // ── ELITE ──────────────────────────────────────────────────────────
  ai_trajectory_simulator_v2: 'elite',
  ai_progress_photo_analysis: 'elite',
  ai_form_check_video: 'elite',
  ghost_mode_training: 'elite',
  readiness_score_detailed: 'elite',
  body_business_correlation_full: 'elite',
  mood_performance_correlation_daily: 'elite',
  nfc_geofence_triggers_v2: 'elite',
  auto_generated_social_content: 'elite',
  ai_sleep_optimizer_v2: 'elite',
  ai_vision_board: 'elite',
  ai_supplement_advisor_v2: 'elite',
  dashboard_builder_v2: 'elite',
  apple_watch_companion: 'elite',
  ai_weekly_report_v2: 'elite',
  unlimited_workout_history: 'elite',
  stake_goals_v2: 'elite',

  // ── PARTNERS ────────────────────────────────────────────────────────
  partner_linking: 'partners',
  partner_dashboard_v2: 'partners',
  couples_live_sync_workout: 'partners',
  joint_streaks: 'partners',
  partner_nudges: 'partners',
  partner_challenges: 'partners',
  partner_activity_feed: 'partners',
  partner_reactions: 'partners',
  shared_vision_board: 'partners',
  couples_weekly_review: 'partners',
  partner_data_permissions: 'partners',
};

export function hasAccess(
  userTier: SubscriptionTier,
  feature: FeatureKey,
): boolean {
  const required = FEATURE_TIER_REQUIREMENTS[feature];
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[required];
}

export const UPGRADE_TRIGGERS: Partial<Record<FeatureKey, {
  title: string;
  message: string;
  targetTier: SubscriptionTier;
  ctaCopy: string;
}>> = {
  ai_adaptive_programming: {
    title: 'AI Adaptive Programming',
    message: 'Your AI coach rewrites your program based on your actual performance and recovery. Never plateau again.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_meal_camera_v2: {
    title: 'AI Meal Camera',
    message: 'Snap your food and your macros log instantly. No manual entry, no guessing.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  habit_tracking_unlimited: {
    title: 'Unlimited Habits',
    message: "You've hit the 3-habit limit. Go Pro to track everything that matters.",
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  streak_shields: {
    title: 'Streak Shields',
    message: 'Protect your streak from a missed day. Earn 1 shield every 30 days with Pro.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  data_history_unlimited: {
    title: 'Unlimited History',
    message: "You're seeing the last 7 days. Go Pro to unlock your full data history.",
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_trajectory_simulator_v2: {
    title: 'AI Trajectory Simulator',
    message: 'See two futures — where your current habits lead, and where you could be in 12 months.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ai_progress_photo_analysis: {
    title: 'AI Body Composition Analysis',
    message: 'Upload a progress photo and your AI coach measures your transformation.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ai_form_check_video: {
    title: 'AI Form Check',
    message: 'Record any set and get instant AI feedback — cue by cue, rep by rep.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  couples_live_sync_workout: {
    title: 'Train Together in Real Time',
    message: 'Start a live sync workout and train side-by-side with your partner — anywhere in the world.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  partner_dashboard_v2: {
    title: 'Partner Accountability Dashboard',
    message: "See your partner's streaks, check-ins, and progress. Stay accountable together.",
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
};
