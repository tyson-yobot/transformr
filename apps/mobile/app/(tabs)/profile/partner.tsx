// =============================================================================
// TRANSFORMR -- Partner Management Screen
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
  Share,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Toggle } from '@components/ui/Toggle';
import { Badge } from '@components/ui/Badge';
import { usePartnerStore } from '@stores/partnerStore';
import { supabase } from '@services/supabase';
import { hapticLight, hapticSuccess, hapticWarning } from '@utils/haptics';
import type { SharedPreferences } from '@app-types/database';

// ---------------------------------------------------------------------------
// Privacy toggle keys
// ---------------------------------------------------------------------------
const PRIVACY_TOGGLES: readonly {
  key: keyof SharedPreferences;
  label: string;
  icon: string;
}[] = [
  { key: 'can_see_weight', label: 'Weight & Body Stats', icon: '⚖️' },
  { key: 'can_see_workouts', label: 'Workouts', icon: '🏋️' },
  { key: 'can_see_nutrition', label: 'Nutrition', icon: '🍎' },
  { key: 'can_see_habits', label: 'Habits', icon: '✅' },
  { key: 'can_see_goals', label: 'Goals', icon: '🎯' },
  { key: 'can_see_mood', label: 'Mood & Journal', icon: '😊' },
  { key: 'can_see_business', label: 'Business', icon: '💼' },
  { key: 'can_see_finance', label: 'Finance', icon: '💰' },
  { key: 'can_nudge', label: 'Can Send Nudges', icon: '👋' },
  { key: 'can_challenge', label: 'Can Challenge', icon: '⚔️' },
  { key: 'live_sync_enabled', label: 'Live Workout Sync', icon: '📡' },
];

export default function PartnerScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    partnership,
    partnerProfile,
    isLoading,
    linkPartner,
    fetchPartnership,
    pendingInviteCode,
    setPendingInviteCode,
  } = usePartnerStore();

  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pre-fill invite code when opened via a partner deep link
  useEffect(() => {
    if (pendingInviteCode) {
      setInviteCode(pendingInviteCode);
      setPendingInviteCode(null);
    }
  }, [pendingInviteCode, setPendingInviteCode]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPartnership();
    setIsRefreshing(false);
  }, [fetchPartnership]);

  const isLinked = partnership?.status === 'active' && partnerProfile !== null;

  // Generate invite code
  const handleGenerateCode = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const code = `TRFM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { error } = await supabase.from('partnerships').insert({
        user_a: user.id,
        invite_code: code,
        status: 'pending',
      });

      if (error) throw error;

      setGeneratedCode(code);
      await hapticSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate code';
      Alert.alert('Error', msg);
    }
  }, []);

  // Share invite code
  const handleShareCode = useCallback(async () => {
    if (!generatedCode) return;
    const deepLink = Linking.createURL('partner/join', { queryParams: { code: generatedCode } });
    await Share.share({
      message: `Let's transform together! 💪\n\nI'm using TRANSFORMR to track fitness, goals, and stay accountable. Be my partner!\n\nYour invite code: ${generatedCode}\n\nTap this link to connect instantly:\n${deepLink}`,
    });
  }, [generatedCode]);

  // Link via code
  const handleLinkPartner = useCallback(async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code.');
      return;
    }
    await linkPartner(inviteCode.trim());
    await hapticSuccess();
    setInviteCode('');
  }, [inviteCode, linkPartner]);

  // Unpair
  const handleUnpair = useCallback(() => {
    Alert.alert(
      'Unpair Partner',
      'Are you sure? This will end your partnership and shared stats.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair',
          style: 'destructive',
          onPress: async () => {
            if (!partnership) return;
            await hapticWarning();
            await supabase
              .from('partnerships')
              .update({ status: 'ended' })
              .eq('id', partnership.id);
            await fetchPartnership();
          },
        },
      ],
    );
  }, [partnership, fetchPartnership]);

  // Privacy toggle handler
  const handlePrivacyToggle = useCallback(
    async (key: keyof SharedPreferences, value: boolean) => {
      if (!partnership) return;
      void hapticLight();
      const current = partnership.shared_preferences ?? {};
      const updated = { ...current, [key]: value };
      await supabase
        .from('partnerships')
        .update({ shared_preferences: updated })
        .eq('id', partnership.id);
      await fetchPartnership();
    },
    [partnership, fetchPartnership],
  );

  const sharedPrefs: SharedPreferences = (partnership?.shared_preferences ?? {
    can_see_weight: true,
    can_see_workouts: true,
    can_see_nutrition: true,
    can_see_habits: true,
    can_see_goals: true,
    can_see_mood: false,
    can_see_journal: false,
    can_see_business: false,
    can_see_finance: false,
    can_nudge: true,
    can_challenge: true,
    live_sync_enabled: true,
  }) as SharedPreferences;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: insets.bottom + 100,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      {isLinked && partnerProfile ? (
        <>
          {/* Current Partner Card */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
              <View style={styles.partnerHeader}>
                <View
                  style={[
                    styles.partnerAvatar,
                    { backgroundColor: colors.accent.pink },
                  ]}
                >
                  <Text style={{ fontSize: 28 }}>
                    {partnerProfile.display_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.lg }}>
                  <Text
                    style={[typography.h2, { color: colors.text.primary }]}
                    numberOfLines={1}
                  >
                    {partnerProfile.display_name}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Partner
                  </Text>
                </View>
                <Badge label="Active" variant="success" />
              </View>
            </Card>
          </Animated.View>

          {/* Partnership Stats */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)}>
            <Card
              variant="default"
              style={{ marginBottom: spacing.lg }}
              header={
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  Partnership Stats
                </Text>
              }
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[typography.stat, { color: colors.accent.fire }]}>
                    {partnership?.joint_streak ?? 0}
                  </Text>
                  <Text
                    style={[typography.tiny, { color: colors.text.muted }]}
                  >
                    Joint Streak
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[typography.stat, { color: colors.accent.primary }]}
                  >
                    {partnership?.longest_joint_streak ?? 0}
                  </Text>
                  <Text
                    style={[typography.tiny, { color: colors.text.muted }]}
                  >
                    Best Streak
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[typography.stat, { color: colors.accent.success }]}
                  >
                    0
                  </Text>
                  <Text
                    style={[typography.tiny, { color: colors.text.muted }]}
                  >
                    Challenges
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>

          {/* Privacy Toggles */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Card
              variant="default"
              style={{ marginBottom: spacing.lg }}
              header={
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  Privacy Controls
                </Text>
              }
            >
              {PRIVACY_TOGGLES.map((toggle) => (
                <View
                  key={toggle.key}
                  style={[
                    styles.privacyRow,
                    {
                      paddingVertical: spacing.sm,
                      borderBottomColor: colors.border.subtle,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 16, marginRight: spacing.sm }}>
                    {toggle.icon}
                  </Text>
                  <Text
                    style={[
                      typography.body,
                      { color: colors.text.primary, flex: 1 },
                    ]}
                  >
                    {toggle.label}
                  </Text>
                  <Toggle
                    value={sharedPrefs[toggle.key]}
                    onValueChange={(v) => handlePrivacyToggle(toggle.key, v)}
                  />
                </View>
              ))}
            </Card>
          </Animated.View>

          {/* Unpair */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Button
              title="Unpair Partner"
              variant="danger"
              fullWidth
              onPress={handleUnpair}
            />
          </Animated.View>
        </>
      ) : (
        <>
          {/* No Partner -- invite flow */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 48, marginBottom: spacing.md }}>
                  👫
                </Text>
                <Text
                  style={[
                    typography.h2,
                    {
                      color: colors.text.primary,
                      textAlign: 'center',
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  No Partner Linked
                </Text>
                <Text
                  style={[
                    typography.body,
                    {
                      color: colors.text.secondary,
                      textAlign: 'center',
                      marginBottom: spacing.xl,
                    },
                  ]}
                >
                  Team up with someone for accountability, shared challenges,
                  and real-time workout sync.
                </Text>
              </View>
            </Card>
          </Animated.View>

          {/* Generate Code */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)}>
            <Card
              variant="default"
              style={{ marginBottom: spacing.lg }}
              header={
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  Invite Partner
                </Text>
              }
            >
              {generatedCode ? (
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={[
                      typography.h1,
                      {
                        color: colors.accent.primary,
                        letterSpacing: 4,
                        marginBottom: spacing.md,
                      },
                    ]}
                  >
                    {generatedCode}
                  </Text>
                  <Button
                    title="Share Code"
                    variant="primary"
                    onPress={handleShareCode}
                  />
                </View>
              ) : (
                <Button
                  title="Generate Invite Code"
                  variant="primary"
                  fullWidth
                  onPress={handleGenerateCode}
                  loading={isLoading}
                />
              )}
            </Card>
          </Animated.View>

          {/* Enter Code */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Card
              variant="default"
              style={{ marginBottom: spacing.lg }}
              header={
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  Enter Invite Code
                </Text>
              }
            >
              <Input
                placeholder="e.g. TRFM-ABC123"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                containerStyle={{ marginBottom: spacing.md }}
              />
              <Button
                title="Link Partner"
                variant="secondary"
                fullWidth
                onPress={handleLinkPartner}
                loading={isLoading}
                disabled={!inviteCode.trim()}
              />
            </Card>
          </Animated.View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
