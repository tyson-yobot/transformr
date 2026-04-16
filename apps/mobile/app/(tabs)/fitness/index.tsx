// =============================================================================
// TRANSFORMR -- Fitness Home Screen
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { MonoText } from '@components/ui/MonoText';
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { WeightChart } from '@components/charts/WeightChart';
import { useWorkoutStore } from '@stores/workoutStore';
import { formatVolume, formatRelativeTime, formatDuration } from '@utils/formatters';
import { hapticLight } from '@utils/haptics';
import type { PersonalRecord } from '@app-types/database';
import { HelpBubble } from '@components/ui/HelpBubble';
import { supabase } from '@services/supabase';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { PurpleRadialBackground } from '@components/ui/PurpleRadialBackground';

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

const QUICK_ACTIONS = [
  { label: 'Exercises', iconName: 'search-outline' as const, colorKey: 'primary' as const, route: '/(tabs)/fitness/exercises', a11y: 'Browse exercises' },
  { label: 'Programs',  iconName: 'calendar-outline' as const, colorKey: 'info' as const,    route: '/(tabs)/fitness/programs',  a11y: 'View programs' },
  { label: 'Progress',  iconName: 'trending-up-outline' as const, colorKey: 'success' as const, route: '/(tabs)/fitness/progress', a11y: 'View progress' },
  { label: 'Form Check', iconName: 'videocam-outline' as const, colorKey: 'warning' as const, route: '/(tabs)/fitness/form-check', a11y: 'Form check' },
] as const;

export default function FitnessHomeScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
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

  const todayTemplate = (() => {
    const dayOfWeek = new Date().getDay();
    return templates.find((t) => t.day_of_week === dayOfWeek) ?? null;
  })();

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
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.fitnessHome} />,
    });
  }, [navigation]);

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

  const accentForKey = (key: typeof QUICK_ACTIONS[number]['colorKey']) => {
    switch (key) {
      case 'primary': return colors.accent.primary;
      case 'info':    return colors.accent.info;
      case 'success': return colors.accent.success;
      case 'warning': return colors.accent.warning;
    }
  };

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
      <PurpleRadialBackground />
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
                <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.lg }]}>
                  Start a program to get guided workouts, or jump into a custom session.
                </Text>
                <Pressable
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.accent.primary, borderRadius: borderRadius.md },
                  ]}
                  onPress={() => handleNavigate('/(tabs)/fitness/programs')}
                  accessibilityLabel="Browse workout programs"
                >
                  <Text style={[typography.bodyBold, { color: colors.text.inverse }]}>
                    Browse Programs
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.secondaryButton,
                    { borderColor: colors.accent.primary, borderRadius: borderRadius.md },
                  ]}
                  onPress={() => handleStartWorkout(null)}
                  accessibilityLabel="Start empty workout"
                >
                  <Text style={[typography.bodyBold, { color: colors.accent.primary }]}>
                    Start Empty Workout
                  </Text>
                </Pressable>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <View style={[styles.statsRow, { gap: spacing.sm, marginBottom: spacing.lg }]}>
            {/* Weekly Volume */}
            <Pressable
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  borderColor: colors.background.tertiary,
                },
              ]}
              onPress={() => handleNavigate('/(tabs)/fitness/progress')}
              accessibilityLabel={`Weekly volume: ${formatVolume(weeklyVolume)}`}
            >
              <Ionicons name="barbell-outline" size={18} color={colors.accent.primary} />
              <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                {weeklyVolume > 0 ? formatVolume(weeklyVolume) : '—'}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center' }]}>
                Weekly Volume
              </Text>
              {weeklyVolume === 0 && (
                <Text style={[typography.tiny, { color: colors.accent.primary, marginTop: 2 }]}>
                  Log a workout
                </Text>
              )}
            </Pressable>

            {/* This Week */}
            <Pressable
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  borderColor: colors.background.tertiary,
                },
              ]}
              onPress={() => handleNavigate('/(tabs)/fitness/progress')}
              accessibilityLabel={`Workouts this week: ${workoutsThisWeek}`}
            >
              <Ionicons name="fitness-outline" size={18} color={colors.accent.success} />
              <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                {workoutsThisWeek > 0 ? String(workoutsThisWeek) : '—'}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center' }]}>
                This Week
              </Text>
              {workoutsThisWeek === 0 && (
                <Text style={[typography.tiny, { color: colors.accent.primary, marginTop: 2 }]}>
                  Log a workout
                </Text>
              )}
            </Pressable>

            {/* Streak */}
            <Pressable
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  borderColor: colors.background.tertiary,
                },
              ]}
              onPress={() => handleNavigate('/(tabs)/fitness/progress')}
              accessibilityLabel={`Current streak: ${currentStreak} days`}
            >
              <Ionicons name="flame-outline" size={18} color={colors.accent.fire} />
              <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                {currentStreak > 0 ? `${currentStreak}d` : '—'}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center' }]}>
                Streak
              </Text>
              {currentStreak === 0 && (
                <Text style={[typography.tiny, { color: colors.accent.primary, marginTop: 2 }]}>
                  Build one
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.quickActions, { gap: spacing.sm, marginBottom: spacing.lg }]}
        >
          {QUICK_ACTIONS.map((action) => {
            const color = accentForKey(action.colorKey);
            return (
              <Pressable
                key={action.label}
                onPress={() => handleNavigate(action.route)}
                accessibilityLabel={action.a11y}
                style={[
                  styles.quickActionBtn,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    borderColor: colors.background.tertiary,
                    padding: spacing.md,
                  },
                ]}
              >
                <View
                  style={[
                    styles.quickActionIconWrap,
                    { backgroundColor: `${color}20`, borderRadius: 10 },
                  ]}
                >
                  <Ionicons name={action.iconName} size={20} color={color} />
                </View>
                <Text style={[typography.tiny, { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs }]}>
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>
        <HelpBubble id="fitness_programs" message="Follow a program for structured training" position="below" />

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
          <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
            <Text style={[typography.h3, { color: colors.text.primary, flex: 1 }]}>
              Recent Workouts
            </Text>
            {recentWorkouts.length > 0 && (
              <Pressable onPress={() => handleNavigate('/(tabs)/fitness/progress')}>
                <Text style={[typography.captionBold, { color: colors.accent.primary }]}>
                  See all →
                </Text>
              </Pressable>
            )}
          </View>
          {recentWorkouts.length > 0 ? (
            <FlatList<RecentWorkout>
              data={recentWorkouts}
              keyExtractor={(item) => item.id}
              renderItem={renderRecentWorkout}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyStateIcon,
                  { backgroundColor: `${colors.accent.primary}15`, borderRadius: 40 },
                ]}
              >
                <Text style={{ fontSize: 40 }}>🏆</Text>
              </View>
              <Text style={[typography.h2, { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm }]}>
                Your journey starts here
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
                ]}
              >
                Every rep you log becomes your baseline. Your first workout is the most important one.
              </Text>
              <Pressable
                style={[
                  styles.emptyStateCTA,
                  {
                    backgroundColor: colors.accent.primary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                onPress={() => handleStartWorkout(null)}
                accessibilityLabel="Log your first workout"
              >
                <Text style={[typography.bodyBold, { color: colors.text.inverse }]}>
                  Log Your First Workout →
                </Text>
              </Pressable>
            </View>
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
        <Ionicons name="add" size={28} color={colors.text.inverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  // Stats row
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    minHeight: 84,
    borderWidth: 1,
    gap: 2,
  },
  // Quick actions
  quickActions: {
    flexDirection: 'row',
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 76,
  },
  quickActionIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Today's workout buttons
  primaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: 8,
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
  },
  // PR card
  prCard: {
    minWidth: 120,
    alignItems: 'center',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateCTA: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // More actions
  moreActions: {
    flexDirection: 'row',
  },
  moreActionBtn: {
    flex: 1,
    alignItems: 'center',
  },
  // FAB
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
