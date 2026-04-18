// =============================================================================
// TRANSFORMR — Feature Gate Hook
// =============================================================================

import { useSubscriptionStore, SubscriptionTier } from '../stores/subscriptionStore';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type FeatureKey =
  | 'ai_meal_camera'
  | 'barcode_scanner'
  | 'ghost_mode'
  | 'ai_chat_coach'
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
  | 'partner_features'
  | 'partner_live_sync'
  | 'challenge_center_full'
  | 'community_leaderboards'
  | 'social_content_gen'
  | 'stake_goals'
  | 'business_tracking'
  | 'finance_tracking'
  | 'vision_board'
  | 'goal_cinema'
  | 'dashboard_builder'
  | 'data_export'
  | 'wearable_integrations'
  | 'nfc_triggers'
  | 'smart_notifications'
  | 'weather_intelligence'
  | 'lab_scanner'
  | 'apple_health_sync'
  | 'spotify_integration'
  | 'strava_integration'
  // ── Screen-level AI feature keys ────────────────────────────────
  | 'ai_posture_analysis'
  | 'ai_progress_photo'
  | 'ai_daily_affirmation'
  | 'ai_health_roi'
  | 'ai_journal'
  | 'ai_retrospective'
  | 'ai_supplement_scanner'
  // ── Extended v2 keys ────────────────────────────────────────────
  | 'workout_logging'
  | 'exercise_library'
  | 'ai_adaptive_programming'
  | 'ghost_mode_training'
  | 'ai_form_check_video'
  | 'apple_watch_companion'
  | 'unlimited_workout_history'
  | 'manual_food_logging'
  | 'barcode_scanner_v2'
  | 'ai_meal_camera_v2'
  | 'restaurant_menu_scanner'
  | 'ai_meal_plans_weekly'
  | 'ai_grocery_lists'
  | 'batch_cook_meal_prep'
  | 'saved_meals'
  | 'weight_logging'
  | 'ai_progress_photo_analysis'
  | 'readiness_score_basic'
  | 'readiness_score_detailed'
  | 'ai_sleep_optimizer_v2'
  | 'injury_prevention_tracker'
  | 'guided_mobility'
  | 'daily_readiness_score'
  | 'habit_tracking_limited'
  | 'habit_tracking_unlimited'
  | 'streak_tracking'
  | 'streak_shields'
  | 'goal_setting'
  | 'data_history_7day'
  | 'data_history_unlimited'
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
  | 'voice_commands_v2'
  | 'deep_work_focus_mode'
  | 'ai_journaling_v2'
  | 'siri_google_shortcuts'
  | 'nfc_geofence_triggers_v2'
  | 'dashboard_default'
  | 'dashboard_builder_v2'
  | 'home_screen_widgets'
  | 'community_challenges_view'
  | 'community_challenges_join'
  | 'leaderboards_v2'
  | 'auto_generated_social_content'
  | 'stake_goals_v2'
  | 'personal_finance_tracker'
  | 'business_revenue_tracker'
  | 'business_milestone_tracker'
  | 'skill_knowledge_tracker'
  | 'spotify_integration_v2'
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

export interface FeatureGateResult {
  isAvailable: boolean;
  isCapped: boolean;
  remainingUses: number | null;
  requiredTier: SubscriptionTier;
  upgradeMessage: string;
  trackUsage: () => void;
  showUpgradeModal: () => void;
  checkAndPrompt: () => boolean;
}

// ---------------------------------------------------------------------------
// Global upgrade modal event emitter
// ---------------------------------------------------------------------------

type UpgradeModalListener = (feature: FeatureKey) => void;
let _listener: UpgradeModalListener | null = null;

export const upgradeModalEvents = {
  setListener: (fn: UpgradeModalListener | null) => {
    _listener = fn;
  },
  emit: (feature: FeatureKey) => {
    _listener?.(feature);
  },
};

// ---------------------------------------------------------------------------
// Gate definitions
// ---------------------------------------------------------------------------

interface GateDefinition {
  requiredTier: SubscriptionTier;
  freeLimit?: number;
  freeUnit?: string;
  upgradeMessage: string;
}

const FEATURE_GATE_MAP: Record<FeatureKey, GateDefinition> = {
  // Free tier — no gate
  barcode_scanner: {
    requiredTier: 'free',
    upgradeMessage: '',
  },

  // Pro — metered
  ai_meal_camera: {
    requiredTier: 'pro',
    freeLimit: 5,
    freeUnit: 'scans/month',
    upgradeMessage: 'Upgrade to Pro for unlimited AI meal camera scans.',
  },
  ai_chat_coach: {
    requiredTier: 'pro',
    freeLimit: 10,
    freeUnit: 'messages/day',
    upgradeMessage: 'Upgrade to Pro for unlimited AI coaching messages.',
  },

  // Pro — ungated (available to pro+elite+partners)
  ghost_mode: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to unlock Ghost Mode and train against your personal records.',
  },
  ai_insights: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to unlock AI-powered insights.',
  },
  ai_form_check: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to enable AI form check.',
  },
  ai_adaptive_program: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for adaptive AI training programs.',
  },
  ai_trajectory_simulator: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to use the AI trajectory simulator.',
  },
  ai_weekly_report: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for weekly AI progress reports.',
  },
  ai_journal_prompt: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for personalized AI journal prompts.',
  },
  ai_sleep_optimizer: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to unlock the AI sleep optimizer.',
  },
  ai_grocery_list: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for AI-generated grocery lists.',
  },
  ai_meal_prep: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for AI meal prep planning.',
  },
  ai_supplement_advisor: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for AI supplement recommendations.',
  },
  ai_workout_narrator: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to unlock the AI workout narrator.',
  },
  ai_correlation: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to see AI-detected correlations across your data.',
  },
  unlimited_habits: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for unlimited habit tracking.',
  },
  unlimited_programs: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to create unlimited training programs.',
  },
  progress_photos_unlimited: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for unlimited progress photos.',
  },
  ai_progress_analysis: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for AI progress photo analysis.',
  },
  readiness_score: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to unlock your daily Readiness Score.',
  },
  challenge_center_full: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to access the full Challenge Center.',
  },
  community_leaderboards: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to compete on community leaderboards.',
  },
  social_content_gen: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for AI social content generation.',
  },
  stake_goals: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to stake financial commitments on your goals.',
  },
  vision_board: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to unlock your Vision Board.',
  },
  goal_cinema: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for Goal Cinema visualizations.',
  },
  dashboard_builder: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to customize your dashboard.',
  },
  data_export: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to export your data.',
  },
  wearable_integrations: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for wearable device integrations.',
  },
  nfc_triggers: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to set up NFC triggers.',
  },
  smart_notifications: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for smart, context-aware notifications.',
  },
  weather_intelligence: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for weather-aware training recommendations.',
  },
  lab_scanner: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to scan and track lab results.',
  },
  apple_health_sync: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to sync with Apple Health.',
  },
  spotify_integration: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for Spotify workout integration.',
  },
  strava_integration: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to connect Strava.',
  },

  // ── Screen-level AI feature keys ────────────────────────────────
  ai_posture_analysis: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for AI posture analysis.',
  },
  ai_progress_photo: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for AI progress photo analysis.',
  },
  ai_daily_affirmation: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for AI-generated daily affirmations.',
  },
  ai_health_roi: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for your AI Health ROI report.',
  },
  ai_journal: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for AI journal reflections.',
  },
  ai_retrospective: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for AI monthly retrospective letters.',
  },
  ai_supplement_scanner: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to scan supplement labels with AI.',
  },
  // ── Extended v2 keys ────────────────────────────────────────────
  workout_logging: { requiredTier: 'free', upgradeMessage: '' },
  exercise_library: { requiredTier: 'free', upgradeMessage: '' },
  manual_food_logging: { requiredTier: 'free', upgradeMessage: '' },
  barcode_scanner_v2: { requiredTier: 'free', upgradeMessage: '' },
  weight_logging: { requiredTier: 'free', upgradeMessage: '' },
  readiness_score_basic: { requiredTier: 'free', upgradeMessage: '' },
  streak_tracking: { requiredTier: 'free', upgradeMessage: '' },
  habit_tracking_limited: { requiredTier: 'free', upgradeMessage: '' },
  data_history_7day: { requiredTier: 'free', upgradeMessage: '' },
  goal_setting: { requiredTier: 'free', upgradeMessage: '' },
  dashboard_default: { requiredTier: 'free', upgradeMessage: '' },
  community_challenges_view: { requiredTier: 'free', upgradeMessage: '' },
  saved_meals: { requiredTier: 'free', upgradeMessage: '' },
  daily_readiness_score: { requiredTier: 'free', upgradeMessage: '' },

  ai_adaptive_programming: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro for adaptive AI training programs.',
  },
  ai_meal_camera_v2: {
    requiredTier: 'pro',
    freeLimit: 5,
    freeUnit: 'scans/month',
    upgradeMessage: 'Upgrade to Pro for unlimited AI meal camera scans.',
  },
  restaurant_menu_scanner: {
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to scan restaurant menus.',
  },
  ai_meal_plans_weekly: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for AI-generated weekly meal plans.' },
  ai_grocery_lists: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for AI grocery lists.' },
  batch_cook_meal_prep: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for batch cook meal prep.' },
  habit_tracking_unlimited: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for unlimited habit tracking.' },
  streak_shields: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro to earn streak shields.' },
  data_history_unlimited: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for unlimited data history.' },
  ai_daily_coaching: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for daily AI coaching.' },
  ai_journal_prompts: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for AI journal prompts.' },
  body_business_correlation_basic: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for body-business correlations.' },
  mood_performance_correlation_weekly: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for mood-performance correlation.' },
  ai_workout_narrator_v2: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for the AI workout narrator.' },
  context_aware_motivation: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for context-aware motivation.' },
  voice_commands_v2: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for voice commands.' },
  deep_work_focus_mode: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for Deep Work focus mode.' },
  ai_journaling_v2: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for AI journaling.' },
  siri_google_shortcuts: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for Siri & Google shortcuts.' },
  home_screen_widgets: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for home screen widgets.' },
  community_challenges_join: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro to join community challenges.' },
  leaderboards_v2: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro to compete on leaderboards.' },
  personal_finance_tracker: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for personal finance tracking.' },
  business_revenue_tracker: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for business revenue tracking.' },
  business_milestone_tracker: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for business milestone tracking.' },
  skill_knowledge_tracker: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for skill & knowledge tracking.' },
  spotify_integration_v2: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for Spotify integration.' },
  injury_prevention_tracker: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for injury prevention tracking.' },
  guided_mobility: { requiredTier: 'pro', upgradeMessage: 'Upgrade to Pro for guided mobility sessions.' },

  ai_trajectory_simulator_v2: {
    requiredTier: 'elite',
    upgradeMessage: 'Upgrade to Elite for the AI trajectory simulator.',
  },
  ai_progress_photo_analysis: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for AI body composition analysis.' },
  ai_form_check_video: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for AI form check.' },
  ghost_mode_training: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for Ghost Mode training.' },
  readiness_score_detailed: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for detailed readiness scores.' },
  body_business_correlation_full: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for full body-business correlation.' },
  mood_performance_correlation_daily: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for daily mood-performance tracking.' },
  nfc_geofence_triggers_v2: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for NFC & geofence triggers.' },
  auto_generated_social_content: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for AI social content.' },
  ai_sleep_optimizer_v2: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for the AI sleep optimizer.' },
  ai_vision_board: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for AI Vision Board.' },
  ai_supplement_advisor_v2: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for AI supplement advice.' },
  dashboard_builder_v2: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite to build a custom dashboard.' },
  apple_watch_companion: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for Apple Watch companion.' },
  ai_weekly_report_v2: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for AI weekly reports.' },
  unlimited_workout_history: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for unlimited workout history.' },
  stake_goals_v2: { requiredTier: 'elite', upgradeMessage: 'Upgrade to Elite for stake goals.' },

  partner_linking: { requiredTier: 'partners', upgradeMessage: 'Upgrade to Partners to link with your partner.' },
  partner_dashboard_v2: { requiredTier: 'partners', upgradeMessage: 'Upgrade to Partners for the partner dashboard.' },
  couples_live_sync_workout: { requiredTier: 'partners', upgradeMessage: 'Upgrade to Partners for live sync workouts.' },
  joint_streaks: { requiredTier: 'partners', upgradeMessage: 'Upgrade to Partners for joint streaks.' },
  partner_nudges: { requiredTier: 'partners', upgradeMessage: 'Upgrade to Partners for partner nudges.' },
  partner_challenges: { requiredTier: 'partners', upgradeMessage: 'Upgrade to Partners for partner challenges.' },
  partner_activity_feed: { requiredTier: 'partners', upgradeMessage: 'Upgrade to Partners for partner activity feed.' },
  partner_reactions: { requiredTier: 'partners', upgradeMessage: 'Upgrade to Partners for partner reactions.' },
  shared_vision_board: { requiredTier: 'partners', upgradeMessage: 'Upgrade to Partners for shared vision board.' },
  couples_weekly_review: { requiredTier: 'partners', upgradeMessage: 'Upgrade to Partners for couples weekly review.' },
  partner_data_permissions: { requiredTier: 'partners', upgradeMessage: 'Upgrade to Partners for partner data permissions.' },

  // Elite
  business_tracking: {
    requiredTier: 'elite',
    upgradeMessage: 'Upgrade to Elite to track your business metrics inside TRANSFORMR.',
  },
  finance_tracking: {
    requiredTier: 'elite',
    upgradeMessage: 'Upgrade to Elite for personal finance tracking.',
  },

  // Partners
  partner_features: {
    requiredTier: 'partners',
    upgradeMessage: 'Upgrade to Partners to unlock accountability partner features.',
  },
  partner_live_sync: {
    requiredTier: 'partners',
    upgradeMessage: 'Upgrade to Partners for real-time live sync with your partner.',
  },
};

// ---------------------------------------------------------------------------
// Tier hierarchy helpers
// ---------------------------------------------------------------------------

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  elite: 2,
  partners: 3,
};

/**
 * Returns true if `userTier` satisfies `requiredTier`.
 * `partners` grants access to everything (pro + elite + partners).
 * `elite` grants access to pro + elite.
 */
function tierSatisfies(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  if (requiredTier === 'free') return true;
  if (userTier === 'partners') return true; // partners implies all tiers
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier];
}

// ---------------------------------------------------------------------------
// Metered usage helpers
// ---------------------------------------------------------------------------

type MeteredUsageKey = keyof Omit<
  { aiMealCameraScans: number; aiChatMessages: number; lastResetDate: string },
  'lastResetDate'
>;

const METERED_FEATURE_MAP: Partial<Record<FeatureKey, MeteredUsageKey>> = {
  ai_meal_camera: 'aiMealCameraScans',
  ai_chat_coach: 'aiChatMessages',
  ai_meal_camera_v2: 'aiMealCameraScans',
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFeatureGate(feature: FeatureKey): FeatureGateResult {
  const tier = useSubscriptionStore((s) => s.tier);
  const usage = useSubscriptionStore((s) => s.usage);
  const incrementUsage = useSubscriptionStore((s) => s.incrementUsage);

  const gate = FEATURE_GATE_MAP[feature];
  const tierOk = tierSatisfies(tier, gate.requiredTier);
  const usageKey = METERED_FEATURE_MAP[feature];

  let isCapped = false;
  let remainingUses: number | null = null;

  if (tierOk && gate.freeLimit !== undefined && usageKey !== undefined) {
    const used = usage[usageKey];
    const remaining = gate.freeLimit - used;
    isCapped = remaining <= 0;
    remainingUses = Math.max(0, remaining);
  }

  const isAvailable = tierOk && !isCapped;

  const trackUsage = () => {
    if (usageKey !== undefined) {
      incrementUsage(usageKey);
    }
  };

  const showUpgradeModal = () => {
    upgradeModalEvents.emit(feature);
  };

  const checkAndPrompt = () => {
    if (isAvailable) return true;
    upgradeModalEvents.emit(feature);
    return false;
  };

  return {
    isAvailable,
    isCapped,
    remainingUses,
    requiredTier: gate.requiredTier,
    upgradeMessage: gate.upgradeMessage,
    trackUsage,
    showUpgradeModal,
    checkAndPrompt,
  };
}

// ---------------------------------------------------------------------------
// Standalone hasAccess helper (usable outside React components)
// ---------------------------------------------------------------------------

/**
 * Returns true if `userTier` grants access to `feature`.
 * Safe to call outside of React components (no hooks used).
 */
export function hasAccess(userTier: SubscriptionTier, feature: FeatureKey): boolean {
  const gate = FEATURE_GATE_MAP[feature];
  return tierSatisfies(userTier, gate.requiredTier);
}

/**
 * Returns the minimum subscription tier required for `feature`.
 * Safe to call outside of React components (no hooks used).
 */
export function getFeatureRequiredTier(feature: FeatureKey): SubscriptionTier {
  return FEATURE_GATE_MAP[feature].requiredTier;
}

// ---------------------------------------------------------------------------
// Multi-feature convenience hook
// ---------------------------------------------------------------------------

export function useFeatureGates(
  features: FeatureKey[],
): Record<string, boolean> {
  const tier = useSubscriptionStore((s) => s.tier);
  const usage = useSubscriptionStore((s) => s.usage);

  return features.reduce<Record<string, boolean>>((acc, feature) => {
    const gate = FEATURE_GATE_MAP[feature];
    const tierOk = tierSatisfies(tier, gate.requiredTier);
    const usageKey = METERED_FEATURE_MAP[feature];
    let isCapped = false;
    if (tierOk && gate.freeLimit !== undefined && usageKey !== undefined) {
      isCapped = usage[usageKey] >= gate.freeLimit;
    }
    acc[feature] = tierOk && !isCapped;
    return acc;
  }, {});
}
