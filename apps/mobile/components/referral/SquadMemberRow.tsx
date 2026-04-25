// =============================================================================
// TRANSFORMR — SquadMemberRow
// Displays a squad member with avatar, name, status, and streak info.
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

interface SquadMemberRowProps {
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  consecutiveMonths: number;
  isCreator?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export function SquadMemberRow({
  name,
  isActive,
  consecutiveMonths,
  isCreator = false,
}: SquadMemberRowProps) {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: colors.accent.primaryDim,
            borderRadius: borderRadius.full,
          },
        ]}
      >
        <Text
          style={[
            styles.initials,
            {
              color: colors.accent.primary,
              fontSize: 16,
              fontWeight: '700',
            },
          ]}
        >
          {getInitials(name)}
        </Text>
      </View>

      {/* Name + Creator Badge */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text
            style={[
              styles.name,
              {
                color: colors.text.primary,
                fontSize: 16,
                fontWeight: '600',
              },
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {isCreator && (
            <View
              style={[
                styles.creatorBadge,
                {
                  backgroundColor: colors.accent.goldDim,
                  borderRadius: borderRadius.sm,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  marginLeft: spacing.sm,
                },
              ]}
            >
              <Ionicons
                name="star"
                size={12}
                color={colors.accent.gold}
                style={{ marginRight: spacing.xs }}
              />
              <Text
                style={{
                  color: colors.accent.gold,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                Creator
              </Text>
            </View>
          )}
        </View>

        <Text
          style={{
            color: colors.text.secondary,
            fontSize: 14,
            marginTop: spacing.xs,
          }}
        >
          {consecutiveMonths} consecutive month{consecutiveMonths !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Active/Inactive Indicator */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isActive
                ? colors.accent.success
                : colors.accent.danger,
            },
          ]}
        />
        <Text
          style={{
            color: isActive ? colors.accent.success : colors.accent.danger,
            fontSize: 12,
            marginLeft: spacing.xs,
          }}
        >
          {isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    textAlign: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flexShrink: 1,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default SquadMemberRow;
