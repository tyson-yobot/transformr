// =============================================================================
// TRANSFORMR -- Dashboard Screen
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { ProgressBar } from '@components/ui/ProgressBar';
import { CountdownCard } from '@components/cards/CountdownCard';
import { QuickStatsRow } from '@components/cards/QuickStatsRow';
import { WeightChart } from '@components/charts/WeightChart';
import { useProfileStore } from '@stores/profileStore';
import { useWorkoutStore } from '@stores/workoutStore';
import { useNutritionStore } from '@stores/nutritionStore';
import { useHabitStore } from '@stores/habitStore';
import { useGoalStore } from '@stores/goalStore';
import { usePartnerStore } from '@stores/partnerStore';
import { useBusinessStore } from '@stores/businessStore';
import { useCountdown } from '@hooks/useCountdown';
import { formatNumber, formatCalories, formatCurrency } from '@utils/formatters';
import { hapticLight } from '@utils/haptics';

// ---------------------------------------------------------------------------
// Motivation quotes pool
// ---------------------------------------------------------------------------
const MOTIVATION_QUOTES: ReadonlyArray<{ text: string; author: string }> = [
  { text: 'The body achieves what the mind believes.', author: 'Napoleon Hill' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Your limitation -- it\'s only your imagination.', author: 'AI Coach' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'AI Coach' },
  { text: 'What you do today can improve all your tomorrows.', author: 'Ralph Marston' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Every champion was once a contender who refused to give up.', author: 'Rocky Balboa' },
];

function getDailyQuote(): { text: string; author: string } {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return MOTIVATION_QUOTES[dayOfYear % MOTIVATION_QUOTES.length] as { text: string; author: string };
}

// ---------------------------------------------------------------------------
// Mini sparkline component for revenue
// ---------------------------------------------------------------------------
interface SparklinePoint {
  value: number;
}

function MiniSparkline({
  data,
  color,
  width = 120,
  height = 40,
}: {
  data: SparklinePoint[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  // Render as simple text-based representation since we are keeping it lightweight
  return (
    <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width,
          height,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 2,
        }}
      >
        {data.map((d, i) => {
          const barHeight = Math.max(4, ((d.value - min) / range) * height);
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: barHeight,
                backgroundColor: color,
                borderRadius: 2,
                opacity: 0.6 + (i / data.length) * 0.4,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Screen
// ---------------------------------------------------------------------------
export default function DashboardScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);

  // Stores
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const workoutStore = useWorkoutStore();
  const nutritionStore = useNutritionStore();
  const habitStore = useHabitStore();
  const goalStore = useGoalStore();
  const partnerStore = usePartnerStore();
  const businessStore = useBusinessStore();

  // Primary countdown -- uses the first active goal with a target date
  const primaryGoal = useMemo(() => {
    const goalsWithDates = goalStore.goals.filter(
      (g) => g.status === 'active' && g.target_date,
    );
    return goalsWithDates[0] ?? null;
  }, [goalStore.goals]);

  const countdown = useCountdown(primaryGoal?.target_date ?? null);

  // Daily quote
  const quote = useMemo(() => getDailyQuote(), []);

  // Streak from habits
  const currentStreak = useMemo(() => {
    const streaks = habitStore.habits
      .filter((h) => h.is_active !== false)
      .map((h) => h.current_streak ?? 0);
    return streaks.length > 0 ? Math.max(...streaks) : 0;
  }, [habitStore.habits]);

  // Workouts this week
  const workoutsThisWeek = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    // Count from templates as a proxy; in production this queries sessions
    return workoutStore.templates.length > 0 ? Math.min(workoutStore.templates.length, 5) : 0;
  }, [workoutStore.templates]);

  // Calories today
  const caloriesToday = useMemo(() => {
    return nutritionStore.todayLogs.reduce((sum, log) => sum + log.calories, 0);
  }, [nutritionStore.todayLogs]);

  // Readiness score placeholder
  const readinessScore = profile?.current_weight ? 78 : 0;

  // Habits remaining today
  const habitsRemaining = useMemo(() => {
    const totalActive = habitStore.habits.filter((h) => h.is_active !== false).length;
    const completedToday = habitStore.todayCompletions.length;
    return Math.max(0, totalActive - completedToday);
  }, [habitStore.habits, habitStore.todayCompletions]);

  // Weight data for sparkline
  const weightData = useMemo(() => {
    if (!profile?.current_weight) return [];
    // Generate a sample series for display; real data comes from weight logs
    const base = profile.current_weight;
    return Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0] as string,
      weight: base + Math.sin(i / 3) * 1.5 - i * 0.1,
    }));
  }, [profile?.current_weight]);

  // Revenue sparkline data
  const revenueData = useMemo(() => {
    if (businessStore.businesses.length === 0) return [];
    return businessStore.revenueData.slice(-7).map((r) => ({ value: r.amount }));
  }, [businessStore.businesses, businessStore.revenueData]);

  // Recent achievements placeholder
  const recentAchievements = useMemo(() => {
    return [
      { id: '1', title: 'First Workout', icon: '🏋️', tier: 'bronze' as const },
      { id: '2', title: '7-Day Streak', icon: '🔥', tier: 'silver' as const },
    ];
  }, []);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await hapticLight();
    await Promise.all([
      fetchProfile(),
      goalStore.fetchGoals(),
      habitStore.fetchHabits(),
      partnerStore.fetchPartnership(),
      businessStore.fetchBusinesses(),
    ]);
    setRefreshing(false);
  }, [fetchProfile, goalStore, habitStore, partnerStore, businessStore]);

  // Initial fetch
  useEffect(() => {
    void onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quick stats
  const quickStats = useMemo(
    () => [
      {
        icon: <Text style={{ fontSize: 18 }}>🔥</Text>,
        label: 'Streak',
        value: `${currentStreak}d`,
      },
      {
        icon: <Text style={{ fontSize: 18 }}>💪</Text>,
        label: 'Workouts',
        value: String(workoutsThisWeek),
      },
      {
        icon: <Text style={{ fontSize: 18 }}>🍎</Text>,
        label: 'Calories',
        value: formatNumber(caloriesToday),
      },
      {
        icon: <Text style={{ fontSize: 18 }}>⚡</Text>,
        label: 'Readiness',
        value: `${readinessScore}%`,
      },
    ],
    [currentStreak, workoutsThisWeek, caloriesToday, readinessScore],
  );

  const tierColors: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: colors.accent.gold,
    diamond: '#B9F2FF',
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + 100,
        paddingHorizontal: spacing.lg,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent.primary}
          colors={[colors.accent.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <Text
          style={[
            typography.h1,
            { color: colors.text.primary, marginBottom: spacing.xs },
          ]}
        >
          {getGreeting()}, {profile?.display_name?.split(' ')[0] ?? 'Champ'}
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.text.secondary, marginBottom: spacing.xl },
          ]}
        >
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Animated.View>

      {/* Primary Countdown */}
      {primaryGoal && primaryGoal.start_date && primaryGoal.target_date && (
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <CountdownCard
            title={primaryGoal.title}
            emoji={primaryGoal.icon ?? '🎯'}
            targetDate={primaryGoal.target_date}
            startDate={primaryGoal.start_date}
            style={{ marginBottom: spacing.lg }}
          />
        </Animated.View>
      )}

      {/* Quick Stats Row */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <QuickStatsRow stats={quickStats} style={{ marginBottom: spacing.lg }} />
      </Animated.View>

      {/* Today's Plan */}
      <Animated.View entering={FadeInDown.delay(150).duration(400)}>
        <Card
          variant="default"
          style={{ marginBottom: spacing.lg }}
          header={
            <View style={styles.cardHeaderRow}>
              <Text style={[typography.h3, { color: colors.text.primary }]}>
                Today's Plan
              </Text>
              <Badge label="In Progress" variant="info" size="sm" />
            </View>
          }
        >
          <PlanRow
            emoji="🏋️"
            label="Workout"
            detail={workoutStore.activeSession ? 'In progress' : 'Scheduled'}
            done={!!workoutStore.activeSession?.completed_at}
          />
          <PlanRow
            emoji="🍽️"
            label="Meals logged"
            detail={`${nutritionStore.todayLogs.length} / 4`}
            done={nutritionStore.todayLogs.length >= 4}
          />
          <PlanRow
            emoji="✅"
            label="Habits remaining"
            detail={`${habitsRemaining} left`}
            done={habitsRemaining === 0}
          />
        </Card>
      </Animated.View>

      {/* Partner Card */}
      {partnerStore.partnerProfile && (
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card
            variant="elevated"
            style={{ marginBottom: spacing.lg }}
            onPress={() => {
              void hapticLight();
              router.push('/partner/dashboard');
            }}
          >
            <View style={styles.partnerRow}>
              <View
                style={[
                  styles.partnerAvatar,
                  { backgroundColor: colors.accent.pink },
                ]}
              >
                <Text style={{ fontSize: 20 }}>👫</Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text
                  style={[typography.bodyBold, { color: colors.text.primary }]}
                >
                  {partnerStore.partnerProfile.display_name}
                </Text>
                <Text
                  style={[typography.caption, { color: colors.text.secondary }]}
                >
                  Joint streak: {partnerStore.partnership?.joint_streak ?? 0} days
                </Text>
              </View>
              <Text style={[typography.caption, { color: colors.accent.primary }]}>
                View →
              </Text>
            </View>
          </Card>
        </Animated.View>
      )}

      {/* Weight Sparkline */}
      {weightData.length > 0 && (
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Card
            variant="default"
            style={{ marginBottom: spacing.lg }}
            header={
              <Text style={[typography.h3, { color: colors.text.primary }]}>
                Weight Trend
              </Text>
            }
          >
            <WeightChart
              data={weightData}
              goalWeight={profile?.goal_weight}
            />
          </Card>
        </Animated.View>
      )}

      {/* Revenue Sparkline */}
      {revenueData.length > 0 && (
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Card
            variant="default"
            style={{ marginBottom: spacing.lg }}
            onPress={() => {
              void hapticLight();
              router.push('/(tabs)/goals/business' as never);
            }}
            header={
              <View style={styles.cardHeaderRow}>
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  Revenue
                </Text>
                <Text
                  style={[
                    typography.statSmall,
                    { color: colors.accent.success },
                  ]}
                >
                  {formatCurrency(
                    revenueData.reduce((s, r) => s + r.value, 0),
                  )}
                </Text>
              </View>
            }
          >
            <MiniSparkline
              data={revenueData}
              color={colors.accent.success}
              width={280}
              height={48}
            />
          </Card>
        </Animated.View>
      )}

      {/* Motivation Quote */}
      <Animated.View entering={FadeInDown.delay(350).duration(400)}>
        <Card
          variant="outlined"
          style={{ marginBottom: spacing.lg }}
        >
          <Text
            style={[
              typography.body,
              {
                color: colors.text.primary,
                fontStyle: 'italic',
                marginBottom: spacing.sm,
              },
            ]}
          >
            "{quote.text}"
          </Text>
          <Text
            style={[typography.caption, { color: colors.accent.primary }]}
          >
            -- {quote.author}
          </Text>
        </Card>
      </Animated.View>

      {/* Recent Achievements */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Card
          variant="default"
          style={{ marginBottom: spacing.lg }}
          header={
            <View style={styles.cardHeaderRow}>
              <Text style={[typography.h3, { color: colors.text.primary }]}>
                Recent Achievements
              </Text>
              <Pressable
                onPress={() => {
                  void hapticLight();
                  router.push('/(tabs)/profile/achievements');
                }}
              >
                <Text
                  style={[typography.caption, { color: colors.accent.primary }]}
                >
                  View All
                </Text>
              </Pressable>
            </View>
          }
        >
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {recentAchievements.map((ach) => (
              <View
                key={ach.id}
                style={[
                  styles.achievementBadge,
                  {
                    backgroundColor: `${tierColors[ach.tier] ?? colors.accent.primary}15`,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                  },
                ]}
              >
                <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>
                  {ach.icon}
                </Text>
                <Text
                  style={[
                    typography.tiny,
                    { color: colors.text.primary, textAlign: 'center' },
                  ]}
                  numberOfLines={2}
                >
                  {ach.title}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PlanRow({
  emoji,
  label,
  detail,
  done,
}: {
  emoji: string;
  label: string;
  detail: string;
  done: boolean;
}) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View
      style={[
        styles.planRow,
        { paddingVertical: spacing.sm, borderBottomColor: colors.border.subtle },
      ]}
    >
      <Text style={{ fontSize: 18, marginRight: spacing.sm }}>{emoji}</Text>
      <Text
        style={[
          typography.body,
          {
            color: done ? colors.text.muted : colors.text.primary,
            flex: 1,
            textDecorationLine: done ? 'line-through' : 'none',
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          typography.caption,
          { color: done ? colors.accent.success : colors.text.secondary },
        ]}
      >
        {done ? 'Done' : detail}
      </Text>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementBadge: {
    flex: 1,
    alignItems: 'center',
  },
});
