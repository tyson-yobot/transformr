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
  | 'strava_integration';

export interface FeatureGateResult {
  isAvailable: boolean;
  isCapped: boolean;
  remainingUses: number | null;
  requiredTier: SubscriptionTier;
  upgradeMessage: string;
  trackUsage: () => void;
  showUpgradeModal: () => void;
}

// ---------------------------------------------------------------------------
// Global upgrade modal event emitter
// ---------------------------------------------------------------------------

type UpgradeModalListener = (feature: FeatureKey) => void;
let _listener: UpgradeModalListener | null = null;

export const upgradeModalEvents = {
  setListener: (fn: UpgradeModalListener) => {
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

  return {
    isAvailable,
    isCapped,
    remainingUses,
    requiredTier: gate.requiredTier,
    upgradeMessage: gate.upgradeMessage,
    trackUsage,
    showUpgradeModal,
  };
}
