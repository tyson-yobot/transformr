// =============================================================================
// TRANSFORMR — Accountability Squad Screen
// =============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@stores/authStore';
import {
  useReferralStore,
  useSquadLoading,
  useSquadError,
  useSquadInviteCode,
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
// Squad Member Row
// =============================================================================

interface SquadMember {
  id: string;
  displayName: string;
  joinedAt: string;
  isCreator: boolean;
}

function SquadMemberRow({ member }: { member: SquadMember }) {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.memberRow,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.memberAvatar,
          {
            backgroundColor: colors.accent.primaryDim,
            borderRadius: borderRadius.full,
          },
        ]}
      >
        <Ionicons name="person-outline" size={20} color={colors.accent.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[styles.memberName, { color: colors.text.primary }]}>
          {member.displayName}
        </Text>
        <Text style={[styles.memberDate, { color: colors.text.muted }]}>
          Joined {new Date(member.joinedAt).toLocaleDateString()}
        </Text>
      </View>
      {member.isCreator && (
        <View
          style={[
            styles.creatorBadge,
            {
              backgroundColor: colors.accent.goldDim,
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Text style={[styles.creatorBadgeText, { color: colors.accent.gold }]}>
            Creator
          </Text>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// Discount Tier Display
// =============================================================================

function SquadDiscountTier({ memberCount }: { memberCount: number }) {
  const { colors, spacing, borderRadius } = useTheme();

  const tiers = [
    { min: 2, discount: 5, label: '2+ members' },
    { min: 4, discount: 10, label: '4+ members' },
    { min: 6, discount: 15, label: '6+ members' },
  ];

  const currentDiscount =
    memberCount >= 6 ? 15 : memberCount >= 4 ? 10 : memberCount >= 2 ? 5 : 0;

  return (
    <View
      style={[
        styles.discountCard,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          ...colors.shadow.cardSubtle,
        },
      ]}
    >
      <Text style={[styles.discountTitle, { color: colors.text.primary }]}>
        Squad Discount
      </Text>
      <Text
        style={[
          styles.discountPercent,
          { color: colors.accent.success, marginTop: spacing.xs },
        ]}
      >
        {currentDiscount}% off
      </Text>

      <View style={[styles.discountTiers, { marginTop: spacing.md }]}>
        {tiers.map((tier) => {
          const isActive = memberCount >= tier.min;
          return (
            <View key={tier.min} style={styles.discountTierRow}>
              <Ionicons
                name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={isActive ? colors.accent.success : colors.text.muted}
              />
              <Text
                style={[
                  styles.discountTierLabel,
                  {
                    color: isActive ? colors.text.primary : colors.text.muted,
                    marginLeft: spacing.sm,
                  },
                ]}
              >
                {tier.label} — {tier.discount}% off
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// =============================================================================
// Main Screen
// =============================================================================

export default function SquadScreen() {
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);

  const squadLoading = useSquadLoading();
  const squadError = useSquadError();
  const squadInviteCode = useSquadInviteCode();
  const squadId = useReferralStore((s) => s.squadId);

  const createNewSquad = useReferralStore((s) => s.createNewSquad);
  const joinExistingSquad = useReferralStore((s) => s.joinExistingSquad);
  const leaveCurrentSquad = useReferralStore((s) => s.leaveCurrentSquad);

  const [refreshing, setRefreshing] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Placeholder squad data — in production this would come from the store
  const [squadDisplayName] = useState<string | null>(null);
  const [members] = useState<SquadMember[]>([]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Reload squad data here when endpoint exists
    setRefreshing(false);
  }, []);

  // Create squad
  const handleCreateSquad = useCallback(async () => {
    if (!userId || !squadName.trim()) return;
    await createNewSquad(userId, squadName.trim());
    setSquadName('');
  }, [userId, squadName, createNewSquad]);

  // Join squad
  const handleJoinSquad = useCallback(async () => {
    if (!userId || !joinCode.trim()) return;
    await joinExistingSquad(userId, joinCode.trim().toUpperCase());
    setJoinCode('');
  }, [userId, joinCode, joinExistingSquad]);

  // Leave squad
  const handleLeaveSquad = useCallback(() => {
    if (!userId) return;
    Alert.alert(
      'Leave Squad',
      'Are you sure you want to leave this squad? You will lose your squad discount.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => void leaveCurrentSquad(userId),
        },
      ],
    );
  }, [userId, leaveCurrentSquad]);

  // Share invite
  const handleShareInvite = useCallback(async () => {
    if (!squadInviteCode) return;
    const message = `Join my Accountability Squad on TRANSFORMR! Use invite code: ${squadInviteCode}\n\nhttps://transformr.app/squad/${squadInviteCode}`;
    try {
      await Share.share({ message });
    } catch {
      // User cancelled
    }
    setShareModalVisible(false);
  }, [squadInviteCode]);

  const hasSquad = squadId !== null;

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
            Accountability Squad
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {hasSquad
              ? 'Train together, save together'
              : 'Team up with friends for group discounts'}
          </Text>
        </Animated.View>

        {squadError ? (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: colors.accent.dangerDim,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                marginTop: spacing.lg,
              },
            ]}
          >
            <Text style={[styles.errorText, { color: colors.accent.danger }]}>
              {squadError}
            </Text>
          </View>
        ) : null}

        {squadLoading && !hasSquad ? (
          <View style={{ marginTop: spacing.xl }}>
            <SkeletonBox width="100%" height={200} borderRadius={borderRadius.lg} />
          </View>
        ) : !hasSquad ? (
          /* No Squad — Create or Join */
          <View style={{ marginTop: spacing.xl }}>
            {/* Create Squad */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(100)}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  ...colors.shadow.card,
                },
              ]}
            >
              <View style={styles.actionCardHeader}>
                <Ionicons
                  name="people-outline"
                  size={24}
                  color={colors.accent.primary}
                />
                <Text
                  style={[
                    styles.actionCardTitle,
                    { color: colors.text.primary, marginLeft: spacing.md },
                  ]}
                >
                  Create Squad
                </Text>
              </View>
              <Text
                style={[
                  styles.actionCardDesc,
                  { color: colors.text.secondary, marginTop: spacing.sm },
                ]}
              >
                Start a new Accountability Squad and invite your friends for group
                discounts up to 15% off.
              </Text>
              <TextInput
                value={squadName}
                onChangeText={setSquadName}
                placeholder="Squad name..."
                placeholderTextColor={colors.text.muted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background.input,
                    color: colors.text.primary,
                    borderColor: colors.border.default,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginTop: spacing.lg,
                  },
                ]}
                maxLength={30}
              />
              <Pressable
                onPress={handleCreateSquad}
                disabled={!squadName.trim() || squadLoading}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: squadName.trim()
                      ? colors.accent.primary
                      : colors.background.tertiary,
                    borderRadius: borderRadius.md,
                    marginTop: spacing.md,
                    paddingVertical: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    {
                      color: squadName.trim()
                        ? colors.text.inverse
                        : colors.text.muted,
                    },
                  ]}
                >
                  {squadLoading ? 'Creating...' : 'Create Squad'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Divider */}
            <View style={[styles.dividerRow, { marginVertical: spacing.xl }]}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border.default }]}
              />
              <Text
                style={[
                  styles.dividerText,
                  {
                    color: colors.text.muted,
                    marginHorizontal: spacing.md,
                  },
                ]}
              >
                OR
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border.default }]}
              />
            </View>

            {/* Join Squad */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  ...colors.shadow.card,
                },
              ]}
            >
              <View style={styles.actionCardHeader}>
                <Ionicons
                  name="enter-outline"
                  size={24}
                  color={colors.accent.cyan}
                />
                <Text
                  style={[
                    styles.actionCardTitle,
                    { color: colors.text.primary, marginLeft: spacing.md },
                  ]}
                >
                  Join Squad
                </Text>
              </View>
              <Text
                style={[
                  styles.actionCardDesc,
                  { color: colors.text.secondary, marginTop: spacing.sm },
                ]}
              >
                Have an invite code? Enter it below to join an existing squad.
              </Text>
              <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="SQUAD-XXXX-XXXX"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="characters"
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background.input,
                    color: colors.text.primary,
                    borderColor: colors.border.default,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginTop: spacing.lg,
                  },
                ]}
                maxLength={16}
              />
              <Pressable
                onPress={handleJoinSquad}
                disabled={!joinCode.trim() || squadLoading}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: joinCode.trim()
                      ? colors.accent.cyan
                      : colors.background.tertiary,
                    borderRadius: borderRadius.md,
                    marginTop: spacing.md,
                    paddingVertical: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    {
                      color: joinCode.trim()
                        ? colors.text.inverse
                        : colors.text.muted,
                    },
                  ]}
                >
                  {squadLoading ? 'Joining...' : 'Join Squad'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        ) : (
          /* Has Squad */
          <View style={{ marginTop: spacing.xl }}>
            {/* Squad Header */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(100)}
              style={[
                styles.squadHeader,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  ...colors.shadow.card,
                },
              ]}
            >
              <Ionicons
                name="people-circle-outline"
                size={40}
                color={colors.accent.primary}
              />
              <Text
                style={[
                  styles.squadName,
                  { color: colors.text.primary, marginTop: spacing.sm },
                ]}
              >
                {squadDisplayName ?? 'Your Squad'}
              </Text>
              {squadInviteCode && (
                <Text
                  style={[
                    styles.inviteCodeText,
                    { color: colors.text.muted, marginTop: spacing.xs },
                  ]}
                >
                  Code: {squadInviteCode}
                </Text>
              )}
            </Animated.View>

            {/* Discount Tier */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
              style={{ marginTop: spacing.lg }}
            >
              <SquadDiscountTier memberCount={members.length} />
            </Animated.View>

            {/* Members */}
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
                Members ({members.length})
              </Text>
              {members.length === 0 ? (
                <View
                  style={[
                    styles.emptyMembers,
                    {
                      backgroundColor: colors.background.secondary,
                      borderRadius: borderRadius.lg,
                      padding: spacing.xxl,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={36}
                    color={colors.text.muted}
                  />
                  <Text
                    style={[
                      styles.emptyMembersText,
                      { color: colors.text.secondary, marginTop: spacing.md },
                    ]}
                  >
                    Invite friends to join your squad and unlock group discounts
                  </Text>
                </View>
              ) : (
                members.map((member) => (
                  <SquadMemberRow key={member.id} member={member} />
                ))
              )}
            </Animated.View>

            {/* Actions */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(400)}
              style={[styles.squadActions, { marginTop: spacing.xl }]}
            >
              <Pressable
                onPress={() => setShareModalVisible(true)}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.accent.primary,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                    marginBottom: spacing.md,
                  },
                ]}
              >
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color={colors.text.inverse}
                  style={{ marginRight: spacing.sm }}
                />
                <Text
                  style={[styles.actionButtonText, { color: colors.text.inverse }]}
                >
                  Invite Members
                </Text>
              </Pressable>

              <Pressable
                onPress={handleLeaveSquad}
                style={[
                  styles.leaveButton,
                  {
                    borderColor: colors.accent.danger,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[styles.leaveButtonText, { color: colors.accent.danger }]}
                >
                  Leave Squad
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        )}
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
            <View
              style={[styles.modalHandle, { backgroundColor: colors.border.default }]}
            />
            <Text
              style={[
                styles.modalTitle,
                { color: colors.text.primary, marginTop: spacing.lg },
              ]}
            >
              Invite to Squad
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
              {squadInviteCode ?? '...'}
            </Text>

            <Pressable
              onPress={handleShareInvite}
              style={[
                styles.shareOption,
                {
                  backgroundColor: colors.background.tertiary,
                  borderRadius: borderRadius.md,
                  padding: spacing.lg,
                },
              ]}
            >
              <Ionicons
                name="share-social-outline"
                size={22}
                color={colors.accent.primary}
              />
              <Text
                style={[
                  styles.shareOptionLabel,
                  { color: colors.text.primary, marginLeft: spacing.md },
                ]}
              >
                Share Invite Code
              </Text>
            </Pressable>
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
  errorCard: {},
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionCard: {},
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionCardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  textInput: {
    fontSize: 16,
    borderWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  squadHeader: {
    alignItems: 'center',
  },
  squadName: {
    fontSize: 22,
    fontWeight: '700',
  },
  inviteCodeText: {
    fontSize: 13,
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
  },
  memberDate: {
    fontSize: 12,
    marginTop: 2,
  },
  creatorBadge: {},
  creatorBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  discountCard: {},
  discountTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  discountPercent: {
    fontSize: 28,
    fontWeight: '800',
  },
  discountTiers: {
    gap: 8,
  },
  discountTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountTierLabel: {
    fontSize: 14,
  },
  emptyMembers: {
    alignItems: 'center',
  },
  emptyMembersText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  squadActions: {},
  leaveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  leaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
