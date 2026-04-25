// =============================================================================
// TRANSFORMR — SquadDiscountTier
// Visual indicator showing current squad discount tier and progress.
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

interface SquadDiscountTierProps {
  memberCount: number;
  activeCount: number;
  currentPercent: number;
  monthsQualified: number;
}

interface TierConfig {
  members: number;
  discount: number;
  label: string;
}

const TIERS: TierConfig[] = [
  { members: 3, discount: 20, label: '20% Off' },
  { members: 5, discount: 30, label: '30% Off' },
  { members: 7, discount: 40, label: '40% Off' },
];

const MIN_CONSECUTIVE_MONTHS = 3;

function getNextTier(activeCount: number): TierConfig | null {
  for (const tier of TIERS) {
    if (activeCount < tier.members) {
      return tier;
    }
  }
  return null;
}

export function SquadDiscountTier({
  memberCount,
  activeCount,
  currentPercent,
  monthsQualified,
}: SquadDiscountTierProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const nextTier = getNextTier(activeCount);
  const maxTierMembers = TIERS[TIERS.length - 1].members;
  const progressRatio = Math.min(activeCount / maxTierMembers, 1);
  const isMaxTier = nextTier === null;

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name="people"
            size={20}
            color={colors.accent.primary}
            style={{ marginRight: spacing.sm }}
          />
          <Text
            style={{
              color: colors.text.primary,
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.bold as '700',
            }}
          >
            Squad Discount
          </Text>
        </View>
        <View
          style={[
            styles.percentBadge,
            {
              backgroundColor: colors.accent.primaryDim,
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Text
            style={{
              color: colors.accent.primary,
              fontSize: typography.sizes.md,
              fontWeight: typography.weights.bold as '700',
            }}
          >
            {currentPercent}%
          </Text>
        </View>
      </View>

      {/* Member Count */}
      <Text
        style={{
          color: colors.text.secondary,
          fontSize: typography.sizes.sm,
          marginTop: spacing.sm,
        }}
      >
        {activeCount} of {memberCount} members active
      </Text>

      {/* Progress Bar */}
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: colors.background.tertiary,
            borderRadius: borderRadius.full,
            marginTop: spacing.md,
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: borderRadius.full,
              width: `${Math.max(progressRatio * 100, 2)}%`,
            },
          ]}
        />
        {/* Tier Markers */}
        {TIERS.map((tier) => {
          const markerPosition = (tier.members / maxTierMembers) * 100;
          const isReached = activeCount >= tier.members;
          return (
            <View
              key={tier.members}
              style={[
                styles.tierMarker,
                {
                  left: `${markerPosition}%`,
                  backgroundColor: isReached
                    ? colors.accent.primary
                    : colors.background.elevated,
                  borderColor: isReached
                    ? colors.accent.primaryLight
                    : colors.border.default,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Tier Labels */}
      <View style={[styles.tierLabels, { marginTop: spacing.sm }]}>
        {TIERS.map((tier) => {
          const isReached = activeCount >= tier.members;
          return (
            <View key={tier.members} style={styles.tierLabelItem}>
              <Text
                style={{
                  color: isReached
                    ? colors.accent.primary
                    : colors.text.muted,
                  fontSize: typography.sizes.xs,
                  fontWeight: isReached
                    ? (typography.weights.semibold as '600')
                    : (typography.weights.regular as '400'),
                  textAlign: 'center',
                }}
              >
                {tier.members} members
              </Text>
              <Text
                style={{
                  color: isReached
                    ? colors.text.primary
                    : colors.text.muted,
                  fontSize: typography.sizes.xs,
                  textAlign: 'center',
                }}
              >
                {tier.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Next Tier Info */}
      <View
        style={[
          styles.nextTierInfo,
          {
            backgroundColor: isMaxTier
              ? colors.accent.successDim
              : colors.accent.primaryDim,
            borderRadius: borderRadius.sm,
            padding: spacing.md,
            marginTop: spacing.md,
          },
        ]}
      >
        <Ionicons
          name={isMaxTier ? 'trophy' : 'arrow-up-circle'}
          size={16}
          color={isMaxTier ? colors.accent.success : colors.accent.primary}
          style={{ marginRight: spacing.sm }}
        />
        <Text
          style={{
            color: isMaxTier ? colors.accent.success : colors.accent.primary,
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.medium as '500',
            flex: 1,
          }}
        >
          {isMaxTier
            ? 'Max tier reached!'
            : `${nextTier.members - activeCount} more active member${
                nextTier.members - activeCount !== 1 ? 's' : ''
              } needed for ${nextTier.label}`}
        </Text>
      </View>

      {/* Minimum Months Note */}
      <View style={[styles.noteRow, { marginTop: spacing.sm }]}>
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={colors.text.muted}
          style={{ marginRight: spacing.xs }}
        />
        <Text
          style={{
            color: colors.text.muted,
            fontSize: typography.sizes.xs,
          }}
        >
          Minimum {MIN_CONSECUTIVE_MONTHS} consecutive months required
          {monthsQualified > 0
            ? ` — ${monthsQualified} month${monthsQualified !== 1 ? 's' : ''} qualified`
            : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentBadge: {},
  progressTrack: {
    height: 8,
    position: 'relative',
    overflow: 'visible',
  },
  progressFill: {
    height: 8,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  tierMarker: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginLeft: -8,
  },
  tierLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierLabelItem: {
    alignItems: 'center',
    flex: 1,
  },
  nextTierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SquadDiscountTier;
