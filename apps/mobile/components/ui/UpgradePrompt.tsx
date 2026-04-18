// =============================================================================
// TRANSFORMR — UpgradePrompt
//
// Inline paywall overlay. Wraps optional preview content behind a blur-dimmed
// lock overlay with an upgrade CTA. Renders nothing when the feature is
// already available to the user.
//
// Usage:
//   <UpgradePrompt
//     feature="ai_trajectory_simulator"
//     lockedMessage="See two futures — unlock with Elite"
//     previewContent={<TrajectoryChartPreview />}
//   />
// =============================================================================

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { useFeatureGate, FeatureKey } from '@hooks/useFeatureGate';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { track } from '../../services/analytics';
import { usePathname } from 'expo-router';

interface UpgradePromptProps {
  feature: FeatureKey;
  /** Optional blurred preview rendered behind the lock overlay. */
  previewContent?: React.ReactNode;
  /** Custom message shown below the lock icon. */
  lockedMessage?: string;
  /** Minimum height for the component. Defaults to 120. */
  minHeight?: number;
}

export function UpgradePrompt({
  feature,
  previewContent,
  lockedMessage,
  minHeight = 120,
}: UpgradePromptProps): React.ReactElement | null {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { isAvailable, requiredTier, checkAndPrompt } = useFeatureGate(feature);
  const userTier = useSubscriptionStore((s) => s.tier);
  const pathname = usePathname();

  const tierLabel = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  const handleUnlockPress = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track('feature_gate_hit', {
      feature,
      user_tier: userTier,
      required_tier: requiredTier,
      screen: pathname,
    });
    checkAndPrompt();
  }, [feature, requiredTier, checkAndPrompt, userTier, pathname]);

  // Render nothing when the user already has access
  if (isAvailable) return null;

  return (
    <View
      style={[
        styles.container,
        {
          minHeight,
          borderRadius: borderRadius.lg,
          borderColor: colors.border.subtle,
          backgroundColor: colors.background.secondary,
        },
      ]}
    >
      {/* Optional blurred preview */}
      {previewContent != null && (
        <View style={styles.preview} pointerEvents="none">
          {previewContent}
        </View>
      )}

      {/* Lock overlay */}
      <View
        style={[
          styles.overlay,
          { backgroundColor: colors.background.primary + 'E6' },
        ]}
      >
        <View
          style={[
            styles.lockIconWrap,
            {
              backgroundColor: colors.dim.primary,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Ionicons name="lock-closed" size={22} color={colors.accent.primary} />
        </View>

        <Text
          style={[
            typography.caption,
            {
              color: colors.text.secondary,
              textAlign: 'center',
              marginTop: spacing.sm,
              marginHorizontal: spacing.lg,
            },
          ]}
        >
          {lockedMessage ?? `Requires ${tierLabel} plan`}
        </Text>

        <Pressable
          onPress={handleUnlockPress}
          style={[
            styles.ctaButton,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: borderRadius.md,
              marginTop: spacing.md,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              minHeight: 44,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Unlock ${feature.replace(/_/g, ' ')} — upgrade to ${tierLabel}`}
        >
          <Text style={[typography.captionBold, { color: colors.text.inverse }]}>
            Unlock — Go {tierLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  preview: {
    opacity: 0.12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
