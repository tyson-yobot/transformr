// =============================================================================
// TRANSFORMR -- Partner Dashboard
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { GatePromptCard } from '@components/ui/GatePromptCard';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ProgressRing } from '@components/ui/ProgressRing';
import { Skeleton } from '@components/ui/Skeleton';
import { usePartnerStore } from '@stores/partnerStore';
import { useProfileStore } from '@stores/profileStore';
import { hapticLight } from '@utils/haptics';
import { HelpBubble } from '@components/ui/HelpBubble';
import { supabase } from '@services/supabase';

interface PartnerStats {
  workoutsThisWeek: number;
  currentStreak: number;
  habitsCompletedToday: number;
  habitsTotal: number;
}

export default function PartnerDashboard() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const gate = useFeatureGate('partner_features');
  const { partnership, partnerProfile, isLoading, fetchPartnership } = usePartnerStore();
  const myProfile = useProfileStore((s) => s.profile);

  const [refreshing, setRefreshing] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [myStats, setMyStats] = useState<PartnerStats>({ workoutsThisWeek: 0, currentStreak: 0, habitsCompletedToday: 0, habitsTotal: 0 });
  const [partnerStats, setPartnerStats] = useState<PartnerStats>({ workoutsThisWeek: 0, currentStreak: 0, habitsCompletedToday: 0, habitsTotal: 0 });
  const [recentActivity, setRecentActivity] = useState<{ id: string; text: string; time: string }[]>([]);

  useEffect(() => {
    fetchPartnership();
  }, [fetchPartnership]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !partnership) return;

        const partnerId =
          partnership.user_a === user.id ? partnership.user_b : partnership.user_a;

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const todayStr = new Date().toISOString().split('T')[0];

        const fetchStatsForUser = async (uid: string): Promise<PartnerStats> => {
          const [workoutsRes, habitsRes, completionsRes] = await Promise.all([
            supabase
              .from('workout_sessions')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', uid)
              .gte('started_at', weekStart.toISOString()),
            supabase
              .from('habits')
              .select('id, current_streak, is_active')
              .eq('user_id', uid)
              .eq('is_active', true),
            supabase
              .from('habit_completions')
              .select('habit_id')
              .eq('user_id', uid)
              .gte('completed_at', `${todayStr}T00:00:00`)
              .lt('completed_at', `${todayStr}T23:59:59`),
          ]);

          const habits = (habitsRes.data ?? []) as { id: string; current_streak: number | null; is_active: boolean }[];
          const completedIds = new Set((completionsRes.data ?? []).map((c: { habit_id: string }) => c.habit_id));
          const maxStreak = habits.reduce((max, h) => Math.max(max, h.current_streak ?? 0), 0);

          return {
            workoutsThisWeek: workoutsRes.count ?? 0,
            currentStreak: maxStreak,
            habitsCompletedToday: completedIds.size,
            habitsTotal: habits.length,
          };
        };

        const [mine, partner] = await Promise.all([
          fetchStatsForUser(user.id),
          partnerId ? fetchStatsForUser(partnerId) : Promise.resolve({ workoutsThisWeek: 0, currentStreak: 0, habitsCompletedToday: 0, habitsTotal: 0 }),
        ]);

        setMyStats(mine);
        setPartnerStats(partner);

        // Recent nudges as activity feed
        const { data: nudges } = await supabase
          .from('partner_nudges')
          .select('id, message, created_at, from_user_id')
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (nudges) {
          setRecentActivity(
            nudges.map((n: { id: string; message: string | null; created_at: string | null; from_user_id: string }) => ({
              id: n.id,
              text: n.message ?? 'Sent a nudge',
              time: n.created_at ?? '',
            })),
          );
        }
      } catch (err: unknown) {
        setStatsError(err instanceof Error ? err.message : 'Failed to load partner stats');
      }
    };
    if (partnership) void loadStats();
  }, [partnership]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPartnership();
    setRefreshing(false);
  }, [fetchPartnership]);

  const jointStreak = partnership?.joint_streak ?? 0;

  if (!gate.isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <GatePromptCard featureKey="partner_features" height={200} />
      </SafeAreaView>
    );
  }

  if (isLoading && !partnership) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={200} />
          <Skeleton variant="card" height={120} />
        </View>
      </View>
    );
  }

  if (!partnership || !partnerProfile) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <Text style={[typography.h2, { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.md }]}>
          No Partner Linked
        </Text>
        <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xl }]}>
          Link with a partner to see side-by-side stats, do live workouts together, and keep each other accountable.
        </Text>
        <Button title="Link Partner" onPress={() => router.push('/(tabs)/profile/partner')} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />
        }
      >
        {/* Stats error banner */}
        {statsError && (
          <Card style={{ marginBottom: spacing.md, backgroundColor: `${colors.accent.danger}15` }}>
            <Text style={[typography.caption, { color: colors.accent.danger }]}>
              Could not load partner stats: {statsError}
            </Text>
          </Card>
        )}

        {/* Joint Streak */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.streakSection}>
          <ProgressRing progress={Math.min(jointStreak / 30, 1)} size={100} strokeWidth={10}>
            <Text style={[typography.stat, { color: colors.accent.primary, fontVariant: ['tabular-nums'] }]}>{jointStreak}</Text>
          </ProgressRing>
          <Text style={[typography.captionBold, { color: colors.text.secondary, marginTop: spacing.sm }]}>
            Joint Streak (days)
          </Text>
        </Animated.View>
        <HelpBubble id="partner_invite" message="Share this code with your partner to sync" position="below" />

        {/* Side-by-Side Stats */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
            This Week
          </Text>
          <Card>
            <View style={styles.compareRow}>
              <View style={styles.compareCol}>
                <Text style={[typography.captionBold, { color: colors.accent.primary, textAlign: 'center' }]}>
                  {myProfile?.display_name ?? 'You'}
                </Text>
              </View>
              <View style={[styles.compareDivider, { backgroundColor: colors.background.primary }]} />
              <View style={styles.compareCol}>
                <Text style={[typography.captionBold, { color: colors.accent.success, textAlign: 'center' }]}>
                  {partnerProfile.display_name}
                </Text>
              </View>
            </View>

            {/* Workouts */}
            <View style={[styles.compareRow, { marginTop: spacing.md }]}>
              <Text style={[typography.statSmall, { color: colors.text.primary, flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] }]}>
                {myStats.workoutsThisWeek}
              </Text>
              <Text style={[typography.caption, { color: colors.text.muted, width: 80, textAlign: 'center' }]}>
                Workouts
              </Text>
              <Text style={[typography.statSmall, { color: colors.text.primary, flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] }]}>
                {partnerStats.workoutsThisWeek}
              </Text>
            </View>

            {/* Streaks */}
            <View style={[styles.compareRow, { marginTop: spacing.sm }]}>
              <Text style={[typography.statSmall, { color: colors.text.primary, flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] }]}>
                {myStats.currentStreak}
              </Text>
              <Text style={[typography.caption, { color: colors.text.muted, width: 80, textAlign: 'center' }]}>
                Streak
              </Text>
              <Text style={[typography.statSmall, { color: colors.text.primary, flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] }]}>
                {partnerStats.currentStreak}
              </Text>
            </View>

            {/* Habits */}
            <View style={[styles.compareRow, { marginTop: spacing.sm }]}>
              <Text style={[typography.statSmall, { color: colors.text.primary, flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] }]}>
                {myStats.habitsCompletedToday}/{myStats.habitsTotal}
              </Text>
              <Text style={[typography.caption, { color: colors.text.muted, width: 80, textAlign: 'center' }]}>
                Habits
              </Text>
              <Text style={[typography.statSmall, { color: colors.text.primary, flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] }]}>
                {partnerStats.habitsCompletedToday}/{partnerStats.habitsTotal}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Button title="Start Live Workout" onPress={() => { hapticLight(); router.push('/partner/live-workout'); }} accessibilityLabel="Start live workout with partner" fullWidth />
            <Button title="Active Challenges" onPress={() => { hapticLight(); router.push('/partner/challenges'); }} accessibilityLabel="View active partner challenges" variant="secondary" fullWidth />
            <Button title="Send Nudge" onPress={() => { hapticLight(); router.push('/partner/nudge'); }} accessibilityLabel="Send a nudge to your partner" variant="outline" fullWidth />
          </View>
        </Animated.View>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Recent Activity
            </Text>
            {recentActivity.map((item) => (
              <View
                key={item.id}
                style={[styles.activityRow, {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }]}
              >
                <Text style={[typography.body, { color: colors.text.primary, flex: 1 }]} numberOfLines={2}>
                  {item.text}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  streakSection: { alignItems: 'center' },
  compareRow: { flexDirection: 'row', alignItems: 'center' },
  compareCol: { flex: 1 },
  compareDivider: { width: 1, height: 20 },
  activityRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.15)' },
});
