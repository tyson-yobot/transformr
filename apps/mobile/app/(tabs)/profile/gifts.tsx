// =============================================================================
// TRANSFORMR — Milestone Gifts Screen
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@stores/authStore';
import {
  useReferralStore,
  useGiftsList,
  useGiftsLoading,
} from '@stores/referralStore';
import type { MilestoneGift } from '@services/referralService';

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
// Gift Guide Data
// =============================================================================

interface GiftGuideItem {
  milestone: string;
  reward: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const GIFT_GUIDE: GiftGuideItem[] = [
  {
    milestone: '30-Day Streak',
    reward: '1 Month Pro for a friend',
    icon: 'flame-outline',
    color: '#F97316',
  },
  {
    milestone: '90-Day Streak',
    reward: '3 Months Pro for a friend',
    icon: 'trophy-outline',
    color: '#EAB308',
  },
  {
    milestone: '10 Active Referrals',
    reward: '1 Month Pro gift',
    icon: 'people-outline',
    color: '#A855F7',
  },
  {
    milestone: 'PR in Every Category',
    reward: 'Exclusive badge + 1 Month gift',
    icon: 'medal-outline',
    color: '#10B981',
  },
  {
    milestone: '365-Day Streak',
    reward: '6 Months Pro for a friend',
    icon: 'diamond-outline',
    color: '#3B82F6',
  },
];

// =============================================================================
// Gift Card
// =============================================================================

function GiftCard({
  gift,
  onSend,
}: {
  gift: MilestoneGift;
  onSend?: (gift: MilestoneGift) => void;
}) {
  const { colors, spacing, borderRadius } = useTheme();

  const statusColor =
    gift.status === 'available'
      ? colors.accent.success
      : gift.status === 'sent'
        ? colors.accent.info
        : gift.status === 'claimed'
          ? colors.accent.primary
          : colors.accent.danger;

  const statusLabel =
    gift.status.charAt(0).toUpperCase() + gift.status.slice(1);

  return (
    <View
      style={[
        styles.giftCard,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
          ...colors.shadow.cardSubtle,
        },
      ]}
    >
      <View style={styles.giftCardHeader}>
        <View
          style={[
            styles.giftIcon,
            {
              backgroundColor: colors.accent.primaryDim,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Ionicons name="gift-outline" size={22} color={colors.accent.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[styles.giftType, { color: colors.text.primary }]}>
            {gift.milestoneType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Text>
          <Text style={[styles.giftReward, { color: colors.text.secondary }]}>
            {gift.rewardMonths} month{gift.rewardMonths > 1 ? 's' : ''} Pro
            {gift.badge ? ` + ${gift.badge}` : ''}
          </Text>
        </View>
        <View
          style={[
            styles.giftStatusBadge,
            {
              backgroundColor:
                gift.status === 'available'
                  ? colors.accent.successDim
                  : gift.status === 'sent'
                    ? colors.accent.infoDim
                    : gift.status === 'claimed'
                      ? colors.accent.primaryDim
                      : colors.accent.dangerDim,
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Text style={[styles.giftStatusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Sent details */}
      {gift.status === 'sent' && gift.recipientEmail && (
        <View
          style={[
            styles.sentInfo,
            {
              backgroundColor: colors.background.tertiary,
              borderRadius: borderRadius.sm,
              padding: spacing.md,
              marginTop: spacing.md,
            },
          ]}
        >
          <Ionicons
            name="mail-outline"
            size={14}
            color={colors.text.muted}
          />
          <Text
            style={[
              styles.sentInfoText,
              { color: colors.text.secondary, marginLeft: spacing.sm },
            ]}
          >
            Sent to {gift.recipientEmail}
          </Text>
        </View>
      )}

      {/* Gift code */}
      <Text
        style={[
          styles.giftCode,
          { color: colors.text.muted, marginTop: spacing.sm },
        ]}
      >
        Code: {gift.giftCode}
      </Text>

      {/* Expiry */}
      <Text style={[styles.giftExpiry, { color: colors.text.muted }]}>
        Expires {new Date(gift.expiresAt).toLocaleDateString()}
      </Text>

      {/* Send button */}
      {onSend && gift.status === 'available' && (
        <Pressable
          onPress={() => onSend(gift)}
          style={[
            styles.sendButton,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: borderRadius.md,
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <Ionicons
            name="send-outline"
            size={16}
            color={colors.text.inverse}
            style={{ marginRight: spacing.xs }}
          />
          <Text style={[styles.sendButtonText, { color: colors.text.inverse }]}>
            Send Gift
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// =============================================================================
// Main Screen
// =============================================================================

export default function GiftsScreen() {
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);

  const gifts = useGiftsList();
  const giftsLoading = useGiftsLoading();
  const loadGifts = useReferralStore((s) => s.loadGifts);
  const sendMilestoneGift = useReferralStore((s) => s.sendMilestoneGift);

  const [refreshing, setRefreshing] = useState(false);
  const [sendingGiftId, setSendingGiftId] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');

  // Load on mount
  useEffect(() => {
    if (!userId) return;
    void loadGifts(userId);
  }, [userId, loadGifts]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    await loadGifts(userId);
    setRefreshing(false);
  }, [userId, loadGifts]);

  // Filter gifts
  const availableGifts = useMemo(
    () => gifts.filter((g) => g.status === 'available'),
    [gifts],
  );
  const sentGifts = useMemo(
    () => gifts.filter((g) => g.status === 'sent'),
    [gifts],
  );

  // Send gift
  const handleSendGift = useCallback(
    (gift: MilestoneGift) => {
      setSendingGiftId(gift.id);
      setRecipientEmail('');
    },
    [],
  );

  const confirmSendGift = useCallback(async () => {
    if (!sendingGiftId || !recipientEmail.trim()) return;

    try {
      await sendMilestoneGift(sendingGiftId, recipientEmail.trim());
      Alert.alert('Gift Sent!', 'Your friend will receive an email with their gift code.');
      setSendingGiftId(null);
      setRecipientEmail('');
      if (userId) {
        void loadGifts(userId);
      }
    } catch {
      Alert.alert('Error', 'Failed to send gift. Please try again.');
    }
  }, [sendingGiftId, recipientEmail, sendMilestoneGift, userId, loadGifts]);

  const isLoading = giftsLoading && gifts.length === 0;

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
            Milestone Gifts
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Earn gifts by hitting milestones, share them with friends
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
        ) : (
          <>
            {/* Send Gift Inline Form */}
            {sendingGiftId && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={[
                  styles.sendForm,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.lg,
                    padding: spacing.xl,
                    marginTop: spacing.lg,
                    borderWidth: 1,
                    borderColor: colors.accent.primary,
                  },
                ]}
              >
                <Text
                  style={[styles.sendFormTitle, { color: colors.text.primary }]}
                >
                  Send Gift
                </Text>
                <Text
                  style={[
                    styles.sendFormDesc,
                    { color: colors.text.secondary, marginTop: spacing.xs },
                  ]}
                >
                  Enter the recipient's email address
                </Text>
                <TextInput
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  placeholder="friend@email.com"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[
                    styles.emailInput,
                    {
                      backgroundColor: colors.background.input,
                      color: colors.text.primary,
                      borderColor: colors.border.default,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginTop: spacing.md,
                    },
                  ]}
                />
                <View style={[styles.sendFormActions, { marginTop: spacing.md }]}>
                  <Pressable
                    onPress={() => setSendingGiftId(null)}
                    style={[
                      styles.cancelButton,
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
                    onPress={confirmSendGift}
                    disabled={!recipientEmail.trim()}
                    style={[
                      styles.confirmButton,
                      {
                        backgroundColor: recipientEmail.trim()
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
                        color: recipientEmail.trim()
                          ? colors.text.inverse
                          : colors.text.muted,
                        fontWeight: '600',
                      }}
                    >
                      Send
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {/* Available to Send */}
            {availableGifts.length > 0 && (
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
                  Available to Send
                </Text>
                {availableGifts.map((gift) => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    onSend={handleSendGift}
                  />
                ))}
              </Animated.View>
            )}

            {/* Sent */}
            {sentGifts.length > 0 && (
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
                  Sent
                </Text>
                {sentGifts.map((gift) => (
                  <GiftCard key={gift.id} gift={gift} />
                ))}
              </Animated.View>
            )}

            {/* Empty state */}
            {gifts.length === 0 && (
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
                <Ionicons
                  name="gift-outline"
                  size={48}
                  color={colors.text.muted}
                />
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: colors.text.primary, marginTop: spacing.md },
                  ]}
                >
                  No gifts yet
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: colors.text.secondary, marginTop: spacing.xs },
                  ]}
                >
                  Hit milestones like streak goals and referral targets to earn
                  gifts you can share with friends.
                </Text>
              </View>
            )}

            {/* Gift Guide */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(300)}
              style={{ marginTop: spacing.xxl }}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text.primary, marginBottom: spacing.md },
                ]}
              >
                Gift Guide
              </Text>
              <Text
                style={[
                  styles.guideSubtitle,
                  { color: colors.text.secondary, marginBottom: spacing.lg },
                ]}
              >
                How to earn milestone gifts
              </Text>

              {GIFT_GUIDE.map((item, index) => (
                <View
                  key={item.milestone}
                  style={[
                    styles.guideItem,
                    {
                      backgroundColor: colors.background.secondary,
                      borderRadius: borderRadius.lg,
                      padding: spacing.lg,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.guideIcon,
                      {
                        backgroundColor: `${item.color}20`,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text
                      style={[styles.guideMilestone, { color: colors.text.primary }]}
                    >
                      {item.milestone}
                    </Text>
                    <Text
                      style={[
                        styles.guideReward,
                        { color: colors.text.secondary, marginTop: 2 },
                      ]}
                    >
                      {item.reward}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.text.muted}
                  />
                </View>
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
  giftCard: {},
  giftCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftType: {
    fontSize: 15,
    fontWeight: '600',
  },
  giftReward: {
    fontSize: 13,
    marginTop: 2,
  },
  giftStatusBadge: {},
  giftStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentInfoText: {
    fontSize: 13,
  },
  giftCode: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  giftExpiry: {
    fontSize: 12,
    marginTop: 2,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sendForm: {},
  sendFormTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sendFormDesc: {
    fontSize: 14,
  },
  emailInput: {
    fontSize: 16,
    borderWidth: 1,
  },
  sendFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    alignItems: 'center',
    justifyContent: 'center',
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
  guideSubtitle: {
    fontSize: 14,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideMilestone: {
    fontSize: 15,
    fontWeight: '600',
  },
  guideReward: {
    fontSize: 13,
  },
});
