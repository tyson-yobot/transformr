// =============================================================================
// ReferralListItem.tsx — Row item displaying a referred user's info and status
// =============================================================================
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ReferralStatus = 'pending' | 'active' | 'churned';

interface ReferralListItemProps {
  name: string;
  avatarUrl?: string;
  status: ReferralStatus;
  monthsRetained: number;
  joinedAt: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }
  return (name[0] ?? '?').toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_CONFIG: Record<ReferralStatus, { label: string; colorKey: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Pending', colorKey: 'warning' },
  active: { label: 'Active', colorKey: 'success' },
  churned: { label: 'Churned', colorKey: 'danger' },
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ReferralListItem: React.FC<ReferralListItemProps> = ({
  name,
  status,
  monthsRetained,
  joinedAt,
}) => {
  const { colors, spacing, borderRadius } = useTheme();

  const statusInfo = STATUS_CONFIG[status];
  const statusColor = colors.accent[statusInfo.colorKey];
  const initials = useMemo(() => getInitials(name), [name]);
  const dateStr = useMemo(() => formatDate(joinedAt), [joinedAt]);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
      accessibilityLabel={`${name}, ${statusInfo.label}, ${monthsRetained} months retained`}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: colors.accent.primary + '20',
            borderRadius: borderRadius.full,
          },
        ]}
      >
        <Text
          style={{
            color: colors.accent.primary,
            fontSize: 16,
            fontWeight: '700',
          }}
        >
          {initials}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={{
            color: colors.text.primary,
            fontSize: 16,
            fontWeight: '600',
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={{
            color: colors.text.muted,
            fontSize: 12,
            marginTop: 2,
          }}
        >
          Joined {dateStr}
        </Text>
      </View>

      {/* Months retained */}
      <View style={[styles.metricCol, { marginRight: spacing.sm }]}>
        <Text
          style={{
            color: colors.text.primary,
            fontSize: 16,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          {monthsRetained}
        </Text>
        <Text
          style={{
            color: colors.text.muted,
            fontSize: 10,
            textAlign: 'center',
          }}
        >
          months
        </Text>
      </View>

      {/* Status badge */}
      <View
        style={[
          styles.badge,
          {
            backgroundColor: statusColor + '20',
            borderRadius: borderRadius.full,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
          },
        ]}
      >
        <Text
          style={{
            color: statusColor,
            fontSize: 12,
            fontWeight: '600',
          }}
        >
          {statusInfo.label}
        </Text>
      </View>
    </View>
  );
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  metricCol: {
    alignItems: 'center',
    minWidth: 40,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
});

export default ReferralListItem;
