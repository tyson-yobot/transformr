// =============================================================================
// TRANSFORMR — Creator Dashboard Screen
// =============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@stores/authStore';
import {
  useReferralStore,
  useCreatorProfile,
  useIsCreatorEligible,
} from '@stores/referralStore';

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
// Creator Tier Config
// =============================================================================

interface CreatorTierInfo {
  label: string;
  revenueShare: number;
  color: string;
  threshold: number;
}

const CREATOR_TIERS: Record<string, CreatorTierInfo> = {
  standard: {
    label: 'Standard',
    revenueShare: 10,
    color: '#6B5E8A',
    threshold: 10,
  },
  silver: {
    label: 'Silver',
    revenueShare: 15,
    color: '#94A3B8',
    threshold: 25,
  },
  gold: {
    label: 'Gold',
    revenueShare: 20,
    color: '#EAB308',
    threshold: 50,
  },
};

const TIER_ORDER = ['standard', 'silver', 'gold'];

// =============================================================================
// Stat Card
// =============================================================================

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  const { colors, spacing, borderRadius } = useTheme();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          ...colors.shadow.cardSubtle,
        },
      ]}
    >
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: `${color}20`,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text.primary }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.text.muted }]}>
        {label}
      </Text>
    </View>
  );
}

// =============================================================================
// Main Screen
// =============================================================================

export default function CreatorDashboardScreen() {
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);

  const creatorProfile = useCreatorProfile();
  const isCreatorEligible = useIsCreatorEligible();
  const creatorLoading = useReferralStore((s) => s.creatorLoading);
  const loadCreatorProfile = useReferralStore((s) => s.loadCreatorProfile);

  const [refreshing, setRefreshing] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [slugEditing, setSlugEditing] = useState(false);

  // Load on mount
  useEffect(() => {
    if (!userId) return;
    void loadCreatorProfile(userId);
  }, [userId, loadCreatorProfile]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    await loadCreatorProfile(userId);
    setRefreshing(false);
  }, [userId, loadCreatorProfile]);

  const isLoading = creatorLoading && !creatorProfile;

  // Get tier info
  const currentTier = creatorProfile
    ? CREATOR_TIERS[creatorProfile.tier] ?? CREATOR_TIERS.standard
    : CREATOR_TIERS.standard;

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
            Creator Dashboard
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {isCreatorEligible
              ? 'Earn revenue from your referrals'
              : 'Become a TRANSFORMR creator'}
          </Text>
        </Animated.View>

        {isLoading ? (
          <View style={{ marginTop: spacing.xl }}>
            <SkeletonBox width="100%" height={200} borderRadius={borderRadius.lg} />
            <SkeletonBox
              width="100%"
              height={100}
              borderRadius={borderRadius.lg}
              style={{ marginTop: spacing.md }}
            />
            <SkeletonBox
              width="100%"
              height={100}
              borderRadius={borderRadius.lg}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : !isCreatorEligible ? (
          /* Not eligible — Become a Creator */
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={{ marginTop: spacing.xl }}
          >
            <View
              style={[
                styles.becomeCreatorCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xxl,
                  ...colors.shadow.card,
                },
              ]}
            >
              <View
                style={[
                  styles.bigIcon,
                  {
                    backgroundColor: colors.accent.primaryDim,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Ionicons
                  name="star-outline"
                  size={40}
                  color={colors.accent.primary}
                />
              </View>
              <Text
                style={[
                  styles.becomeTitle,
                  { color: colors.text.primary, marginTop: spacing.lg },
                ]}
              >
                Become a Creator
              </Text>
              <Text
                style={[
                  styles.becomeDesc,
                  { color: colors.text.secondary, marginTop: spacing.sm },
                ]}
              >
                Earn revenue share on every subscription from your referrals.
                Build your influence and get paid for growing the TRANSFORMR
                community.
              </Text>

              {/* Requirements */}
              <View
                style={[
                  styles.requirementsCard,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderRadius: borderRadius.md,
                    padding: spacing.lg,
                    marginTop: spacing.xl,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.requirementsTitle,
                    { color: colors.text.primary, marginBottom: spacing.md },
                  ]}
                >
                  Requirements
                </Text>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name="people-outline"
                    size={18}
                    color={colors.accent.primary}
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      { color: colors.text.secondary, marginLeft: spacing.md },
                    ]}
                  >
                    10+ active referrals
                  </Text>
                </View>
                <View style={[styles.requirementRow, { marginTop: spacing.sm }]}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.accent.primary}
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      { color: colors.text.secondary, marginLeft: spacing.md },
                    ]}
                  >
                    Active TRANSFORMR Pro subscription
                  </Text>
                </View>
                <View style={[styles.requirementRow, { marginTop: spacing.sm }]}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color={colors.accent.primary}
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      { color: colors.text.secondary, marginLeft: spacing.md },
                    ]}
                  >
                    Account in good standing
                  </Text>
                </View>
              </View>

              {/* Revenue tiers preview */}
              <View style={{ marginTop: spacing.xl }}>
                <Text
                  style={[
                    styles.tiersPreviewTitle,
                    { color: colors.text.primary, marginBottom: spacing.md },
                  ]}
                >
                  Revenue Share Tiers
                </Text>
                {TIER_ORDER.map((tierKey) => {
                  const tier = CREATOR_TIERS[tierKey];
                  return (
                    <View
                      key={tierKey}
                      style={[
                        styles.tierPreviewRow,
                        {
                          backgroundColor: colors.background.primary,
                          borderRadius: borderRadius.md,
                          padding: spacing.md,
                          marginBottom: spacing.sm,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.tierPreviewDot,
                          { backgroundColor: tier.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.tierPreviewLabel,
                          { color: colors.text.primary, marginLeft: spacing.sm },
                        ]}
                      >
                        {tier.label}
                      </Text>
                      <Text
                        style={[
                          styles.tierPreviewShare,
                          { color: tier.color },
                        ]}
                      >
                        {tier.revenueShare}%
                      </Text>
                      <Text
                        style={[
                          styles.tierPreviewThreshold,
                          { color: colors.text.muted },
                        ]}
                      >
                        {tier.threshold}+ referrals
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        ) : (
          /* Eligible — Full Dashboard */
          <View style={{ marginTop: spacing.xl }}>
            {/* Revenue Share Tier */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(100)}
              style={[
                styles.tierCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  ...colors.shadow.card,
                },
              ]}
            >
              <Text
                style={[styles.tierCardLabel, { color: colors.text.secondary }]}
              >
                Revenue Share Tier
              </Text>
              <Text
                style={[
                  styles.tierCardName,
                  { color: currentTier.color, marginTop: spacing.xs },
                ]}
              >
                {currentTier.label}
              </Text>
              <Text
                style={[
                  styles.tierCardShare,
                  { color: colors.text.primary, marginTop: spacing.xs },
                ]}
              >
                {currentTier.revenueShare}% revenue share
              </Text>

              {/* Tier progress */}
              <View style={[styles.tierProgressRow, { marginTop: spacing.lg }]}>
                {TIER_ORDER.map((tierKey) => {
                  const tier = CREATOR_TIERS[tierKey];
                  const isActive = creatorProfile?.tier === tierKey;
                  const isPassed = creatorProfile
                    ? TIER_ORDER.indexOf(creatorProfile.tier) >=
                      TIER_ORDER.indexOf(tierKey)
                    : false;
                  return (
                    <View key={tierKey} style={styles.tierProgressItem}>
                      <View
                        style={[
                          styles.tierProgressDot,
                          {
                            backgroundColor: isPassed
                              ? tier.color
                              : colors.background.tertiary,
                            borderWidth: isActive ? 2 : 0,
                            borderColor: tier.color,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.tierProgressLabel,
                          {
                            color: isPassed
                              ? colors.text.primary
                              : colors.text.muted,
                            fontWeight: isActive ? '700' : '400',
                          },
                        ]}
                      >
                        {tier.label}
                      </Text>
                      <Text
                        style={[
                          styles.tierProgressPercent,
                          { color: isPassed ? tier.color : colors.text.muted },
                        ]}
                      >
                        {tier.revenueShare}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Stats Grid */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
              style={[styles.statsGrid, { marginTop: spacing.lg }]}
            >
              <StatCard
                icon="people-outline"
                label="Active Referrals"
                value={String(creatorProfile?.activeReferrals ?? 0)}
                color={colors.accent.primary}
              />
              <StatCard
                icon="cash-outline"
                label="Total Earnings"
                value={`$${(creatorProfile?.totalEarnings ?? 0).toFixed(2)}`}
                color={colors.accent.success}
              />
            </Animated.View>

            {/* Earnings Chart Placeholder */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(300)}
              style={[
                styles.chartCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  marginTop: spacing.lg,
                  ...colors.shadow.cardSubtle,
                },
              ]}
            >
              <Text
                style={[styles.chartTitle, { color: colors.text.primary }]}
              >
                Earnings Overview
              </Text>
              <View
                style={[
                  styles.chartPlaceholder,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderRadius: borderRadius.md,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Ionicons
                  name="bar-chart-outline"
                  size={40}
                  color={colors.text.muted}
                />
                <Text
                  style={[
                    styles.chartPlaceholderText,
                    { color: colors.text.muted, marginTop: spacing.sm },
                  ]}
                >
                  Earnings chart coming soon
                </Text>
              </View>
            </Animated.View>

            {/* Payout Info */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(400)}
              style={[
                styles.payoutCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  marginTop: spacing.lg,
                  ...colors.shadow.cardSubtle,
                },
              ]}
            >
              <View style={styles.payoutHeader}>
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={colors.accent.gold}
                />
                <Text
                  style={[
                    styles.payoutTitle,
                    { color: colors.text.primary, marginLeft: spacing.md },
                  ]}
                >
                  Pending Payout
                </Text>
              </View>
              <Text
                style={[
                  styles.payoutAmount,
                  { color: colors.accent.success, marginTop: spacing.sm },
                ]}
              >
                $0.00
              </Text>
              <Text
                style={[
                  styles.payoutNote,
                  { color: colors.text.muted, marginTop: spacing.xs },
                ]}
              >
                Payouts are processed monthly for balances over $25
              </Text>
            </Animated.View>

            {/* Custom Slug Editor */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(500)}
              style={[
                styles.slugCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  marginTop: spacing.lg,
                  ...colors.shadow.cardSubtle,
                },
              ]}
            >
              <View style={styles.slugHeader}>
                <Ionicons
                  name="link-outline"
                  size={22}
                  color={colors.accent.primary}
                />
                <Text
                  style={[
                    styles.slugTitle,
                    { color: colors.text.primary, marginLeft: spacing.md },
                  ]}
                >
                  Custom Referral Link
                </Text>
              </View>
              <Text
                style={[
                  styles.slugPreview,
                  { color: colors.text.secondary, marginTop: spacing.sm },
                ]}
              >
                transformr.app/ref/{customSlug || 'your-slug'}
              </Text>

              {slugEditing ? (
                <View style={{ marginTop: spacing.md }}>
                  <TextInput
                    value={customSlug}
                    onChangeText={(text) =>
                      setCustomSlug(text.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }
                    placeholder="your-custom-slug"
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.slugInput,
                      {
                        backgroundColor: colors.background.input,
                        color: colors.text.primary,
                        borderColor: colors.border.default,
                        borderRadius: borderRadius.md,
                        padding: spacing.md,
                      },
                    ]}
                    maxLength={30}
                  />
                  <View style={[styles.slugActions, { marginTop: spacing.md }]}>
                    <Pressable
                      onPress={() => setSlugEditing(false)}
                      style={[
                        styles.slugCancel,
                        {
                          borderColor: colors.border.default,
                          borderRadius: borderRadius.md,
                          paddingVertical: spacing.sm,
                          paddingHorizontal: spacing.lg,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.text.secondary }}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        // Save slug action would go here
                        setSlugEditing(false);
                      }}
                      disabled={!customSlug.trim()}
                      style={[
                        styles.slugSave,
                        {
                          backgroundColor: customSlug.trim()
                            ? colors.accent.primary
                            : colors.background.tertiary,
                          borderRadius: borderRadius.md,
                          paddingVertical: spacing.sm,
                          paddingHorizontal: spacing.lg,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: customSlug.trim()
                            ? colors.text.inverse
                            : colors.text.muted,
                          fontWeight: '600',
                        }}
                      >
                        Save
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => setSlugEditing(true)}
                  style={[
                    styles.editSlugButton,
                    {
                      backgroundColor: colors.accent.primaryDim,
                      borderRadius: borderRadius.md,
                      marginTop: spacing.md,
                      paddingVertical: spacing.sm,
                    },
                  ]}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={16}
                    color={colors.accent.primary}
                    style={{ marginRight: spacing.xs }}
                  />
                  <Text style={{ color: colors.accent.primary, fontWeight: '600' }}>
                    Edit Slug
                  </Text>
                </Pressable>
              )}
            </Animated.View>

            {/* Member Since */}
            {creatorProfile?.joinedAt && (
              <Animated.View
                entering={FadeInDown.duration(400).delay(600)}
                style={{ marginTop: spacing.lg, alignItems: 'center' }}
              >
                <Text style={[styles.joinedText, { color: colors.text.muted }]}>
                  Creator since{' '}
                  {new Date(creatorProfile.joinedAt).toLocaleDateString()}
                </Text>
              </Animated.View>
            )}
          </View>
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
  // --- Become a Creator ---
  becomeCreatorCard: {
    alignItems: 'center',
  },
  bigIcon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  becomeTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  becomeDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  requirementsCard: {},
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 14,
  },
  tiersPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tierPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierPreviewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tierPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  tierPreviewShare: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  tierPreviewThreshold: {
    fontSize: 12,
  },
  // --- Dashboard ---
  tierCard: {},
  tierCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tierCardName: {
    fontSize: 24,
    fontWeight: '800',
  },
  tierCardShare: {
    fontSize: 15,
    fontWeight: '500',
  },
  tierProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierProgressItem: {
    alignItems: 'center',
    flex: 1,
  },
  tierProgressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  tierProgressLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tierProgressPercent: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  chartCard: {},
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartPlaceholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPlaceholderText: {
    fontSize: 14,
  },
  payoutCard: {},
  payoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  payoutAmount: {
    fontSize: 32,
    fontWeight: '800',
  },
  payoutNote: {
    fontSize: 13,
    lineHeight: 18,
  },
  slugCard: {},
  slugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slugTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  slugPreview: {
    fontSize: 14,
  },
  slugInput: {
    fontSize: 16,
    borderWidth: 1,
  },
  slugActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  slugCancel: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slugSave: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSlugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedText: {
    fontSize: 13,
  },
});
