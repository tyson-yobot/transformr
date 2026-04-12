// =============================================================================
// TRANSFORMR -- Budget Bar
// Horizontal bar showing monthly supplement spend vs budget with a fill color
// that shifts from green → gold → red as spend approaches/exceeds the budget.
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

interface BudgetBarProps {
  spent: number;
  budget: number;
  compact?: boolean;
}

export function BudgetBar({ spent, budget, compact = false }: BudgetBarProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const safebudget = Math.max(budget, 1);
  const ratio = spent / safebudget;
  const widthPct = Math.min(ratio * 100, 100);
  const remaining = budget - spent;

  const fillColor = (() => {
    if (ratio <= 0.6) return colors.accent.success;
    if (ratio <= 0.85) return colors.accent.gold;
    return colors.accent.danger;
  })();

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View
          style={[
            styles.trackCompact,
            {
              backgroundColor: colors.background.tertiary,
              borderRadius: 3,
            },
          ]}
        >
          <View
            style={[
              styles.fillCompact,
              {
                width: `${widthPct}%`,
                backgroundColor: fillColor,
                borderRadius: 3,
              },
            ]}
          />
        </View>
        <Text
          style={[
            typography.tiny,
            { color: fillColor, marginLeft: spacing.xs },
          ]}
        >
          ${spent.toFixed(0)}/${budget.toFixed(0)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.labelRow, { marginBottom: spacing.xs }]}>
        <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
          Monthly Budget
        </Text>
        <Text style={[typography.captionBold, { color: fillColor }]}>
          ${spent.toFixed(2)} / ${budget.toFixed(2)}
        </Text>
      </View>
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.background.tertiary,
            borderRadius: borderRadius.sm,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${widthPct}%`,
              backgroundColor: fillColor,
              borderRadius: borderRadius.sm,
            },
          ]}
        />
      </View>
      <Text
        style={[
          typography.tiny,
          {
            color: remaining >= 0 ? colors.text.muted : colors.accent.danger,
            marginTop: spacing.xs,
          },
        ]}
      >
        {remaining >= 0
          ? `$${remaining.toFixed(2)} remaining`
          : `$${Math.abs(remaining).toFixed(2)} over budget`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 10,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackCompact: {
    height: 6,
    flex: 1,
    overflow: 'hidden',
  },
  fillCompact: {
    height: '100%',
  },
});
