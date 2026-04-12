// =============================================================================
// TRANSFORMR -- Partner Dashboard
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import { Skeleton } from '@components/ui/Skeleton';
import { usePartnerStore } from '@stores/partnerStore';
import { useProfileStore } from '@stores/profileStore';
import { formatNumber } from '@utils/formatters';
import { hapticLight } from '@utils/haptics';
import { supabase } from '@services/supabase';

interface PartnerStats {
  workoutsThisWeek: number;
  currentStreak: number;
  habitsCompletedToday: number;
  habitsTotal: number;
}

export default function PartnerDashboard() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { partnership, partnerProfile, isLoading, fetchPartnership } = usePartnerStore();
  const myProfile = useProfileStore((s) => s.profile);

  const [refreshing, setRefreshing] = useState(false);
  const [myStats, setMyStats] = useState<PartnerStats>({ workoutsThisWeek: 0, currentStreak: 0, habitsCompletedToday: 0, habitsTotal: 0 });
  const [partnerStats, setPartnerStats] = useState<PartnerStats>({ workoutsThisWeek: 0, currentStreak: 0, habitsCompletedToday: 0, habitsTotal: 0 });
  const [recentActivity, setRecentActivity] = useState<{ id: string; text: string; time: string }[]>([]);

  useEffect(() => {
    fetchPartnership();
  }, [fetchPartnership]);

  useEffect(() => {
    // Fetch lightweight stats for both users
    const loadStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !partnership) return;

        const partnerId = partnership.user_a === user.id ? partnership.user_b : partnership.user_a;

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
      } catch {
        // Silently ignore stats loading errors
      }
    };
    if (partnership) loadStats();
  }, [partnership]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPartnership();
    setRefreshing(false);
  }, [fetchPartnership]);

  const jointStreak = partnership?.joint_streak ?? 0;

  if (isLoading && !partnership) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
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
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />
        }
      >
        {/* Joint Streak */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.streakSection}>
          <ProgressRing progress={Math.min(jointStreak / 30, 1)} size={100} strokeWidth={10}>
            <Text style={[typography.stat, { color: colors.accent.primary, fontVariant: ['tabular-nums'] }]}>{jointStreak}</Text>
          </ProgressRing>
          <Text style={[typography.captionBold, { color: colors.text.secondary, marginTop: spacing.sm }]}>
            Joint Streak (days)
          </Text>
        </Animated.View>

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
  activityRow: { flexDirection: 'row', alignItems: 'center' },
});
