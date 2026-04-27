// =============================================================================
// TRANSFORMR — Upgrade Screen
//
// Full-screen upgrade page navigable from the profile tab (and any gate prompt).
// Accepts an optional `feature` search param (FeatureKey) to highlight the
// required tier for the blocked feature.
//
// Usage:
//   router.push({ pathname: '/upgrade', params: { feature: 'ai_chat_coach' } });
// =============================================================================

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { AmbientBackground } from '../components/ui/AmbientBackground';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { GlowButton } from '../components/ui/GlowButton';
import { FeatureHighlightRow } from '../components/ui/FeatureHighlightRow';
import { SectionHeader } from '../components/ui/SectionHeader';
import { createSubscription, restorePurchase } from '../services/stripe';
import { useFeatureGate, FeatureKey } from '../hooks/useFeatureGate';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type UpgradeTier = 'pro' | 'elite' | 'partners';

const TIER_PRICES: Record<UpgradeTier, { monthly: string; annual: string }> = {
  pro:      { monthly: '$9.99',  annual: '$6.67'  },
  elite:    { monthly: '$14.99', annual: '$10.00' },
  partners: { monthly: '$19.99', annual: '$13.33' },
};

const TIER_FEATURES: Record<UpgradeTier, string[]> = {
  pro: [
    'Unlimited AI coaching messages',
    'AI meal camera & grocery lists',
    'Readiness score & insights',
    'Wearable integrations',
    'Unlimited habit tracking',
    'Unlimited data history',
    'AI adaptive programming',
    'Smart notifications',
    'Pain & mobility tracking',
    'Business & finance tracking',
  ],
  elite: [
    'Everything in Pro, plus:',
    'AI form check video analysis',
    'Ghost Mode training',
    'AI trajectory simulator',
    'AI sleep optimizer',
    'AI progress photo analysis',
    'Custom dashboard builder',
    'NFC & geofence triggers',
    'AI social content generation',
    'Priority AI response times',
  ],
  partners: [
    'Everything in Elite, plus:',
    'Live partner sync workouts',
    'Joint streaks & accountability',
    'Partner nudges & reactions',
    'Partner challenges',
    'Shared vision board',
    'Couples weekly review',
    'Partner activity feed',
    'Partner data permissions',
  ],
};

const FREE_FEATURES: string[] = [
  'Workout logging & exercise library',
  'Manual food logging & barcode scanner',
  'Weight tracking',
  'Basic readiness score',
  'Streak tracking',
  'Up to 3 habits',
  '7-day data history',
  'Goal setting',
  'View community challenges',
];

const TIER_LABELS: Record<UpgradeTier, string> = {
  pro:      'Pro',
  elite:    'Elite',
  partners: 'Partners',
};

const TIERS: UpgradeTier[] = ['pro', 'elite', 'partners'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface TierCardProps {
  tier: UpgradeTier;
  isSelected: boolean;
  isAnnual: boolean;
  isHighlighted: boolean;
  onSelect: (tier: UpgradeTier) => void;
}

function TierCard({ tier, isSelected, isAnnual, isHighlighted, onSelect }: TierCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const price = isAnnual ? TIER_PRICES[tier].annual : TIER_PRICES[tier].monthly;
  const isRecommended = tier === 'pro';

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(tier);
  }, [tier, onSelect]);

  const borderColor = isHighlighted
    ? colors.accent.secondary
    : isSelected
    ? colors.accent.primary
    : colors.border.default;

  const bgColor = isSelected ? colors.dim.primary : colors.background.tertiary;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.tierCard,
        {
          backgroundColor: bgColor,
          borderColor,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          borderWidth: isHighlighted || isSelected ? 2 : 1.5,
        },
      ]}
      accessibilityLabel={`Select ${TIER_LABELS[tier]} plan at ${price} per ${isAnnual ? 'month billed annually' : 'month'}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
    >
      {isRecommended && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: borderRadius.sm,
              marginBottom: spacing.xs,
            },
          ]}
        >
          <Text
            style={[typography.caption, { color: colors.text.inverse, fontWeight: '700' }]}
          >
            Most Popular
          </Text>
        </View>
      )}

      {isHighlighted && !isRecommended && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.accent.secondary,
              borderRadius: borderRadius.sm,
              marginBottom: spacing.xs,
            },
          ]}
        >
          <Text
            style={[typography.caption, { color: colors.text.inverse, fontWeight: '700' }]}
          >
            Required
          </Text>
        </View>
      )}

      <Text
        style={[
          typography.h3,
          {
            color: isSelected ? colors.accent.primary : colors.text.primary,
            fontWeight: '700',
          },
        ]}
      >
        {TIER_LABELS[tier]}
      </Text>

      <Text
        style={[
          typography.body,
          { color: colors.text.primary, fontWeight: '700', marginTop: 2 },
        ]}
      >
        {price}
        <Text
          style={[
            typography.caption,
            { color: colors.text.secondary, fontWeight: '400' },
          ]}
        >
          {' '}/mo
        </Text>
      </Text>

      <View style={{ marginTop: spacing.sm }}>
        {TIER_FEATURES[tier].map((feature) => (
          <View key={feature} style={[styles.featureRow, { marginTop: 4 }]}>
            <Text
              style={[
                typography.caption,
                { color: colors.accent.primary, marginRight: 4 },
              ]}
            >
              ·
            </Text>
            <Text
              style={[
                typography.caption,
                { color: colors.text.secondary, flex: 1 },
              ]}
              numberOfLines={2}
            >
              {feature}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the tier that gates the given feature, or 'pro' as fallback. */
function useRequiredTier(feature: FeatureKey | undefined): UpgradeTier {
  const gate = useFeatureGate(feature ?? 'ai_chat_coach');
  const required = gate.requiredTier;
  if (required === 'elite' || required === 'partners') return required;
  return 'pro';
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function UpgradeScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{ feature?: string }>();
  const featureParam = params.feature as FeatureKey | undefined;

  const requiredTier = useRequiredTier(featureParam);

  const [selectedTier, setSelectedTier] = useState<UpgradeTier>(requiredTier);
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleTierSelect = useCallback((tier: UpgradeTier) => {
    setSelectedTier(tier);
  }, []);

  const handleToggleAnnual = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAnnual((prev) => !prev);
  }, []);

  const handleUpgrade = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoadingPurchase(true);
    setStatusMessage(null);
    try {
      const result = await createSubscription(
        selectedTier,
        isAnnual ? 'annual' : 'monthly',
      );
      if (result.error) {
        setStatusMessage(result.error);
      } else {
        router.back();
      }
    } finally {
      setIsLoadingPurchase(false);
    }
  }, [selectedTier, isAnnual, router]);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoadingRestore(true);
    setStatusMessage(null);
    try {
      const result = await restorePurchase();
      if (result.error) {
        setStatusMessage(result.error);
      } else if (result.tier) {
        setStatusMessage(`Restored ${result.tier} subscription.`);
        setTimeout(() => router.back(), 1200);
      } else {
        setStatusMessage('No active subscription found to restore.');
      }
    } finally {
      setIsLoadingRestore(false);
    }
  }, [router]);

  const featureGate = useFeatureGate(featureParam ?? 'ai_chat_coach');
  const upgradeMessage = featureParam
    ? featureGate.upgradeMessage
    : 'Unlock the full TRANSFORMR experience';

  const isBusy = isLoadingPurchase || isLoadingRestore;

  return (
    <>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <Stack.Screen
        options={{
          title: 'Upgrade TRANSFORMR',
          headerBackTitle: 'Back',
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero headline */}
        <Text
          style={[
            typography.h2,
            {
              color: colors.text.primary,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: spacing.xs,
            },
          ]}
        >
          {upgradeMessage}
        </Text>

        <Text
          style={[
            typography.body,
            {
              color: colors.text.secondary,
              textAlign: 'center',
              marginBottom: spacing.lg,
            },
          ]}
        >
          Choose the plan that fits your goals.
        </Text>

        {/* Tier cards */}
        <View style={[styles.tierRow, { gap: spacing.sm }]}>
          {TIERS.map((tier) => (
            <TierCard
              key={tier}
              tier={tier}
              isSelected={selectedTier === tier}
              isAnnual={isAnnual}
              isHighlighted={tier === requiredTier && tier !== 'pro'}
              onSelect={handleTierSelect}
            />
          ))}
        </View>

        {/* Annual billing toggle */}
        <Pressable
          onPress={handleToggleAnnual}
          style={[
            styles.annualToggle,
            {
              backgroundColor: isAnnual
                ? colors.dim.primary
                : colors.background.tertiary,
              borderColor: isAnnual
                ? colors.accent.primary
                : colors.border.default,
              borderRadius: borderRadius.md,
              marginTop: spacing.lg,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              minHeight: 44,
            },
          ]}
          accessibilityLabel={
            isAnnual
              ? 'Annual billing selected, save 33%'
              : 'Switch to annual billing and save 33%'
          }
          accessibilityRole="switch"
          accessibilityState={{ checked: isAnnual }}
        >
          <View style={styles.annualToggleInner}>
            <View
              style={[
                styles.toggleDot,
                {
                  backgroundColor: isAnnual
                    ? colors.accent.primary
                    : colors.text.muted,
                },
              ]}
            />
            <Text
              style={[
                typography.body,
                { color: colors.text.primary, marginLeft: spacing.sm },
              ]}
            >
              Annual billing{' '}
              <Text style={{ color: colors.accent.success, fontWeight: '700' }}>
                (save 33%)
              </Text>
            </Text>
          </View>
        </Pressable>

        {/* Status / error message */}
        {statusMessage ? (
          <Text
            style={[
              typography.caption,
              {
                color: colors.accent.danger ?? colors.text.muted,
                textAlign: 'center',
                marginTop: spacing.md,
              },
            ]}
          >
            {statusMessage}
          </Text>
        ) : null}

        {/* Feature highlights */}
        <SectionHeader title="What you unlock" style={{ marginTop: spacing.lg }} />
        <View style={{ marginBottom: spacing.sm }}>
          <FeatureHighlightRow
            icon="sparkles"
            iconColor={colors.accent.cyan}
            title="Unlimited AI coaching"
            subtitle="Personalized guidance that knows your data"
          />
          <FeatureHighlightRow
            icon="camera-outline"
            iconColor={colors.accent.success}
            title="AI meal camera"
            subtitle="Snap a photo — macros calculated instantly"
          />
          <FeatureHighlightRow
            icon="pulse-outline"
            iconColor={colors.accent.primary}
            title="Readiness score"
            subtitle="Know when to push hard and when to recover"
          />
          <FeatureHighlightRow
            icon="trending-up-outline"
            iconColor={colors.accent.gold}
            title="Trajectory simulator"
            subtitle="See where you'll be in 30, 60, 90 days"
          />
          <FeatureHighlightRow
            icon="body-outline"
            iconColor={colors.accent.secondary}
            title="Ghost Mode training"
            subtitle="Race your past self in any workout"
          />
          <FeatureHighlightRow
            icon="moon-outline"
            iconColor={colors.accent.info}
            title="AI sleep optimizer"
            subtitle="Optimize your recovery with intelligent sleep analysis"
          />
        </View>

        {/* What's included free */}
        <SectionHeader title="Already included free" style={{ marginTop: spacing.sm }} />
        <View
          style={{
            backgroundColor: colors.background.tertiary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          {FREE_FEATURES.map((feature) => (
            <View key={feature} style={[styles.featureRow, { marginTop: 3 }]}>
              <Text
                style={[
                  typography.caption,
                  { color: colors.accent.success, marginRight: 6 },
                ]}
              >
                ✓
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.secondary, flex: 1 },
                ]}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA button */}
        <GlowButton
          title={`Upgrade to ${TIER_LABELS[selectedTier]}`}
          onPress={handleUpgrade}
          loading={isLoadingPurchase}
          disabled={isBusy}
          fullWidth
          style={{ marginTop: spacing.md }}
        />

        {/* Fine print */}
        <Text
          style={[
            typography.caption,
            {
              color: colors.text.muted,
              textAlign: 'center',
              marginTop: spacing.md,
            },
          ]}
        >
          Cancel anytime · Secure payment by Stripe
        </Text>

        {/* Restore purchases */}
        <Pressable
          onPress={handleRestore}
          disabled={isBusy}
          style={[styles.restoreButton, { marginTop: spacing.md, minHeight: 44 }]}
          accessibilityLabel="Restore previous purchases"
          accessibilityRole="button"
        >
          {isLoadingRestore ? (
            <ActivityIndicator size="small" color={colors.accent.primary} />
          ) : (
            <Text
              style={[
                typography.caption,
                {
                  color: colors.accent.primary,
                  textDecorationLine: 'underline',
                  fontWeight: '500',
                },
              ]}
            >
              Restore Purchases
            </Text>
          )}
        </Pressable>
      </ScrollView>
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  tierRow: {
    flexDirection: 'row',
  },
  tierCard: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  annualToggle: {
    borderWidth: 1.5,
  },
  annualToggleInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
