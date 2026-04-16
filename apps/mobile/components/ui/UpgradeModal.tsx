// =============================================================================
// TRANSFORMR — UpgradeModal
//
// Usage: place <UpgradeModal /> inside app/(tabs)/_layout.tsx (or the root
// layout) so it sits above all screens. It has no props; it subscribes to
// the global `upgradeModalEvents` emitter from useFeatureGate.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import { upgradeModalEvents, FeatureKey, useFeatureGate } from '../../hooks/useFeatureGate';
import { createSubscription } from '../../services/stripe';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type UpgradeTier = 'pro' | 'elite' | 'partners';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TIER_PRICES: Record<UpgradeTier, { monthly: string; annual: string }> = {
  pro:      { monthly: '$9.99',  annual: '$8.29'  },
  elite:    { monthly: '$19.99', annual: '$16.59' },
  partners: { monthly: '$29.99', annual: '$24.91' },
};

const TIER_FEATURES: Record<UpgradeTier, string[]> = {
  pro: [
    'Unlimited AI coaching messages',
    'AI meal camera & grocery lists',
    'Readiness score & insights',
    'Wearable integrations',
  ],
  elite: [
    'Everything in Pro',
    'Business & finance tracking',
    'AI trajectory simulator',
    'Priority support',
  ],
  partners: [
    'Everything in Elite',
    'Live partner sync',
    'Accountability features',
    'Shared challenge progress',
  ],
};

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
  onSelect: (tier: UpgradeTier) => void;
}

function TierCard({ tier, isSelected, isAnnual, onSelect }: TierCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const isRecommended = tier === 'pro';
  const price = isAnnual ? TIER_PRICES[tier].annual : TIER_PRICES[tier].monthly;

  const handlePress = useCallback(() => {
    onSelect(tier);
  }, [tier, onSelect]);

  const cardBorderColor = isSelected ? colors.accent.primary : colors.border.default;
  const cardBg = isSelected ? colors.dim.primary : colors.background.tertiary;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.tierCard,
        {
          backgroundColor: cardBg,
          borderColor: cardBorderColor,
          borderRadius: borderRadius.md,
          padding: spacing.md,
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
          <Text style={[typography.caption, { color: colors.text.inverse, fontWeight: '700' }]}>
            Most Popular
          </Text>
        </View>
      )}

      <Text
        style={[
          typography.h3,
          { color: isSelected ? colors.accent.primary : colors.text.primary, fontWeight: '700' },
        ]}
      >
        {TIER_LABELS[tier]}
      </Text>

      <Text style={[typography.body, { color: colors.text.primary, fontWeight: '700', marginTop: 2 }]}>
        {price}
        <Text style={[typography.caption, { color: colors.text.secondary, fontWeight: '400' }]}>
          {' '}/mo
        </Text>
      </Text>

      <View style={{ marginTop: spacing.sm }}>
        {TIER_FEATURES[tier].map((feature) => (
          <View key={feature} style={[styles.featureRow, { marginTop: 4 }]}>
            <Text style={[typography.caption, { color: colors.accent.primary, marginRight: 4 }]}>
              ·
            </Text>
            <Text
              style={[typography.caption, { color: colors.text.secondary, flex: 1 }]}
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
// Inner modal content — receives a stable featureKey once visible
// ---------------------------------------------------------------------------

interface UpgradeModalContentProps {
  featureKey: FeatureKey;
  onClose: () => void;
}

function UpgradeModalContent({ featureKey, onClose }: UpgradeModalContentProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { upgradeMessage } = useFeatureGate(featureKey);

  const [selectedTier, setSelectedTier] = useState<UpgradeTier>('pro');
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTierSelect = useCallback((tier: UpgradeTier) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTier(tier);
  }, []);

  const handleToggleAnnual = useCallback(() => {
    setIsAnnual((prev) => !prev);
  }, []);

  const handleCTA = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      const result = await createSubscription(selectedTier, isAnnual ? 'annual' : 'monthly');
      if (!result.error) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedTier, isAnnual, onClose]);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text
          style={[typography.h2, { color: colors.text.primary, flex: 1, fontWeight: '700' }]}
          numberOfLines={3}
        >
          {upgradeMessage || 'Upgrade to unlock this feature'}
        </Text>
        <Pressable
          onPress={onClose}
          style={[
            styles.closeButton,
            { backgroundColor: colors.background.tertiary, borderRadius: 22 },
          ]}
          hitSlop={8}
          accessibilityLabel="Close upgrade modal"
          accessibilityRole="button"
        >
          <Text style={[typography.body, { color: colors.text.secondary, fontWeight: '600' }]}>
            {'\u2715'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tier cards */}
        <View style={[styles.tierRow, { marginTop: spacing.lg, gap: spacing.sm }]}>
          {TIERS.map((tier) => (
            <TierCard
              key={tier}
              tier={tier}
              isSelected={selectedTier === tier}
              isAnnual={isAnnual}
              onSelect={handleTierSelect}
            />
          ))}
        </View>

        {/* Annual toggle */}
        <Pressable
          onPress={handleToggleAnnual}
          style={[
            styles.annualToggle,
            {
              backgroundColor: isAnnual ? colors.dim.primary : colors.background.tertiary,
              borderColor: isAnnual ? colors.accent.primary : colors.border.default,
              borderRadius: borderRadius.md,
              marginTop: spacing.lg,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
            },
          ]}
          accessibilityLabel={isAnnual ? 'Annual billing selected, save 17%' : 'Switch to annual billing and save 17%'}
          accessibilityRole="switch"
          accessibilityState={{ checked: isAnnual }}
        >
          <View style={styles.annualToggleInner}>
            <View
              style={[
                styles.toggleDot,
                {
                  backgroundColor: isAnnual ? colors.accent.primary : colors.text.muted,
                },
              ]}
            />
            <Text style={[typography.body, { color: colors.text.primary, marginLeft: spacing.sm }]}>
              Annual{' '}
              <Text style={{ color: colors.accent.success, fontWeight: '700' }}>
                (save 17%)
              </Text>
            </Text>
          </View>
        </Pressable>

        {/* CTA button */}
        <Pressable
          onPress={handleCTA}
          disabled={isLoading}
          style={[
            styles.ctaButton,
            {
              backgroundColor: isLoading ? colors.accent.primaryDark : colors.accent.primary,
              borderRadius: borderRadius.md,
              marginTop: spacing.lg,
              height: 52,
            },
          ]}
          accessibilityLabel={`Upgrade to ${TIER_LABELS[selectedTier]}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
        >
          <Text style={[typography.h3, { color: colors.text.inverse, fontWeight: '700' }]}>
            {isLoading ? 'Processing…' : `Upgrade to ${TIER_LABELS[selectedTier]}`}
          </Text>
        </Pressable>

        {/* Fine print */}
        <Text
          style={[
            typography.caption,
            { color: colors.text.muted, textAlign: 'center', marginTop: spacing.md },
          ]}
        >
          Cancel anytime · Secure payment by Stripe
        </Text>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function UpgradeModal() {
  const { colors } = useTheme();

  const [isVisible, setIsVisible] = useState(false);
  // Keep the last-received featureKey stable while the modal is animating out.
  const [featureKey, setFeatureKey] = useState<FeatureKey>('ai_chat_coach');
  const featureKeyRef = useRef<FeatureKey>('ai_chat_coach');

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const open = useCallback((feature: FeatureKey) => {
    featureKeyRef.current = feature;
    setFeatureKey(feature);
    setIsVisible(true);
    backdropOpacity.value = withTiming(1, { duration: 250 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  }, [backdropOpacity, translateY]);

  const close = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20, stiffness: 200 });
    // Delay unmount until animation completes
    setTimeout(() => setIsVisible(false), 300);
  }, [backdropOpacity, translateY]);

  useEffect(() => {
    upgradeModalEvents.setListener(open);
    return () => {
      upgradeModalEvents.setListener(() => undefined);
    };
  }, [open]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityLabel="Dismiss upgrade modal"
            accessibilityRole="button"
          />
        </Animated.View>

        {/* Bottom sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background.primary,
            },
            sheetStyle,
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border.default }]} />
          </View>

          <UpgradeModalContent featureKey={featureKey} onClose={close} />
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    flexShrink: 0,
  },
  tierRow: {
    flexDirection: 'row',
  },
  tierCard: {
    flex: 1,
    borderWidth: 1.5,
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
});
