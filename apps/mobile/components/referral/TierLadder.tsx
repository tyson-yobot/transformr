// =============================================================================
// TierLadder.tsx — Visual tier ladder showing referral reward thresholds
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TierLadderProps {
  currentTier: string;
  activeCount: number;
}

interface TierDefinition {
  name: string;
  threshold: number;
  reward: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const TIERS: TierDefinition[] = [
  { name: 'Pro', threshold: 3, reward: 'Free Pro Month', icon: 'star-outline', color: '#3B82F6' },
  { name: 'Elite', threshold: 5, reward: 'Free Elite Month', icon: 'diamond-outline', color: '#F59E0B' },
  { name: 'Partners', threshold: 10, reward: 'Free Partners Month', icon: 'people-outline', color: '#EC4899' },
  { name: 'Lifetime', threshold: 25, reward: 'Lifetime Pro Access', icon: 'trophy-outline', color: '#10B981' },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getTierIndex(tierName: string): number {
  return TIERS.findIndex((t) => t.name === tierName);
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const TierLadder: React.FC<TierLadderProps> = ({
  currentTier,
  activeCount,
}) => {
  const { colors, spacing, borderRadius } = useTheme();
  const currentIndex = getTierIndex(currentTier);

  return (
    <View style={[styles.container, { padding: spacing.md }]}>
      <Text
        style={[
          styles.heading,
          {
            color: colors.text.primary,
            fontSize: 18,
            fontWeight: '700',
            marginBottom: spacing.md,
          },
        ]}
      >
        Tier Ladder
      </Text>

      {TIERS.map((tier, index) => {
        const isUnlocked = index <= currentIndex;
        const isCurrent = tier.name === currentTier;
        const remaining = tier.threshold - activeCount;

        return (
          <View
            key={tier.name}
            style={[
              styles.tierRow,
              {
                backgroundColor: isCurrent
                  ? tier.color + '15'
                  : colors.background.secondary,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                marginBottom: spacing.sm,
                borderWidth: isCurrent ? 1 : 0,
                borderColor: isCurrent ? tier.color + '50' : 'transparent',
                opacity: isUnlocked ? 1 : 0.5,
              },
            ]}
            accessibilityLabel={`${tier.name} tier: ${tier.reward}. ${
              isUnlocked ? 'Unlocked' : `${remaining} referrals remaining`
            }`}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: tier.color + '20',
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              {isUnlocked && !isCurrent ? (
                <Ionicons name="checkmark-circle" size={24} color={tier.color} />
              ) : (
                <Ionicons name={tier.icon} size={24} color={tier.color} />
              )}
            </View>

            {/* Info */}
            <View style={styles.tierInfo}>
              <View style={styles.tierTitleRow}>
                <Text
                  style={[
                    styles.tierName,
                    {
                      color: isCurrent ? tier.color : colors.text.primary,
                      fontSize: 16,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {tier.name}
                </Text>
                <Text
                  style={[
                    styles.threshold,
                    {
                      color: colors.text.muted,
                      fontSize: 12,
                    },
                  ]}
                >
                  {tier.threshold} referrals
                </Text>
              </View>
              <Text
                style={{
                  color: colors.text.secondary,
                  fontSize: 14,
                }}
              >
                {tier.reward}
              </Text>
            </View>

            {/* Status */}
            <View style={styles.statusCol}>
              {isUnlocked ? (
                <Ionicons name="checkmark-circle" size={20} color={tier.color} />
              ) : (
                <Text
                  style={{
                    color: colors.text.muted,
                    fontSize: 12,
                    fontWeight: '500',
                    textAlign: 'right',
                  }}
                >
                  {remaining > 0 ? `${remaining} to go` : 'Unlocked'}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {},
  heading: {},
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
  },
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tierInfo: {
    flex: 1,
  },
  tierTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  tierName: {},
  threshold: {},
  statusCol: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
});

export default TierLadder;
