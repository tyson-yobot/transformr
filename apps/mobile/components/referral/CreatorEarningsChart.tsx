// =============================================================================
// TRANSFORMR — CreatorEarningsChart
// Simple bar chart showing monthly creator earnings with View-based bars.
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

interface EarningsDataPoint {
  month: string;
  amount: number;
}

interface CreatorEarningsChartProps {
  earnings: EarningsDataPoint[];
  totalEarnings: number;
  pendingPayout: number;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function CreatorEarningsChart({
  earnings,
  totalEarnings,
  pendingPayout,
}: CreatorEarningsChartProps) {
  const { colors, spacing, borderRadius } = useTheme();

  const maxAmount = earnings.length > 0
    ? Math.max(...earnings.map((e) => e.amount))
    : 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
        },
      ]}
    >
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.accent.goldDim,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginRight: spacing.sm,
            },
          ]}
        >
          <View style={styles.summaryHeader}>
            <Ionicons
              name="wallet-outline"
              size={16}
              color={colors.accent.gold}
              style={{ marginRight: spacing.xs }}
            />
            <Text
              style={{
                color: colors.accent.gold,
                fontSize: 12,
                fontWeight: '500',
              }}
            >
              Total Earnings
            </Text>
          </View>
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 20,
              fontWeight: '700',
              marginTop: spacing.xs,
            }}
          >
            {formatCurrency(totalEarnings)}
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.accent.successDim,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginLeft: spacing.sm,
            },
          ]}
        >
          <View style={styles.summaryHeader}>
            <Ionicons
              name="arrow-up-circle-outline"
              size={16}
              color={colors.accent.success}
              style={{ marginRight: spacing.xs }}
            />
            <Text
              style={{
                color: colors.accent.success,
                fontSize: 12,
                fontWeight: '500',
              }}
            >
              Pending Payout
            </Text>
          </View>
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 20,
              fontWeight: '700',
              marginTop: spacing.xs,
            }}
          >
            {formatCurrency(pendingPayout)}
          </Text>
        </View>
      </View>

      {/* Chart Title */}
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 16,
          fontWeight: '600',
          marginTop: spacing.xl,
          marginBottom: spacing.md,
        }}
      >
        Monthly Earnings
      </Text>

      {/* Bar Chart */}
      {earnings.length === 0 ? (
        <View style={[styles.emptyState, { padding: spacing.xxl }]}>
          <Ionicons
            name="bar-chart-outline"
            size={32}
            color={colors.text.muted}
          />
          <Text
            style={{
              color: colors.text.muted,
              fontSize: 14,
              marginTop: spacing.sm,
              textAlign: 'center',
            }}
          >
            No earnings data yet
          </Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          {/* Bars */}
          <View style={[styles.barsRow, { height: CHART_HEIGHT }]}>
            {earnings.map((dataPoint, index) => {
              const heightPercent =
                maxAmount > 0 ? (dataPoint.amount / maxAmount) * 100 : 0;
              return (
                <View key={`${dataPoint.month}-${index}`} style={styles.barColumn}>
                  {/* Amount Label */}
                  <Text
                    style={{
                      color: colors.text.secondary,
                      fontSize: 12,
                      marginBottom: spacing.xs,
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    ${dataPoint.amount.toFixed(0)}
                  </Text>

                  {/* Bar */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: colors.accent.gold,
                          borderRadius: borderRadius.sm,
                          height: `${Math.max(heightPercent, 3)}%`,
                        },
                      ]}
                    />
                  </View>

                  {/* Month Label */}
                  <Text
                    style={{
                      color: colors.text.muted,
                      fontSize: 12,
                      marginTop: spacing.xs,
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {dataPoint.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const CHART_HEIGHT = 160;

const styles = StyleSheet.create({
  container: {},
  summaryRow: {
    flexDirection: 'row',
  },
  summaryCard: {
    flex: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {},
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    flex: 1,
    width: '60%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
  },
});

export default CreatorEarningsChart;
