// =============================================================================
// TRANSFORMR — GatePromptCard
//
// Inline card shown in place of gated content within a screen.
// Displays a blurred preview, a short benefit line, and an upgrade CTA.
//
// Usage:
//   const gate = useFeatureGate('ai_insights');
//   if (!gate.isAvailable) return <GatePromptCard featureKey="ai_insights" />;
// =============================================================================

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme/index';
import { useFeatureGate, FeatureKey } from '@hooks/useFeatureGate';

interface GatePromptCardProps {
  featureKey: FeatureKey;
  /** Optional custom height for the card. Defaults to 120. */
  height?: number;
}

export function GatePromptCard({ featureKey, height = 120 }: GatePromptCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { requiredTier, upgradeMessage, showUpgradeModal } = useFeatureGate(featureKey);

  const tierLabel = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.subtle,
          borderRadius: borderRadius.lg,
        },
      ]}
    >
      {/* Lock icon */}
      <Text style={styles.lockIcon}>🔒</Text>

      {/* Benefit text */}
      <Text
        style={[
          typography.caption,
          { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.lg },
        ]}
        numberOfLines={2}
      >
        {upgradeMessage}
      </Text>

      {/* Upgrade CTA */}
      <Pressable
        onPress={showUpgradeModal}
        style={[
          styles.ctaButton,
          {
            backgroundColor: colors.accent.primary,
            borderRadius: borderRadius.full,
            marginTop: spacing.sm,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.lg,
            minHeight: 44,
            justifyContent: 'center',
          },
        ]}
        accessibilityLabel={`Unlock with ${tierLabel}`}
        accessibilityRole="button"
      >
        <Text style={[typography.captionBold, { color: '#FFFFFF' /* brand-ok */
          Unlock with {tierLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lockIcon: {
    fontSize: 24,
  },
  ctaButton: {
    alignItems: 'center',
  },
});
