// =============================================================================
// TRANSFORMR -- Fitness Home Screen
// =============================================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { MonoText } from '@components/ui/MonoText';
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import { QuickStatsRow } from '@components/cards/QuickStatsRow';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { WeightChart } from '@components/charts/WeightChart';
import { useWorkoutStore } from '@stores/workoutStore';
import { formatVolume, formatRelativeTime, formatDuration } from '@utils/formatters';
import { hapticLight } from '@utils/haptics';
import type { WorkoutSession, WorkoutTemplate, PersonalRecord } from '@app-types/database';
import { supabase } from '@services/supabase';

interface RecentWorkout {
  id: string;
  name: string;
  completed_at: string;
  duration_minutes: number;
  total_volume: number;
  total_sets: number;
}

interface WeightDataPoint {
  date: string;
  weight: number;
}

export default function FitnessHomeScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { templates, fetchTemplates, startWorkout, isLoading } = useWorkoutStore();

  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayTemplate = useMemo(() => {
    const dayOfWeek = new Date().getDay();
    return templates.find((t) => t.day_of_week === dayOfWeek) ?? null;
  }, [templates]);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [sessionsRes, prsRes, weightRes] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('id, name, completed_at, duration_minutes, total_volume, total_sets')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(10),
        supabase
          .from('personal_records')
          .select('*')
          .eq('user_id', user.id)
          .order('achieved_at', { ascending: false })
          .limit(5),
        supabase
          .from('weight_logs')
          .select('weight, logged_at')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: true })
          .limit(90),
      ]);

      if (sessionsRes.data) {
        const sessions = sessionsRes.data as {
          id: string; name: string; completed_at: string | null;
          duration_minutes: number | null; total_volume: number | null; total_sets: number | null;
        }[];
        setRecentWorkouts(
          sessions.map((s) => ({
            id: s.id,
            name: s.name,
            completed_at: s.completed_at ?? '',
            duration_minutes: s.duration_minutes ?? 0,
            total_volume: s.total_volume ?? 0,
            total_sets: s.total_sets ?? 0,
          })),
        );

        // Calculate weekly stats
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekWorkouts = sessions.filter(
          (s) => s.completed_at && new Date(s.completed_at) >= weekAgo,
        );
        setWorkoutsThisWeek(weekWorkouts.length);
        setWeeklyVolume(
          weekWorkouts.reduce((sum: number, s) => sum + (s.total_volume ?? 0), 0),
        );
      }

      if (prsRes.data) {
        setPersonalRecords(prsRes.data as PersonalRecord[]);
      }

      if (weightRes.data) {
        const weights = weightRes.data as { weight: number; logged_at: string | null }[];
        setWeightData(
          weights.map((w) => ({
            date: w.logged_at ?? '',
            weight: w.weight,
          })),
        );
      }

      // Calculate streak from sessions
      if (sessionsRes.data && sessionsRes.data.length > 0) {
        const allSessions = sessionsRes.data as { completed_at: string | null }[];
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0] ?? '';
          const hasWorkout = allSessions.some((s) => {
            if (!s.completed_at) return false;
            return s.completed_at.startsWith(dateStr);
          });

          if (hasWorkout) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        setCurrentStreak(streak);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load fitness data';
      setError(message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    loadData();
  }, [fetchTemplates, loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTemplates(), loadData()]);
    setRefreshing(false);
  }, [fetchTemplates, loadData]);

  const handleStartWorkout = useCallback(
    async (templateId: string | null) => {
      await hapticLight();
      await startWorkout(templateId);
      router.push('/(tabs)/fitness/workout-player');
    },
    [startWorkout, router],
  );

  const handleNavigate = useCallback(
    (path: string) => {
      hapticLight();
      router.push(path as never);
    },
    [router],
  );

  const quickStats = useMemo(
    () => [
      {
        icon: <Ionicons name="barbell-outline" size={20} color={colors.accent.primary} />,
        label: 'Weekly Volume',
        value: formatVolume(weeklyVolume),
      },
      {
        icon: <Ionicons name="fitness-outline" size={20} color={colors.accent.success} />,
        label: 'This Week',
        value: `${workoutsThisWeek}`,
      },
      {
        icon: <Ionicons name="flame-outline" size={20} color={colors.accent.fire} />,
        label: 'Streak',
        value: `${currentStreak}d`,
      },
    ],
    [weeklyVolume, workoutsThisWeek, currentStreak, colors],
  );

  const renderRecentWorkout = useCallback(
    ({ item }: { item: RecentWorkout }) => (
      <Card
        style={{ marginBottom: spacing.sm }}
        onPress={() => handleNavigate(`/(tabs)/fitness/workout-summary?sessionId=${item.id}`)}
      >
        <View style={styles.workoutRow}>
          <View style={styles.workoutInfo}>
            <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
              {item.name}
            </Text>
            <Text style={[typography.caption, { color: colors.text.muted }]}>
              {item.completed_at ? formatRelativeTime(item.completed_at) : 'Unknown'}
            </Text>
          </View>
          <View style={styles.workoutStats}>
            <MonoText variant="monoCaption" color={colors.text.secondary}>
              {formatDuration(item.duration_minutes)}
            </MonoText>
            <MonoText variant="monoCaption" color={colors.text.muted}>
              {formatVolume(item.total_volume)} / {item.total_sets} sets
            </MonoText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </View>
      </Card>
    ),
    [colors, typography, spacing, handleNavigate],
  );

  if (loadingData) {
    return (
      <ListSkeleton
        rows={6}
        style={{ backgroundColor: colors.background.primary }}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <AIInsightCard screenKey="fitness/index" style={{ marginBottom: spacing.md }} />

        {error && (
          <Card style={{ marginBottom: spacing.lg, backgroundColor: `${colors.accent.danger}15` }}>
            <Text style={[typography.caption, { color: colors.accent.danger }]}>{error}</Text>
          </Card>
        )}

        {/* Today's Workout */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="today-outline" size={20} color={colors.accent.primary} />
            <Text style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}>
              Today's Workout
            </Text>
          </View>
          {todayTemplate ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                {todayTemplate.name}
              </Text>
              {todayTemplate.description ? (
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text.secondary, marginTop: spacing.xs },
                  ]}
                >
                  {todayTemplate.description}
                </Text>
              ) : null}
              {todayTemplate.estimated_duration_minutes ? (
                <Text style={[typography.tiny, { color: colors.text.muted, marginTop: spacing.xs }]}>
                  ~{formatDuration(todayTemplate.estimated_duration_minutes)}
                </Text>
              ) : null}
              <Button
                title="Start Workout"
                onPress={() => handleStartWorkout(todayTemplate.id)}
                loading={isLoading}
                fullWidth
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[typography.body, { color: colors.text.secondary }]}>
                No workout scheduled for today
              </Text>
              <Button
                title="Start Empty Workout"
                variant="outline"
                onPress={() => handleStartWorkout(null)}
                loading={isLoading}
                fullWidth
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}
        </Card>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <QuickStatsRow stats={quickStats} style={{ marginBottom: spacing.lg }} />
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.quickActions, { gap: spacing.sm, marginBottom: spacing.lg }]}>
          <Pressable
            onPress={() => handleNavigate('/(tabs)/fitness/exercises')}
            accessibilityLabel="Browse exercises"
            style={[
              styles.quickActionBtn,
              { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.md },
            ]}
          >
            <Ionicons name="search-outline" size={22} color={colors.accent.primary} />
            <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
              Exercises
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleNavigate('/(tabs)/fitness/programs')}
            accessibilityLabel="View programs"
            style={[
              styles.quickActionBtn,
              { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.md },
            ]}
          >
            <Ionicons name="calendar-outline" size={22} color={colors.accent.info} />
            <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
              Programs
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleNavigate('/(tabs)/fitness/progress')}
            accessibilityLabel="View progress"
            style={[
              styles.quickActionBtn,
              { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.md },
            ]}
          >
            <Ionicons name="trending-up-outline" size={22} color={colors.accent.success} />
            <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
              Progress
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleNavigate('/(tabs)/fitness/form-check')}
            accessibilityLabel="Form check"
            style={[
              styles.quickActionBtn,
              { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.md },
            ]}
          >
            <Ionicons name="videocam-outline" size={22} color={colors.accent.warning} />
            <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
              Form Check
            </Text>
          </Pressable>
        </Animated.View>

        {/* PR Highlights */}
        {personalRecords.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
              Recent PRs
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {personalRecords.map((pr) => (
                <View
                  key={pr.id}
                  style={[
                    styles.prCard,
                    {
                      backgroundColor: colors.background.secondary,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginRight: spacing.sm,
                      borderLeftWidth: 3,
                      borderLeftColor: colors.accent.gold,
                    },
                  ]}
                >
                  <Ionicons name="trophy" size={16} color={colors.accent.gold} />
                  <Text
                    style={[
                      typography.captionBold,
                      { color: colors.text.primary, marginTop: spacing.xs },
                    ]}
                  >
                    {pr.record_type?.replace(/_/g, ' ').toUpperCase() ?? 'PR'}
                  </Text>
                  <Text style={[typography.statSmall, { color: colors.accent.gold }]}>
                    {pr.value}
                  </Text>
                  {pr.previous_record ? (
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      prev: {pr.previous_record}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Weight Chart Mini Preview */}
        {weightData.length > 1 && (
          <Card
            style={{ marginBottom: spacing.lg }}
            onPress={() => handleNavigate('/(tabs)/fitness/progress')}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="scale-outline" size={18} color={colors.accent.primary} />
              <Text style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}>
                Weight Trend
              </Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </View>
            <View style={{ marginTop: spacing.md }}>
              <WeightChart data={weightData} />
            </View>
          </Card>
        )}

        {/* Recent Workout History */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Recent Workouts
          </Text>
          {recentWorkouts.length > 0 ? (
            <FlatList<RecentWorkout>
              data={recentWorkouts}
              keyExtractor={(item) => item.id}
              renderItem={renderRecentWorkout}
              scrollEnabled={false}
            />
          ) : (
            <Card>
              <Text style={[typography.body, { color: colors.text.muted, textAlign: 'center' }]}>
                No workouts yet. Start your first one!
              </Text>
            </Card>
          )}
        </View>

        {/* More Actions */}
        <View style={[styles.moreActions, { gap: spacing.sm }]}>
          <Pressable
            onPress={() => handleNavigate('/(tabs)/fitness/pain-tracker')}
            accessibilityLabel="Open pain tracker"
            style={[
              styles.moreActionBtn,
              { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.lg },
            ]}
          >
            <Ionicons name="body-outline" size={24} color={colors.accent.danger} />
            <Text style={[typography.captionBold, { color: colors.text.primary, marginTop: spacing.sm }]}>
              Pain Tracker
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleNavigate('/(tabs)/fitness/mobility')}
            accessibilityLabel="Open mobility exercises"
            style={[
              styles.moreActionBtn,
              { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.lg },
            ]}
          >
            <Ionicons name="accessibility-outline" size={24} color={colors.accent.info} />
            <Text style={[typography.captionBold, { color: colors.text.primary, marginTop: spacing.sm }]}>
              Mobility
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => handleStartWorkout(null)}
        accessibilityLabel="Start a new workout"
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent.primary,
            shadowColor: colors.accent.primary,
          },
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutStats: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickActionBtn: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prCard: {
    minWidth: 120,
    alignItems: 'center',
  },
  moreActions: {
    flexDirection: 'row',
  },
  moreActionBtn: {
    flex: 1,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
