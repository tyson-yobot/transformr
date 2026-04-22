// =============================================================================
// TRANSFORMR — Feature Gates Configuration
// Canonical source of truth for tier requirements and upgrade triggers.
// =============================================================================

import type { SubscriptionTier } from '@stores/subscriptionStore';
export type { SubscriptionTier };

export type FeatureKey =
  // ── Fitness ──────────────────────────────────────────────────────
  | 'workout_logging'
  | 'exercise_library'
  | 'ai_adaptive_programming'
  | 'ghost_mode_training'
  | 'ai_form_check_video'
  | 'apple_watch_companion'
  | 'unlimited_workout_history'
  | 'pain_tracker'
  | 'mobility_recovery'
  | 'injury_prevention_tracker'
  | 'guided_mobility'
  // ── Nutrition ────────────────────────────────────────────────────
  | 'manual_food_logging'
  | 'barcode_scanner_v2'
  | 'ai_meal_camera_v2'
  | 'restaurant_menu_scanner'
  | 'ai_meal_plans_weekly'
  | 'ai_grocery_lists'
  | 'batch_cook_meal_prep'
  | 'saved_meals'
  // ── Body & Health ────────────────────────────────────────────────
  | 'weight_logging'
  | 'ai_progress_photo_analysis'
  | 'readiness_score_basic'
  | 'readiness_score_detailed'
  | 'ai_sleep_optimizer_v2'
  | 'daily_readiness_score'
  // ── Habits & Goals ───────────────────────────────────────────────
  | 'habit_tracking_limited'
  | 'habit_tracking_unlimited'
  | 'streak_tracking'
  | 'streak_shields'
  | 'goal_setting'
  | 'data_history_7day'
  | 'data_history_unlimited'
  | 'skill_tracker'
  // ── AI Features ──────────────────────────────────────────────────
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
  | 'ai_posture_analysis'
  | 'ai_progress_photo'
  | 'ai_daily_affirmation'
  | 'ai_health_roi'
  | 'ai_journal'
  | 'ai_retrospective'
  | 'ai_supplement_scanner'
  | 'ai_chat_coach'
  // ── Productivity ─────────────────────────────────────────────────
  | 'voice_commands_v2'
  | 'deep_work_focus_mode'
  | 'ai_journaling_v2'
  | 'siri_google_shortcuts'
  | 'nfc_geofence_triggers_v2'
  // ── Dashboard & Widgets ──────────────────────────────────────────
  | 'dashboard_default'
  | 'dashboard_builder_v2'
  | 'home_screen_widgets'
  // ── Community & Social ───────────────────────────────────────────
  | 'community_challenges_view'
  | 'community_challenges_join'
  | 'leaderboards_v2'
  | 'auto_generated_social_content'
  | 'stake_goals_v2'
  // ── Business & Finance ───────────────────────────────────────────
  | 'personal_finance_tracker'
  | 'business_revenue_tracker'
  | 'business_milestone_tracker'
  | 'skill_knowledge_tracker'
  | 'business_tracking'
  | 'finance_tracking'
  // ── Integrations ─────────────────────────────────────────────────
  | 'spotify_integration_v2'
  | 'spotify_integration'
  | 'apple_health_sync'
  | 'strava_integration'
  | 'wearable_integrations'
  // ── Utility ──────────────────────────────────────────────────────
  | 'data_export'
  | 'nfc_triggers'
  | 'smart_notifications'
  | 'weather_intelligence'
  | 'lab_scanner'
  | 'advanced_analytics'
  | 'priority_ai'
  // ── Screen-level v1 aliases ──────────────────────────────────────
  | 'ai_meal_camera'
  | 'barcode_scanner'
  | 'ghost_mode'
  | 'ai_insights'
  | 'ai_form_check'
  | 'ai_adaptive_program'
  | 'ai_trajectory_simulator'
  | 'ai_weekly_report'
  | 'ai_journal_prompt'
  | 'ai_sleep_optimizer'
  | 'ai_grocery_list'
  | 'ai_meal_prep'
  | 'ai_supplement_advisor'
  | 'ai_workout_narrator'
  | 'ai_correlation'
  | 'unlimited_habits'
  | 'unlimited_programs'
  | 'progress_photos_unlimited'
  | 'ai_progress_analysis'
  | 'readiness_score'
  | 'challenge_center_full'
  | 'community_leaderboards'
  | 'social_content_gen'
  | 'stake_goals'
  | 'vision_board'
  | 'goal_cinema'
  | 'dashboard_builder'
  // ── Partners Tier (Couples) ──────────────────────────────────────
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
  | 'partner_data_permissions'
  | 'partner_features'
  | 'partner_live_sync';

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
  barcode_scanner: 'free',
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
  ai_meal_camera: 'free',        // free with metered cap
  ai_meal_camera_v2: 'free',     // free with metered cap
  ai_chat_coach: 'free',         // free with metered cap

  // ── PRO ───────────────────────────────────────────────────────────
  ai_adaptive_programming: 'pro',
  ai_adaptive_program: 'pro',
  restaurant_menu_scanner: 'pro',
  ai_meal_plans_weekly: 'pro',
  ai_grocery_lists: 'pro',
  ai_grocery_list: 'pro',
  batch_cook_meal_prep: 'pro',
  ai_meal_prep: 'pro',
  habit_tracking_unlimited: 'pro',
  unlimited_habits: 'pro',
  streak_shields: 'pro',
  data_history_unlimited: 'pro',
  ai_daily_coaching: 'pro',
  ai_journal_prompts: 'pro',
  ai_journal_prompt: 'pro',
  body_business_correlation_basic: 'pro',
  mood_performance_correlation_weekly: 'pro',
  ai_workout_narrator_v2: 'pro',
  ai_workout_narrator: 'pro',
  context_aware_motivation: 'pro',
  voice_commands_v2: 'pro',
  deep_work_focus_mode: 'pro',
  ai_journaling_v2: 'pro',
  ai_journal: 'pro',
  siri_google_shortcuts: 'pro',
  home_screen_widgets: 'pro',
  community_challenges_join: 'pro',
  challenge_center_full: 'pro',
  leaderboards_v2: 'pro',
  community_leaderboards: 'pro',
  personal_finance_tracker: 'pro',
  business_revenue_tracker: 'pro',
  business_milestone_tracker: 'pro',
  skill_knowledge_tracker: 'pro',
  skill_tracker: 'pro',
  spotify_integration_v2: 'pro',
  spotify_integration: 'pro',
  injury_prevention_tracker: 'pro',
  guided_mobility: 'pro',
  mobility_recovery: 'pro',
  pain_tracker: 'pro',
  business_tracking: 'pro',
  finance_tracking: 'pro',
  ai_insights: 'pro',
  ai_correlation: 'pro',
  readiness_score: 'pro',
  ai_posture_analysis: 'pro',
  ai_daily_affirmation: 'pro',
  ai_health_roi: 'pro',
  ai_retrospective: 'pro',
  ai_supplement_scanner: 'pro',
  progress_photos_unlimited: 'pro',
  ai_progress_analysis: 'pro',
  goal_cinema: 'pro',
  wearable_integrations: 'pro',
  smart_notifications: 'pro',
  weather_intelligence: 'pro',
  lab_scanner: 'pro',
  apple_health_sync: 'pro',
  strava_integration: 'pro',

  // ── ELITE ──────────────────────────────────────────────────────────
  ai_trajectory_simulator_v2: 'elite',
  ai_trajectory_simulator: 'elite',
  ai_progress_photo_analysis: 'elite',
  ai_progress_photo: 'elite',
  ai_form_check_video: 'elite',
  ai_form_check: 'elite',
  ghost_mode_training: 'elite',
  ghost_mode: 'elite',
  readiness_score_detailed: 'elite',
  body_business_correlation_full: 'elite',
  mood_performance_correlation_daily: 'elite',
  nfc_geofence_triggers_v2: 'elite',
  nfc_triggers: 'elite',
  auto_generated_social_content: 'elite',
  social_content_gen: 'elite',
  ai_sleep_optimizer_v2: 'elite',
  ai_sleep_optimizer: 'elite',
  ai_vision_board: 'elite',
  vision_board: 'elite',
  ai_supplement_advisor_v2: 'elite',
  ai_supplement_advisor: 'elite',
  dashboard_builder_v2: 'elite',
  dashboard_builder: 'elite',
  apple_watch_companion: 'elite',
  ai_weekly_report_v2: 'elite',
  ai_weekly_report: 'elite',
  unlimited_workout_history: 'elite',
  unlimited_programs: 'elite',
  stake_goals_v2: 'elite',
  stake_goals: 'elite',
  data_export: 'elite',
  advanced_analytics: 'elite',
  priority_ai: 'elite',

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
  partner_features: 'partners',
  partner_live_sync: 'partners',
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
  // ── PRO TRIGGERS ──────────────────────────────────────────────────
  ai_adaptive_programming: {
    title: 'AI Adaptive Programming',
    message: 'Your AI coach rewrites your program based on your actual performance and recovery. Never plateau again.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_adaptive_program: {
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
  ai_meal_camera: {
    title: 'AI Meal Camera',
    message: 'Snap your food and your macros log instantly. No manual entry, no guessing.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_chat_coach: {
    title: 'AI Coach Chat',
    message: 'Unlimited conversations with your AI coach — get real-time advice on training, nutrition, and recovery.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  habit_tracking_unlimited: {
    title: 'Unlimited Habits',
    message: "You've hit the 3-habit limit. Go Pro to track everything that matters.",
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  unlimited_habits: {
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
  restaurant_menu_scanner: {
    title: 'Restaurant Menu Scanner',
    message: 'Scan any menu and instantly see macros for every dish. Eat out without guessing.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_meal_plans_weekly: {
    title: 'AI Weekly Meal Plans',
    message: 'Get a personalized 7-day meal plan built around your macros, preferences, and schedule.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_grocery_lists: {
    title: 'AI Grocery Lists',
    message: 'Your meal plan auto-generates a perfectly organized grocery list. No more forgotten items.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_grocery_list: {
    title: 'AI Grocery Lists',
    message: 'Your meal plan auto-generates a perfectly organized grocery list. No more forgotten items.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  batch_cook_meal_prep: {
    title: 'Batch Cook Meal Prep',
    message: 'Plan your weekly meal prep with intelligent batching — cook once, eat all week.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_meal_prep: {
    title: 'AI Meal Prep',
    message: 'Plan your weekly meal prep with intelligent batching — cook once, eat all week.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_daily_coaching: {
    title: 'Daily AI Coaching',
    message: 'Get personalized daily guidance based on your recovery, goals, and recent performance.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_journal_prompts: {
    title: 'AI Journal Prompts',
    message: 'Personalized reflection prompts that help you build self-awareness and track your mindset.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_journal_prompt: {
    title: 'AI Journal Prompts',
    message: 'Personalized reflection prompts that help you build self-awareness and track your mindset.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_journal: {
    title: 'AI Journaling',
    message: 'AI-powered journal reflections that connect your physical and mental progress.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_journaling_v2: {
    title: 'AI Journaling',
    message: 'AI-powered journal reflections that connect your physical and mental progress.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  body_business_correlation_basic: {
    title: 'Body-Business Correlation',
    message: 'See how your fitness habits impact your business performance — the data tells a powerful story.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_correlation: {
    title: 'AI Correlations',
    message: 'See AI-detected correlations across your fitness, nutrition, sleep, and performance data.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  mood_performance_correlation_weekly: {
    title: 'Mood-Performance Insights',
    message: 'See how your mood affects your workouts and vice versa — weekly trend analysis.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_workout_narrator_v2: {
    title: 'AI Workout Narrator',
    message: 'Your AI coach narrates your workout in real-time — cues, motivation, and form reminders.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_workout_narrator: {
    title: 'AI Workout Narrator',
    message: 'Your AI coach narrates your workout in real-time — cues, motivation, and form reminders.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  context_aware_motivation: {
    title: 'Context-Aware Motivation',
    message: 'Receive personalized motivation timed to your schedule, energy levels, and recent activity.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  voice_commands_v2: {
    title: 'Voice Commands',
    message: 'Log workouts, meals, and habits hands-free with natural voice commands.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  deep_work_focus_mode: {
    title: 'Deep Work Focus Mode',
    message: 'Block distractions and track focused work sessions alongside your fitness goals.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  siri_google_shortcuts: {
    title: 'Siri & Google Shortcuts',
    message: 'Create voice shortcuts to instantly log workouts, meals, and habits from your home screen.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  home_screen_widgets: {
    title: 'Home Screen Widgets',
    message: 'Glance at your streaks, readiness, and progress without opening the app.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  community_challenges_join: {
    title: 'Join Community Challenges',
    message: 'Compete in weekly and monthly challenges with the TRANSFORMR community.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  challenge_center_full: {
    title: 'Challenge Center',
    message: 'Access the full Challenge Center — create, join, and compete in challenges.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  leaderboards_v2: {
    title: 'Community Leaderboards',
    message: 'Compete on leaderboards and see how you rank against the community.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  community_leaderboards: {
    title: 'Community Leaderboards',
    message: 'Compete on leaderboards and see how you rank against the community.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  personal_finance_tracker: {
    title: 'Personal Finance Tracker',
    message: 'Track your finances alongside your fitness — see the full picture of your life performance.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  finance_tracking: {
    title: 'Finance Tracking',
    message: 'Track your finances alongside your fitness — see the full picture of your life performance.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  business_revenue_tracker: {
    title: 'Business Revenue Tracker',
    message: 'Track your business revenue and see how it correlates with your physical performance.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  business_tracking: {
    title: 'Business Tracking',
    message: 'Track your business metrics inside TRANSFORMR and unlock body-business correlations.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  business_milestone_tracker: {
    title: 'Business Milestones',
    message: 'Set and track business milestones alongside your fitness journey.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  skill_knowledge_tracker: {
    title: 'Skill & Knowledge Tracker',
    message: 'Track skill development and knowledge acquisition as part of your growth journey.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  skill_tracker: {
    title: 'Skill Tracker',
    message: 'Track skill development and knowledge acquisition as part of your growth journey.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  spotify_integration_v2: {
    title: 'Spotify Integration',
    message: 'Play your workout playlists directly in TRANSFORMR — perfectly synced to your training.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  injury_prevention_tracker: {
    title: 'Injury Prevention',
    message: 'Track vulnerable areas and get AI-powered injury prevention recommendations.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  guided_mobility: {
    title: 'Guided Mobility',
    message: 'Follow guided mobility routines tailored to your training and recovery needs.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  mobility_recovery: {
    title: 'Mobility & Recovery',
    message: 'Guided mobility and recovery sessions personalized to your training load.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  pain_tracker: {
    title: 'Pain Tracker',
    message: 'Log and track pain points over time — catch patterns before they become injuries.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_insights: {
    title: 'AI Insights',
    message: 'Unlock AI-powered insights that connect dots across your fitness, nutrition, and lifestyle data.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  readiness_score: {
    title: 'Readiness Score',
    message: 'Unlock your daily Readiness Score — know exactly when to push hard and when to recover.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_posture_analysis: {
    title: 'AI Posture Analysis',
    message: 'Get AI-powered posture assessment and corrective exercise recommendations.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_daily_affirmation: {
    title: 'AI Daily Affirmations',
    message: 'Receive personalized AI-generated affirmations tuned to your goals and progress.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_health_roi: {
    title: 'Health ROI Report',
    message: 'See the return on investment of your health habits — quantified and visualized by AI.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_retrospective: {
    title: 'AI Monthly Retrospective',
    message: 'Receive an AI-written monthly letter reflecting on your progress, patterns, and potential.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_supplement_scanner: {
    title: 'AI Supplement Scanner',
    message: 'Scan supplement labels and get AI analysis of ingredients, quality, and relevance to your goals.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  progress_photos_unlimited: {
    title: 'Unlimited Progress Photos',
    message: 'Take unlimited progress photos and compare your transformation side by side.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  ai_progress_analysis: {
    title: 'AI Progress Analysis',
    message: 'AI analyzes your progress photos to track visible changes over time.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  goal_cinema: {
    title: 'Goal Cinema',
    message: 'Immersive goal visualization — see your future self through AI-generated cinema.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  wearable_integrations: {
    title: 'Wearable Integrations',
    message: 'Connect your smartwatch and wearable devices for seamless data sync.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  smart_notifications: {
    title: 'Smart Notifications',
    message: 'Context-aware notifications that nudge you at the right time based on your habits and schedule.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  weather_intelligence: {
    title: 'Weather Intelligence',
    message: 'Get weather-aware training recommendations — optimize outdoor workouts automatically.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  lab_scanner: {
    title: 'Lab Results Scanner',
    message: 'Scan and track lab results — see how your bloodwork trends align with your training.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  apple_health_sync: {
    title: 'Apple Health Sync',
    message: 'Sync your Apple Health data for a complete picture of your daily activity.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },
  strava_integration: {
    title: 'Strava Integration',
    message: 'Connect Strava and automatically import your runs, rides, and outdoor activities.',
    targetTier: 'pro',
    ctaCopy: 'Unlock Pro — Start Transforming',
  },

  // ── ELITE TRIGGERS ────────────────────────────────────────────────
  ai_trajectory_simulator_v2: {
    title: 'AI Trajectory Simulator',
    message: 'See two futures — where your current habits lead, and where you could be in 12 months.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ai_trajectory_simulator: {
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
  ai_progress_photo: {
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
  ai_form_check: {
    title: 'AI Form Check',
    message: 'Record any set and get instant AI feedback — cue by cue, rep by rep.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ghost_mode_training: {
    title: 'Ghost Mode Training',
    message: 'Race against your past self — your AI ghost replays your best performances.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ghost_mode: {
    title: 'Ghost Mode Training',
    message: 'Race against your past self — your AI ghost replays your best performances.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  readiness_score_detailed: {
    title: 'Detailed Readiness Score',
    message: 'Get a granular breakdown of your readiness — muscle recovery, CNS fatigue, sleep debt, and more.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  body_business_correlation_full: {
    title: 'Full Body-Business Correlation',
    message: 'See the complete picture — how every fitness metric impacts your business performance.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  mood_performance_correlation_daily: {
    title: 'Daily Mood-Performance Tracking',
    message: 'Track mood-performance correlations daily for precise emotional intelligence insights.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  nfc_geofence_triggers_v2: {
    title: 'NFC & Geofence Triggers',
    message: 'Tap your phone to an NFC tag or arrive at a location to auto-start workouts and habits.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  nfc_triggers: {
    title: 'NFC Triggers',
    message: 'Set up NFC tags to instantly start workouts, log habits, or trigger routines.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  auto_generated_social_content: {
    title: 'AI Social Content',
    message: 'Auto-generate shareable workout summaries, progress posts, and milestone celebrations.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  social_content_gen: {
    title: 'AI Social Content',
    message: 'Auto-generate shareable workout summaries, progress posts, and milestone celebrations.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ai_sleep_optimizer_v2: {
    title: 'AI Sleep Optimizer',
    message: 'Your AI coach analyzes your sleep patterns and builds a personalized sleep protocol.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ai_sleep_optimizer: {
    title: 'AI Sleep Optimizer',
    message: 'Your AI coach analyzes your sleep patterns and builds a personalized sleep protocol.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ai_vision_board: {
    title: 'AI Vision Board',
    message: 'Create an AI-powered vision board that evolves with your progress and aspirations.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  vision_board: {
    title: 'Vision Board',
    message: 'Create an AI-powered vision board that evolves with your progress and aspirations.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ai_supplement_advisor_v2: {
    title: 'AI Supplement Advisor',
    message: 'Get personalized supplement recommendations based on your goals, diet, and lab results.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ai_supplement_advisor: {
    title: 'AI Supplement Advisor',
    message: 'Get personalized supplement recommendations based on your goals, diet, and lab results.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  dashboard_builder_v2: {
    title: 'Custom Dashboard Builder',
    message: 'Build your perfect dashboard — drag, drop, and arrange the widgets that matter most to you.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  dashboard_builder: {
    title: 'Custom Dashboard Builder',
    message: 'Build your perfect dashboard — drag, drop, and arrange the widgets that matter most to you.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  apple_watch_companion: {
    title: 'Apple Watch Companion',
    message: 'Get TRANSFORMR on your wrist — log workouts, track habits, and check readiness from your watch.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ai_weekly_report_v2: {
    title: 'AI Weekly Report',
    message: 'Receive a comprehensive AI-written weekly analysis of your performance, trends, and opportunities.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  ai_weekly_report: {
    title: 'AI Weekly Report',
    message: 'Receive a comprehensive AI-written weekly analysis of your performance, trends, and opportunities.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  unlimited_workout_history: {
    title: 'Unlimited Workout History',
    message: 'Access your complete workout history — every set, rep, and PR from day one.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  unlimited_programs: {
    title: 'Unlimited Programs',
    message: 'Create unlimited custom training programs with AI-adaptive periodization.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  stake_goals_v2: {
    title: 'Stake Goals',
    message: 'Put real stakes on your goals — financial commitments that keep you accountable.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  stake_goals: {
    title: 'Stake Goals',
    message: 'Put real stakes on your goals — financial commitments that keep you accountable.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  data_export: {
    title: 'Data Export',
    message: 'Export all your data in CSV or JSON — your data, your way.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  advanced_analytics: {
    title: 'Advanced Analytics',
    message: 'Deep analytics across every domain — fitness, nutrition, sleep, business, and beyond.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },
  priority_ai: {
    title: 'Priority AI',
    message: 'Get priority AI response times — faster coaching, faster insights, faster results.',
    targetTier: 'elite',
    ctaCopy: 'Go Elite — See Your Future',
  },

  // ── PARTNERS TRIGGERS ─────────────────────────────────────────────
  couples_live_sync_workout: {
    title: 'Train Together in Real Time',
    message: 'Start a live sync workout and train side-by-side with your partner — anywhere in the world.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  partner_live_sync: {
    title: 'Partner Live Sync',
    message: 'Train in real-time with your partner — see each other\'s sets, reps, and progress live.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  partner_dashboard_v2: {
    title: 'Partner Accountability Dashboard',
    message: "See your partner's streaks, check-ins, and progress. Stay accountable together.",
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  partner_features: {
    title: 'Partner Features',
    message: 'Unlock accountability partner features — sync workouts, share streaks, and grow together.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  partner_linking: {
    title: 'Link Your Partner',
    message: 'Connect with your partner and unlock shared accountability features.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  joint_streaks: {
    title: 'Joint Streaks',
    message: 'Build streaks together — when both of you show up, the streak grows stronger.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  partner_nudges: {
    title: 'Partner Nudges',
    message: 'Send motivational nudges to keep each other on track.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  partner_challenges: {
    title: 'Partner Challenges',
    message: 'Challenge your partner to head-to-head competitions and friendly battles.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  partner_activity_feed: {
    title: 'Partner Activity Feed',
    message: 'See what your partner is up to — workouts, meals, habits, and milestones.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  partner_reactions: {
    title: 'Partner Reactions',
    message: 'React to your partner\'s activities with emojis and encouragement.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  shared_vision_board: {
    title: 'Shared Vision Board',
    message: 'Create a shared vision board with your partner — visualize your goals together.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  couples_weekly_review: {
    title: 'Couples Weekly Review',
    message: 'Review your week together — celebrate wins, identify opportunities, and plan ahead.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
  partner_data_permissions: {
    title: 'Partner Data Permissions',
    message: 'Control exactly what your partner can see — privacy with accountability.',
    targetTier: 'partners',
    ctaCopy: 'Train Together — Go Partners',
  },
};
