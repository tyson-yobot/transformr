import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface GhostComparison {
  label: string;
  currentValue: number;
  previousValue: number;
  unit: string;
}

interface GhostCardProps {
  exerciseName: string;
  comparisons: GhostComparison[];
  style?: ViewStyle;
}

function ComparisonRow({ item }: { item: GhostComparison }) {
  const { colors, typography, spacing } = useTheme();

  const diff = item.currentValue - item.previousValue;
  const isWinning = diff > 0;
  const isTied = diff === 0;

  const diffColor = isTied
    ? colors.text.muted
    : isWinning
      ? colors.accent.success
      : colors.accent.danger;

  const diffSymbol = isTied ? '' : isWinning ? '+' : '';

  return (
    <View style={[styles.compRow, { paddingVertical: spacing.sm }]}>
      <Text style={[typography.caption, { color: colors.text.secondary, flex: 1 }]}>
        {item.label}
      </Text>

      {/* Previous (ghost) */}
      <View style={styles.valueCol}>
        <Text style={[typography.caption, { color: colors.text.muted }]}>
          {item.previousValue} {item.unit}
        </Text>
      </View>

      {/* Current */}
      <View style={styles.valueCol}>
        <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
          {item.currentValue} {item.unit}
        </Text>
      </View>

      {/* Diff */}
      <View style={[styles.diffCol, { minWidth: 56 }]}>
        <Text style={[typography.captionBold, { color: diffColor, textAlign: 'right' }]}>
          {diffSymbol}{diff} {item.unit}
        </Text>
      </View>
    </View>
  );
}

export function GhostCard({
  exerciseName,
  comparisons,
  style,
}: GhostCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const totalWins = comparisons.filter(
    (c) => c.currentValue > c.previousValue,
  ).length;
  const isOverallWinning = totalWins > comparisons.length / 2;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          borderLeftWidth: 3,
          borderLeftColor: isOverallWinning
            ? colors.accent.success
            : colors.accent.danger,
        },
        style,
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { marginBottom: spacing.md }]}>
        <Text style={{ fontSize: 18, marginRight: spacing.sm }}>
          {'\uD83D\uDC7B'}
        </Text>
        <Text style={[typography.h3, { color: colors.text.primary, flex: 1 }]}>
          You vs Last Time
        </Text>
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: isOverallWinning
                ? `${colors.accent.success}20`
                : `${colors.accent.danger}20`,
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Text
            style={[
              typography.captionBold,
              {
                color: isOverallWinning
                  ? colors.accent.success
                  : colors.accent.danger,
              },
            ]}
          >
            {isOverallWinning ? 'Winning' : 'Behind'}
          </Text>
        </View>
      </View>

      {/* Exercise */}
      <Text
        style={[
          typography.caption,
          { color: colors.text.secondary, marginBottom: spacing.sm },
        ]}
      >
        {exerciseName}
      </Text>

      {/* Column headers */}
      <View style={[styles.compRow, { paddingVertical: spacing.xs }]}>
        <Text style={[typography.tiny, { color: colors.text.muted, flex: 1 }]}>
          Metric
        </Text>
        <View style={styles.valueCol}>
          <Text style={[typography.tiny, { color: colors.text.muted }]}>
            Last
          </Text>
        </View>
        <View style={styles.valueCol}>
          <Text style={[typography.tiny, { color: colors.text.muted }]}>
            Now
          </Text>
        </View>
        <View style={[styles.diffCol, { minWidth: 56 }]}>
          <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'right' }]}>
            Diff
          </Text>
        </View>
      </View>

      {/* Comparison rows */}
      {comparisons.map((comp, idx) => (
        <ComparisonRow key={`${comp.label}-${idx}`} item={comp} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {},
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueCol: {
    width: 72,
    alignItems: 'center',
  },
  diffCol: {
    alignItems: 'flex-end',
  },
});
