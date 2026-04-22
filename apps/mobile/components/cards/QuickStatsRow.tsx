import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

type TrendDirection = 'up' | 'down' | 'flat';

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueNode?: React.ReactNode;
  trend?: TrendDirection;
  trendValue?: string;
  glowColor?: string;
  accentColor?: string;
}

interface QuickStatsRowProps {
  stats: StatItem[];
  style?: ViewStyle;
}

function TrendIndicator({
  direction,
  value,
}: {
  direction: TrendDirection;
  value?: string;
}) {
  const { colors, typography, spacing } = useTheme();

  const trendConfig: Record<TrendDirection, { symbol: string; color: string }> = {
    up: { symbol: '\u2191', color: colors.accent.success },
    down: { symbol: '\u2193', color: colors.accent.danger },
    flat: { symbol: '\u2192', color: colors.text.muted },
  };

  const { symbol, color } = trendConfig[direction];

  return (
    <View style={[styles.trendRow, { marginTop: spacing.xs }]}>
      <Text style={[typography.tiny, { color }]}>
        {symbol}
        {value ? ` ${value}` : ''}
      </Text>
    </View>
  );
}

function StatCell({ item }: { item: StatItem }) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const shadowColor = item.glowColor ?? colors.accent.primary;
  const valueColor  = item.accentColor ?? colors.text.primary;

  return (
    <View
      style={[
        styles.cell,
        {
          backgroundColor: colors.background.tertiary,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
          shadowColor,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.20,
          shadowRadius: 10,
          elevation: 5,
        },
      ]}
      accessibilityLabel={`${item.label}: ${item.value}`}
    >
      <View style={[styles.iconWrap, { marginBottom: spacing.xs }]}>
        {item.icon}
      </View>
      {item.valueNode ?? (
        <Text
          style={[typography.monoBody, { color: valueColor }]}
          numberOfLines={1}
        >
          {item.value}
        </Text>
      )}
      <Text
        style={[typography.tiny, { color: colors.text.muted, marginTop: 2 }]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      {item.trend ? (
        <TrendIndicator direction={item.trend} value={item.trendValue} />
      ) : null}
    </View>
  );
}

export const QuickStatsRow = React.memo(function QuickStatsRow({ stats, style }: QuickStatsRowProps) {
  const { spacing } = useTheme();

  return (
    <View style={[styles.row, { gap: spacing.sm }, style]}>
      {stats.map((stat, index) => (
        <StatCell key={`${stat.label}-${index}`} item={stat} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  iconWrap: {
    alignItems: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
