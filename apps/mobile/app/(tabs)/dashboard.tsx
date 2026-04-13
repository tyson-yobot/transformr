// =============================================================================
// TRANSFORMR -- Dashboard Screen
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { MonoText } from '@components/ui/MonoText';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { WeatherCard } from '@components/cards/WeatherCard';
import { PredictionAlert } from '@components/cards/PredictionAlert';
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
import { useInsightStore } from '@stores/insightStore';
import { useCountdown } from '@hooks/useCountdown';
import { formatNumber, formatCurrency } from '@utils/formatters';
import { hapticLight } from '@utils/haptics';
import { getTodayGreeting } from '@utils/greetings';
import { HelpBubble } from '@components/ui/HelpBubble';

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
  const insightStore = useInsightStore();

  // Top prediction for dashboard
  const topPrediction = useMemo(
    () => insightStore.predictions[0] ?? null,
    [insightStore.predictions],
  );

  // Primary countdown -- uses the first active goal with a target date
  const primaryGoal = useMemo(() => {
    const goalsWithDates = goalStore.goals.filter(
      (g) => g.status === 'active' && g.target_date,
    );
    return goalsWithDates[0] ?? null;
  }, [goalStore.goals]);

  useCountdown(primaryGoal?.target_date ?? null);

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

  // Motivational greeting — rotates by day, adapts to time of day
  const motivationalGreeting = getTodayGreeting();

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
      insightStore.fetchAll(),
    ]);
    setRefreshing(false);
  }, [fetchProfile, goalStore, habitStore, partnerStore, businessStore, insightStore]);

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
        valueNode: <MonoText variant="monoBody">{currentStreak}d</MonoText>,
        value: `${currentStreak}d`,
      },
      {
        icon: <Text style={{ fontSize: 18 }}>💪</Text>,
        label: 'Workouts',
        valueNode: <MonoText variant="monoBody">{workoutsThisWeek}</MonoText>,
        value: String(workoutsThisWeek),
      },
      {
        icon: <Text style={{ fontSize: 18 }}>🍎</Text>,
        label: 'Calories',
        valueNode: <MonoText variant="monoBody">{formatNumber(caloriesToday)}</MonoText>,
        value: formatNumber(caloriesToday),
      },
      {
        icon: <Text style={{ fontSize: 18 }}>⚡</Text>,
        label: 'Readiness',
        valueNode: <MonoText variant="monoBody">{readinessScore}%</MonoText>,
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
      {/* Motivational Greeting */}
      <Animated.View
        entering={FadeInDown.delay(0).duration(800)}
        style={{ marginBottom: spacing.xl }}
      >
        <Text
          style={[
            typography.h2,
            { color: colors.text.primary, lineHeight: 32, marginBottom: spacing.sm },
          ]}
        >
          {motivationalGreeting.text}
        </Text>
        <Text style={[typography.caption, { color: colors.text.secondary }]}>
          {motivationalGreeting.timeLabel}
          {' — '}
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Animated.View>
      <HelpBubble id="dashboard_greeting" message="Pull down to refresh your daily briefing" position="below" />

      {/* Weather */}
      <WeatherCard style={{ marginBottom: spacing.md }} />

      {/* AI Insight */}
      <AIInsightCard screenKey="dashboard" style={{ marginBottom: spacing.md }} />

      {/* Top Prediction Alert */}
      {topPrediction && (
        <Animated.View entering={FadeInDown.delay(25).duration(400)}>
          <PredictionAlert
            title={topPrediction.title}
            body={topPrediction.body}
            severity={topPrediction.severity}
            category={topPrediction.category}
            confidence={topPrediction.confidence}
            actionLabel={topPrediction.action_label}
            actionRoute={topPrediction.action_route}
            onDismiss={() => void insightStore.acknowledgePrediction(topPrediction.id)}
            style={{ marginBottom: spacing.md }}
          />
        </Animated.View>
      )}

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
            detail={`${nutritionStore.todayLogs.length}/4`}
            done={nutritionStore.todayLogs.length >= 4}
            mono
          />
          <PlanRow
            emoji="✅"
            label="Habits remaining"
            detail={`${habitsRemaining} left`}
            done={habitsRemaining === 0}
            mono
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
                  Joint streak:{' '}
                  <MonoText variant="monoCaption">{partnerStore.partnership?.joint_streak ?? 0}</MonoText> days
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

      {/* AI Insight */}
      <Animated.View entering={FadeInDown.delay(350).duration(400)}>
        <Card variant="ai" style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.body, { color: colors.text.primary }]}>
            Based on your data, here's your insight for today.
          </Text>
          <Text style={[typography.caption, { color: colors.accent.cyan, marginTop: spacing.sm }]}>
            AI Coach
          </Text>
        </Card>
      </Animated.View>
      <HelpBubble id="dashboard_fab" message="Tap the purple button to chat with your AI coach" position="below" />

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
                accessibilityLabel="View all achievements"
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
  mono = false,
}: {
  emoji: string;
  label: string;
  detail: string;
  done: boolean;
  mono?: boolean;
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
      {mono && !done ? (
        <MonoText
          variant="monoCaption"
          color={colors.text.secondary}
        >
          {detail}
        </MonoText>
      ) : (
        <Text
          style={[
            typography.caption,
            { color: done ? colors.accent.success : colors.text.secondary },
          ]}
        >
          {done ? 'Done' : detail}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accountabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountabilityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  accountabilityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coachButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
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
