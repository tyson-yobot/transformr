// =============================================================================
// TRANSFORMR — HistoryCapBanner
//
// Shown at the bottom of history lists when a free user has hit the 7-day cap.
// Renders only when tier === 'free'. Safe to add to any ScrollView/FlatList footer.
//
// Usage:
//   <HistoryCapBanner />
// =============================================================================

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { useSubscriptionStore } from '@stores/subscriptionStore';
import { upgradeModalEvents } from '@hooks/useFeatureGate';

export function HistoryCapBanner(): React.ReactElement | null {
  const tier = useSubscriptionStore((s) => s.tier);
  const { colors, typography, spacing, borderRadius } = useTheme();

  const handleUpgrade = useCallback(() => {
    upgradeModalEvents.emit('data_history_unlimited');
  }, []);

  if (tier !== 'free') return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.subtle,
          borderRadius: borderRadius.md,
          marginHorizontal: spacing.md,
          marginVertical: spacing.sm,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <Text style={[typography.caption, { color: colors.text.secondary, textAlign: 'center' }]}>
        Showing last 7 days
      </Text>
      <TouchableOpacity
        onPress={handleUpgrade}
        style={[
          styles.cta,
          {
            backgroundColor: colors.accent.primary,
            borderRadius: borderRadius.full,
            marginTop: spacing.xs,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.lg,
            minHeight: 36,
            justifyContent: 'center',
            alignItems: 'center',
            alignSelf: 'center',
          },
        ]}
        accessibilityLabel="Go Pro for unlimited history"
        accessibilityRole="button"
      >
        <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>
          Go Pro — Unlimited History
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
  },
  cta: {},
});
