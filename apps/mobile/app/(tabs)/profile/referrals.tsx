// =============================================================================
// TRANSFORMR — Referral Hub Screen
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Share,
  Modal,
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
  useReferralCode,
  useReferralCodeLoading,
  useReferralsList,
  useReferralsLoading,
  useTierInfo,
  useTierLoading,
} from '@stores/referralStore';
import * as Clipboard from 'expo-clipboard';
import type { Referral } from '@services/referralService';

// =============================================================================
// Skeleton Components
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
// Tier Config
// =============================================================================

const TIER_CONFIG = {
  starter: { label: 'Starter', color: '#6B5E8A', threshold: 0 },
  builder: { label: 'Builder', color: '#3B82F6', threshold: 3 },
  leader: { label: 'Leader', color: '#A855F7', threshold: 10 },
  legend: { label: 'Legend', color: '#EAB308', threshold: 25 },
} as const;

const TIER_ORDER: Array<'starter' | 'builder' | 'leader' | 'legend'> = [
  'starter',
  'builder',
  'leader',
  'legend',
];

// =============================================================================
// Referral List Item
// =============================================================================

function ReferralListItem({ item }: { item: Referral }) {
  const { colors, spacing, borderRadius } = useTheme();

  const statusColor =
    item.status === 'active'
      ? colors.accent.success
      : item.status === 'pending'
        ? colors.accent.warning
        : colors.accent.danger;

  return (
    <View
      style={[
        styles.referralItem,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          marginBottom: spacing.sm,
          borderLeftWidth: 3,
          borderLeftColor: statusColor,
        },
      ]}
    >
      <View style={styles.referralItemRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.referralCode, { color: colors.text.primary }]}>
            {item.code}
          </Text>
          <Text style={[styles.referralDate, { color: colors.text.muted }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'active'
                  ? colors.accent.successDim
                  : item.status === 'pending'
                    ? colors.accent.warningDim
                    : colors.accent.dangerDim,
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// Main Screen
// =============================================================================

export default function ReferralHubScreen() {
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);

  // Narrowed selectors
  const myCode = useReferralCode();
  const codeLoading = useReferralCodeLoading();
  const referrals = useReferralsList();
  const referralsLoading = useReferralsLoading();
  const tierInfo = useTierInfo();
  const tierLoading = useTierLoading();

  // Actions
  const generateCode = useReferralStore((s) => s.generateCode);
  const loadReferrals = useReferralStore((s) => s.loadReferrals);
  const loadTier = useReferralStore((s) => s.loadTier);
  const logShare = useReferralStore((s) => s.logShare);

  const [refreshing, setRefreshing] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (!userId) return;
    void loadReferrals(userId);
    void loadTier(userId);
    if (!myCode) {
      void generateCode(userId);
    }
  }, [userId, myCode, generateCode, loadReferrals, loadTier]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    await Promise.all([loadReferrals(userId), loadTier(userId)]);
    setRefreshing(false);
  }, [userId, loadReferrals, loadTier]);

  // Share handler
  const handleShare = useCallback(
    async (platform: string) => {
      if (!myCode || !userId) return;
      const message = `Join me on TRANSFORMR! Use my referral code: ${myCode}\n\nhttps://transformr.app/ref/${myCode}`;
      try {
        await Share.share({ message });
        void logShare(userId, 'referral_code', platform);
      } catch {
        // User cancelled share
      }
      setShareModalVisible(false);
    },
    [myCode, userId, logShare],
  );

  // Copy code to clipboard
  const handleCopy = useCallback(async () => {
    if (!myCode) return;
    await Clipboard.setStringAsync(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [myCode]);

  // Tier progress
  const tierProgress = useMemo(() => {
    if (!tierInfo) return 0;
    if (tierInfo.nextTierThreshold === 0) return 1;
    return Math.min(tierInfo.activeReferrals / tierInfo.nextTierThreshold, 1);
  }, [tierInfo]);

  const currentTierConfig = tierInfo
    ? TIER_CONFIG[tierInfo.tier]
    : TIER_CONFIG.starter;

  const isLoading = codeLoading || referralsLoading || tierLoading;

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
            Referral Hub
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Share TRANSFORMR and earn rewards together
          </Text>
        </Animated.View>

        {/* Section 1: Referral Code Card */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={[
            styles.codeCard,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
              marginTop: spacing.xl,
              ...colors.shadow.card,
            },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
            Your Referral Code
          </Text>
          {codeLoading ? (
            <SkeletonBox width={200} height={40} style={{ marginTop: spacing.sm }} />
          ) : myCode ? (
            <View style={styles.codeRow}>
              <Text style={[styles.codeText, { color: colors.accent.primary }]}>
                {myCode}
              </Text>
              <Pressable onPress={handleCopy} style={styles.copyButton}>
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={22}
                  color={copied ? colors.accent.success : colors.text.secondary}
                />
              </Pressable>
            </View>
          ) : (
            <Text style={[styles.errorText, { color: colors.accent.danger }]}>
              Failed to generate code. Pull to refresh.
            </Text>
          )}
          <Pressable
            onPress={() => setShareModalVisible(true)}
            style={[
              styles.shareButton,
              {
                backgroundColor: colors.accent.primary,
                borderRadius: borderRadius.md,
                marginTop: spacing.lg,
                paddingVertical: spacing.md,
              },
            ]}
          >
            <Ionicons name="share-social-outline" size={18} color={colors.text.inverse} />
            <Text style={[styles.shareButtonText, { color: colors.text.inverse }]}>
              Share Code
            </Text>
          </Pressable>
        </Animated.View>

        {/* Section 2: Transformation Circle / Tier */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={[
            styles.tierCard,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
              marginTop: spacing.lg,
              ...colors.shadow.card,
            },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
            Transformation Circle
          </Text>

          {tierLoading ? (
            <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
              <SkeletonBox width={100} height={100} borderRadius={50} />
              <SkeletonBox width={120} height={20} style={{ marginTop: spacing.md }} />
            </View>
          ) : (
            <>
              {/* Progress Ring (simplified circular display) */}
              <View style={styles.tierRingContainer}>
                <View
                  style={[
                    styles.tierRing,
                    {
                      borderColor: currentTierConfig.color,
                      borderWidth: 4,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tierRingCount,
                      { color: currentTierConfig.color },
                    ]}
                  >
                    {tierInfo?.activeReferrals ?? 0}
                  </Text>
                  <Text style={[styles.tierRingLabel, { color: colors.text.muted }]}>
                    active
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.tierName,
                  { color: currentTierConfig.color },
                ]}
              >
                {currentTierConfig.label}
              </Text>

              {tierInfo && tierInfo.discountPercent > 0 && (
                <Text style={[styles.discountText, { color: colors.accent.success }]}>
                  {tierInfo.discountPercent}% subscription discount
                </Text>
              )}

              {/* Tier Ladder */}
              <View style={[styles.tierLadder, { marginTop: spacing.lg }]}>
                {TIER_ORDER.map((tier, idx) => {
                  const config = TIER_CONFIG[tier];
                  const isActive = tierInfo?.tier === tier;
                  const isPassed =
                    tierInfo
                      ? TIER_ORDER.indexOf(tierInfo.tier) >= idx
                      : false;
                  return (
                    <View key={tier} style={styles.tierLadderItem}>
                      <View
                        style={[
                          styles.tierDot,
                          {
                            backgroundColor: isPassed
                              ? config.color
                              : colors.background.tertiary,
                            borderWidth: isActive ? 2 : 0,
                            borderColor: config.color,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.tierLadderLabel,
                          {
                            color: isPassed
                              ? colors.text.primary
                              : colors.text.muted,
                            fontWeight: isActive ? '700' : '400',
                          },
                        ]}
                      >
                        {config.label}
                      </Text>
                      {idx < TIER_ORDER.length - 1 && (
                        <View
                          style={[
                            styles.tierLine,
                            {
                              backgroundColor: isPassed
                                ? config.color
                                : colors.border.subtle,
                            },
                          ]}
                        />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Progress to next tier */}
              {tierInfo && tierInfo.nextTierThreshold > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <View
                    style={[
                      styles.progressBarBg,
                      {
                        backgroundColor: colors.background.tertiary,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: currentTierConfig.color,
                          borderRadius: borderRadius.sm,
                          width: `${tierProgress * 100}%` as unknown as number,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressLabel,
                      { color: colors.text.muted, marginTop: spacing.xs },
                    ]}
                  >
                    {tierInfo.activeReferrals} / {tierInfo.nextTierThreshold} to
                    next tier
                  </Text>
                </View>
              )}
            </>
          )}
        </Animated.View>

        {/* Section 3: Referrals List */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={{ marginTop: spacing.lg }}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text.primary, marginBottom: spacing.md },
            ]}
          >
            Your Referrals
          </Text>

          {referralsLoading && referrals.length === 0 ? (
            <View>
              {[0, 1, 2].map((i) => (
                <SkeletonBox
                  key={i}
                  width="100%"
                  height={72}
                  borderRadius={borderRadius.md}
                  style={{ marginBottom: spacing.sm }}
                />
              ))}
            </View>
          ) : referrals.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xxl,
                },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={48}
                color={colors.text.muted}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: colors.text.primary, marginTop: spacing.md },
                ]}
              >
                No referrals yet
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.text.secondary, marginTop: spacing.xs },
                ]}
              >
                Share your code to start building your Transformation Circle
              </Text>
              <Pressable
                onPress={() => setShareModalVisible(true)}
                style={[
                  styles.emptyCta,
                  {
                    backgroundColor: colors.accent.primaryDim,
                    borderRadius: borderRadius.md,
                    marginTop: spacing.lg,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.xl,
                  },
                ]}
              >
                <Text style={{ color: colors.accent.primary, fontWeight: '600' }}>
                  Share Your Code
                </Text>
              </Pressable>
            </View>
          ) : (
            referrals.map((item) => (
              <ReferralListItem key={item.id} item={item} />
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.background.overlay }]}
          onPress={() => setShareModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background.secondary,
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
                paddingBottom: insets.bottom + spacing.lg,
                padding: spacing.xl,
              },
            ]}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.border.default }]} />
            <Text
              style={[
                styles.modalTitle,
                { color: colors.text.primary, marginTop: spacing.lg },
              ]}
            >
              Share Your Code
            </Text>
            <Text
              style={[
                styles.modalCode,
                {
                  color: colors.accent.primary,
                  marginTop: spacing.md,
                  marginBottom: spacing.xl,
                },
              ]}
            >
              {myCode ?? '...'}
            </Text>

            {[
              { icon: 'share-social-outline' as const, label: 'Share', platform: 'native' },
              { icon: 'copy-outline' as const, label: 'Copy Link', platform: 'clipboard' },
            ].map((option) => (
              <Pressable
                key={option.platform}
                onPress={() => {
                  if (option.platform === 'clipboard') {
                    void handleCopy();
                    setShareModalVisible(false);
                  } else {
                    void handleShare(option.platform);
                  }
                }}
                style={[
                  styles.shareOption,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderRadius: borderRadius.md,
                    padding: spacing.lg,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={colors.accent.primary}
                />
                <Text
                  style={[
                    styles.shareOptionLabel,
                    { color: colors.text.primary, marginLeft: spacing.md },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  codeCard: {},
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  codeText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 2,
  },
  copyButton: {
    marginLeft: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tierCard: {},
  tierRingContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  tierRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierRingCount: {
    fontSize: 28,
    fontWeight: '800',
  },
  tierRingLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  tierLadder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierLadderItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  tierDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  tierLadderLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  tierLine: {
    position: 'absolute',
    top: 7,
    right: -20,
    width: 40,
    height: 2,
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
  },
  progressLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  referralItem: {},
  referralItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralCode: {
    fontSize: 15,
    fontWeight: '600',
  },
  referralDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {},
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  emptyCta: {
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {},
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalCode: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 2,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
