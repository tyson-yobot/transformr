// =============================================================================
// TRANSFORMR — Analytics Service
//
// Events are logged in __DEV__ mode.
// Wire a PostHog / Segment / Mixpanel SDK here when the provider is chosen.
// =============================================================================

import type { SubscriptionTier } from '@stores/subscriptionStore';
import type { FeatureKey } from '@hooks/useFeatureGate';

type BillingInterval = 'monthly' | 'annual';

export interface AnalyticsEvents {
  feature_gate_hit: {
    feature: FeatureKey;
    user_tier: SubscriptionTier;
    required_tier: SubscriptionTier;
    screen: string;
  };
  upgrade_modal_shown: {
    feature: FeatureKey;
    target_tier: SubscriptionTier;
    trigger: 'gate_hit' | 'manual' | 'day7_prompt' | 'day14_prompt';
  };
  upgrade_modal_cta_tapped: {
    feature: FeatureKey;
    target_tier: SubscriptionTier;
  };
  upgrade_modal_dismissed: {
    feature: FeatureKey;
    target_tier: SubscriptionTier;
  };
  subscription_started: {
    tier: SubscriptionTier;
    billing_interval: BillingInterval;
    trial: boolean;
    source_feature: FeatureKey | null;
  };
  subscription_cancelled: {
    tier: SubscriptionTier;
    days_active: number;
  };
}

export function track<K extends keyof AnalyticsEvents>(
  event: K,
  properties: AnalyticsEvents[K],
): void {
  if (__DEV__) {
    console.log('[Analytics]', event, properties);
  }
}
