// =============================================================================
// TRANSFORMR — GiftCard
// Displays milestone gift info with status badge and send action.
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

type GiftStatus = 'available' | 'sent' | 'claimed' | 'expired';

interface GiftCardProps {
  id: string;
  milestoneType: string;
  giftTier: string;
  giftMonths: number;
  giftCode: string;
  status: GiftStatus;
  expiresAt: string;
  onSend?: (id: string) => void;
}

interface StatusConfig {
  label: string;
  colorKey: 'pink' | 'warning' | 'success' | 'danger';
  dimKey: 'pinkDim' | 'warningDim' | 'successDim' | 'dangerDim';
  icon: keyof typeof Ionicons.glyphMap;
}

const STATUS_MAP: Record<GiftStatus, StatusConfig> = {
  available: {
    label: 'Available',
    colorKey: 'pink',
    dimKey: 'pinkDim',
    icon: 'gift-outline',
  },
  sent: {
    label: 'Sent',
    colorKey: 'warning',
    dimKey: 'warningDim',
    icon: 'send-outline',
  },
  claimed: {
    label: 'Claimed',
    colorKey: 'success',
    dimKey: 'successDim',
    icon: 'checkmark-circle-outline',
  },
  expired: {
    label: 'Expired',
    colorKey: 'danger',
    dimKey: 'dangerDim',
    icon: 'time-outline',
  },
};

function getExpirationText(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Expired';
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    return `Expires in ${months} month${months !== 1 ? 's' : ''}`;
  }
  if (diffDays > 0) {
    return `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) {
    return `Expires in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }

  return 'Expires soon';
}

export function GiftCard({
  id,
  milestoneType,
  giftTier,
  giftMonths,
  giftCode,
  status,
  expiresAt,
  onSend,
}: GiftCardProps) {
  const { colors, spacing, borderRadius } = useTheme();

  const statusConfig = STATUS_MAP[status];
  const statusColor = colors.accent[statusConfig.colorKey];
  const statusDimColor = colors.accent[statusConfig.dimKey];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          borderLeftWidth: 3,
          borderLeftColor: statusColor,
        },
      ]}
    >
      {/* Top Row: Gift Icon + Milestone Info + Status Badge */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: statusDimColor,
              borderRadius: borderRadius.md,
              width: 44,
              height: 44,
            },
          ]}
        >
          <Ionicons name="gift-outline" size={22} color={statusColor} />
        </View>

        <View style={[styles.info, { marginLeft: spacing.md }]}>
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 16,
              fontWeight: '600',
            }}
            numberOfLines={1}
          >
            {milestoneType}
          </Text>
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 14,
              marginTop: spacing.xs,
            }}
          >
            {giftTier} — {giftMonths} month{giftMonths !== 1 ? 's' : ''} free
          </Text>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusDimColor,
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Ionicons
            name={statusConfig.icon}
            size={12}
            color={statusColor}
            style={{ marginRight: spacing.xs }}
          />
          <Text
            style={{
              color: statusColor,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Gift Code */}
      <View
        style={[
          styles.codeRow,
          {
            backgroundColor: colors.background.tertiary,
            borderRadius: borderRadius.sm,
            padding: spacing.md,
            marginTop: spacing.md,
          },
        ]}
      >
        <Ionicons
          name="key-outline"
          size={14}
          color={colors.text.muted}
          style={{ marginRight: spacing.sm }}
        />
        <Text
          style={{
            color: colors.text.secondary,
            fontSize: 14,
            fontFamily: 'monospace',
            flex: 1,
          }}
          numberOfLines={1}
          selectable
        >
          {giftCode}
        </Text>
      </View>

      {/* Bottom Row: Expiration + Send Button */}
      <View style={[styles.bottomRow, { marginTop: spacing.md }]}>
        <View style={styles.expirationRow}>
          <Ionicons
            name="time-outline"
            size={14}
            color={colors.text.muted}
            style={{ marginRight: spacing.xs }}
          />
          <Text
            style={{
              color: colors.text.muted,
              fontSize: 12,
            }}
          >
            {getExpirationText(expiresAt)}
          </Text>
        </View>

        {status === 'available' && onSend && (
          <Pressable
            onPress={() => onSend(id)}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: pressed
                  ? colors.accent.primaryDark
                  : colors.accent.pink,
                borderRadius: borderRadius.sm,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                minHeight: 44,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityLabel={`Send gift to a friend`}
            accessibilityRole="button"
          >
            <Ionicons
              name="send"
              size={14}
              color={colors.text.inverse}
              style={{ marginRight: spacing.xs }}
            />
            <Text
              style={{
                color: colors.text.inverse,
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              Send to Friend
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expirationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GiftCard;
