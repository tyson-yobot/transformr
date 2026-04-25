// =============================================================================
// TRANSFORMR — Rewards Wallet Screen
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@stores/authStore';
import {
  useReferralStore,
  useRewardsList,
  useRewardsLoading,
} from '@stores/referralStore';
import type { Reward } from '@services/referralService';

// =============================================================================
// Skeleton
// =============================================================================

function SkeletonBox({
  width,
  height,
  borderRadius: br,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          width: width as number,
          height,
          borderRadius: br ?? 8,
          backgroundColor: colors.background.tertiary,
        },
        style,
      ]}
    />
  );
}

// =============================================================================
// Reward Card
// =============================================================================

function RewardCard({
  reward,
  onApply,
}: {
  reward: Reward;
  onApply?: (reward: Reward) => void;
}) {
  const { colors, spacing, borderRadius } = useTheme();

  const iconName: keyof typeof Ionicons.glyphMap =
    reward.rewardType === 'discount'
      ? 'pricetag-outline'
      : reward.rewardType === 'badge'
        ? 'ribbon-outline'
        : 'gift-outline';

  const statusColor =
    reward.status === 'applied'
      ? colors.accent.success
      : reward.status === 'expired'
        ? colors.accent.danger
        : colors.accent.primary;

  return (
    <View
      style={[
        styles.rewardCard,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
          ...colors.shadow.cardSubtle,
        },
      ]}
    >
      <View style={styles.rewardCardHeader}>
        <View
          style={[
            styles.rewardIcon,
            {
              backgroundColor: colors.accent.primaryDim,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Ionicons name={iconName} size={22} color={colors.accent.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[styles.rewardType, { color: colors.text.primary }]}>
            {reward.rewardType.charAt(0).toUpperCase() +
              reward.rewardType.slice(1).replace(/_/g, ' ')}
          </Text>
          <Text style={[styles.rewardSource, { color: colors.text.muted }]}>
            {reward.source}
          </Text>
        </View>
        <View
          style={[
            styles.rewardStatusBadge,
            {
              backgroundColor:
                reward.status === 'applied'
                  ? colors.accent.successDim
                  : reward.status === 'expired'
                    ? colors.accent.dangerDim
                    : colors.accent.primaryDim,
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Text style={[styles.rewardStatusText, { color: statusColor }]}>
            {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={[styles.rewardDetails, { marginTop: spacing.md }]}>
        {reward.months !== null && reward.months > 0 && (
          <Text style={[styles.rewardDetail, { color: colors.text.secondary }]}>
            <Ionicons name="time-outline" size={14} color={colors.text.muted} />{' '}
            {reward.months} month{reward.months > 1 ? 's' : ''}
          </Text>
        )}
        {reward.discountPercent !== null && reward.discountPercent > 0 && (
          <Text style={[styles.rewardDetail, { color: colors.text.secondary }]}>
            <Ionicons name="pricetag-outline" size={14} color={colors.text.muted} />{' '}
            {reward.discountPercent}% off
          </Text>
        )}
        {reward.badge && (
          <Text style={[styles.rewardDetail, { color: colors.text.secondary }]}>
            <Ionicons name="ribbon-outline" size={14} color={colors.text.muted} />{' '}
            {reward.badge}
          </Text>
        )}
      </View>

      {/* Apply button for earned rewards */}
      {onApply && reward.status === 'pending' && (
        <Pressable
          onPress={() => onApply(reward)}
          style={[
            styles.applyButton,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: borderRadius.md,
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <Text style={[styles.applyButtonText, { color: colors.text.inverse }]}>
            Apply Reward
          </Text>
        </Pressable>
      )}

      <Text style={[styles.rewardDate, { color: colors.text.muted, marginTop: spacing.sm }]}>
        {new Date(reward.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );
}

// =============================================================================
// Main Screen
// =============================================================================

export default function RewardsWalletScreen() {
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);

  const rewards = useRewardsList();
  const rewardsLoading = useRewardsLoading();
  const loadRewards = useReferralStore((s) => s.loadRewards);

  const [refreshing, setRefreshing] = useState(false);

  // Load on mount
  useEffect(() => {
    if (!userId) return;
    void loadRewards(userId);
  }, [userId, loadRewards]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    await loadRewards(userId);
    setRefreshing(false);
  }, [userId, loadRewards]);

  // Filter rewards by status
  const availableRewards = useMemo(
    () => rewards.filter((r) => r.status === 'pending'),
    [rewards],
  );
  const activeRewards = useMemo(
    () => rewards.filter((r) => r.status === 'applied'),
    [rewards],
  );
  const historyRewards = useMemo(
    () =>
      [...rewards].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [rewards],
  );

  const handleApply = useCallback((_reward: Reward) => {
    // Apply reward — would trigger a service call in production
    // For now this is the UI hookup point
  }, []);

  const isLoading = rewardsLoading && rewards.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxxl,
            paddingHorizontal: spacing.lg,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.header, { color: colors.text.primary }]}>
            Rewards
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Your earned rewards and active benefits
          </Text>
        </Animated.View>

        {isLoading ? (
          <View style={{ marginTop: spacing.xl }}>
            {[0, 1, 2].map((i) => (
              <SkeletonBox
                key={i}
                width="100%"
                height={120}
                borderRadius={borderRadius.lg}
                style={{ marginBottom: spacing.md }}
              />
            ))}
          </View>
        ) : rewards.length === 0 ? (
          /* Empty state */
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
                padding: spacing.xxl,
                marginTop: spacing.xl,
              },
            ]}
          >
            <Ionicons name="gift-outline" size={48} color={colors.text.muted} />
            <Text
              style={[
                styles.emptyTitle,
                { color: colors.text.primary, marginTop: spacing.md },
              ]}
            >
              No rewards yet
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: colors.text.secondary, marginTop: spacing.xs },
              ]}
            >
              Refer friends and hit milestones to earn rewards like free Pro
              months, discounts, and exclusive badges.
            </Text>
          </View>
        ) : (
          <>
            {/* Available Rewards */}
            {availableRewards.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(400).delay(100)}
                style={{ marginTop: spacing.xl }}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text.primary, marginBottom: spacing.md },
                  ]}
                >
                  Available
                </Text>
                {availableRewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    onApply={handleApply}
                  />
                ))}
              </Animated.View>
            )}

            {/* Active Rewards */}
            {activeRewards.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(400).delay(200)}
                style={{ marginTop: spacing.xl }}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text.primary, marginBottom: spacing.md },
                  ]}
                >
                  Active
                </Text>
                {activeRewards.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} />
                ))}
              </Animated.View>
            )}

            {/* History */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(300)}
              style={{ marginTop: spacing.xl }}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text.primary, marginBottom: spacing.md },
                ]}
              >
                History
              </Text>
              {historyRewards.map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  rewardCard: {},
  rewardCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardType: {
    fontSize: 16,
    fontWeight: '600',
  },
  rewardSource: {
    fontSize: 13,
    marginTop: 2,
  },
  rewardStatusBadge: {},
  rewardStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rewardDetail: {
    fontSize: 13,
  },
  applyButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rewardDate: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
