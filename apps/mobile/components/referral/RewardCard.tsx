// =============================================================================
// RewardCard.tsx — Displays a referral reward with status and apply action
// =============================================================================
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type RewardStatus = 'earned' | 'applied' | 'expired';

interface RewardCardProps {
  id: string;
  type: string;
  description: string;
  status: RewardStatus;
  freeMonths?: number;
  discountPercent?: number;
  earnedAt: string;
  expiresAt?: string;
  onApply?: (id: string) => void;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const STATUS_CONFIG: Record<RewardStatus, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  earned: { label: 'Earned', icon: 'gift-outline', color: '#F59E0B' },
  applied: { label: 'Applied', icon: 'checkmark-circle-outline', color: '#10B981' },
  expired: { label: 'Expired', icon: 'time-outline', color: '#6B7280' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getExpirationText(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 'Expires today';
  if (diffDays <= 7) return `Expires in ${diffDays} days`;
  if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Expires in ${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  return `Expires ${formatDate(expiresAt)}`;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const RewardCard: React.FC<RewardCardProps> = ({
  id,
  type,
  description,
  status,
  freeMonths,
  discountPercent,
  earnedAt,
  expiresAt,
  onApply,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const config = STATUS_CONFIG[status];
  const expirationLabel = useMemo(
    () => (expiresAt ? getExpirationText(expiresAt) : null),
    [expiresAt],
  );

  const accentColor = config.color;
  const cardBorderColor =
    status === 'earned'
      ? '#F59E0B40'
      : status === 'applied'
        ? '#10B98140'
        : colors.background.tertiary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: cardBorderColor,
          opacity: status === 'expired' ? 0.6 : 1,
        },
      ]}
      accessibilityLabel={`${description}. Status: ${config.label}`}
    >
      {/* Header row */}
      <View style={[styles.headerRow, { marginBottom: spacing.sm }]}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: accentColor + '20',
              borderRadius: borderRadius.full,
            },
          ]}
        >
          <Ionicons name={config.icon} size={22} color={accentColor} />
        </View>

        {/* Status badge */}
        <View
          style={[
            styles.badge,
            {
              backgroundColor: accentColor + '20',
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Text
            style={{
              color: accentColor,
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.semibold as '600',
            }}
          >
            {config.label}
          </Text>
        </View>
      </View>

      {/* Type */}
      <Text
        style={{
          color: colors.text.primary,
          fontSize: typography.sizes.md,
          fontWeight: typography.weights.bold as '700',
          marginBottom: 4,
        }}
      >
        {type}
      </Text>

      {/* Description */}
      <Text
        style={{
          color: colors.text.secondary,
          fontSize: typography.sizes.sm,
          marginBottom: spacing.sm,
        }}
      >
        {description}
      </Text>

      {/* Reward value */}
      <View style={[styles.valueRow, { marginBottom: spacing.sm }]}>
        {freeMonths != null && freeMonths > 0 ? (
          <View style={[styles.valuePill, { backgroundColor: accentColor + '15', borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }]}>
            <Text style={{ color: accentColor, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold as '600' }}>
              {freeMonths} Free Month{freeMonths > 1 ? 's' : ''}
            </Text>
          </View>
        ) : null}
        {discountPercent != null && discountPercent > 0 ? (
          <View style={[styles.valuePill, { backgroundColor: accentColor + '15', borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginLeft: freeMonths ? spacing.xs : 0 }]}>
            <Text style={{ color: accentColor, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold as '600' }}>
              {discountPercent}% Off
            </Text>
          </View>
        ) : null}
      </View>

      {/* Footer row */}
      <View style={styles.footerRow}>
        <Text
          style={{
            color: colors.text.tertiary,
            fontSize: typography.sizes.xs,
          }}
        >
          Earned {formatDate(earnedAt)}
        </Text>

        {expirationLabel && status !== 'expired' ? (
          <Text
            style={{
              color: colors.status.warning,
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.medium as '500',
            }}
          >
            {expirationLabel}
          </Text>
        ) : null}
      </View>

      {/* Apply button */}
      {status === 'earned' && onApply ? (
        <Pressable
          onPress={() => onApply(id)}
          style={({ pressed }) => [
            styles.applyButton,
            {
              backgroundColor: pressed ? '#F59E0B' : '#F59E0BE6',
              borderRadius: borderRadius.lg,
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
          accessibilityLabel={`Apply reward: ${description}`}
          accessibilityRole="button"
        >
          <Ionicons
            name="flash-outline"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: spacing.xs }}
          />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.bold as '700',
            }}
          >
            Apply Reward
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valuePill: {},
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});

export default RewardCard;
