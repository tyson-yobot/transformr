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
import { MonoText } from '@components/ui/MonoText';
import { DashboardSkeleton } from '@components/ui/ScreenSkeleton';
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
import { formatNumber, formatCurrency, formatRelativeTime } from '@utils/formatters';
import { hapticLight, hapticMedium } from '@utils/haptics';
import { getTodayGreeting } from '@utils/greetings';
import { HelpBubble } from '@components/ui/HelpBubble';
import { HelpIcon } from '@components/ui/HelpIcon';
import { Coachmark } from '@components/ui/Coachmark';
import type { CoachmarkStep } from '@components/ui/Coachmark';
import { HELP } from '../../constants/helpContent';
import { SCREEN_HELP } from '../../constants/screenHelp';
import { COACHMARK_KEYS, COACHMARK_CONTENT } from '../../constants/coachmarkSteps';
import { supabase } from '../../services/supabase';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [coachmarkSteps, setCoachmarkSteps] = React.useState<CoachmarkStep[]>([]);
  const greetingRef = React.useRef<View>(null);
  const aiCardRef = React.useRef<View>(null);
  const quickActionsRef = React.useRef<View>(null);
  const statsCardRef = React.useRef<View>(null);

  const measureCoachmarks = React.useCallback(() => {
    const content = COACHMARK_CONTENT.dashboard;
    if (!content) return;
    const refs = [greetingRef, statsCardRef, aiCardRef, quickActionsRef];
    const steps: CoachmarkStep[] = [];
    let pending = refs.length;
    refs.forEach((ref, i) => {
      ref.current?.measure((x, y, width, height, pageX, pageY) => {
        const step = content[i];
        if (width > 0 && height > 0 && step) {
          steps[i] = {
            targetX: pageX,
            targetY: pageY,
            targetWidth: width,
            targetHeight: height,
            title: step.title,
            body: step.body,
            position: step.position,
          };
        }
        if (--pending === 0) setCoachmarkSteps(steps.filter(Boolean) as CoachmarkStep[]);
      });
    });
  }, []);
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [realWeightData, setRealWeightData] = useState<{ date: string; weight: number }[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<{ id: string; title: string; icon: string; tier: 'bronze' | 'silver' | 'gold' | 'platinum' }[]>([]);
  const [workoutsThisWeekCount, setWorkoutsThisWeekCount] = useState<number | null>(null);

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
    const now = new Date();
    const goalsWithDates = goalStore.goals.filter(
      (g) => g.status === 'active' && g.target_date && new Date(g.target_date) > now,
    );
    return goalsWithDates[0] ?? null;
  }, [goalStore.goals]);

  useCountdown(primaryGoal?.target_date ?? null);

  // Top 3 habits by streak
  const top3Streaks = useMemo(() => {
    return habitStore.habits
      .filter((h) => h.is_active !== false && (h.current_streak ?? 0) > 0)
      .sort((a, b) => (b.current_streak ?? 0) - (a.current_streak ?? 0))
      .slice(0, 3);
  }, [habitStore.habits]);

  // Streak from computed overallStreak (consecutive days with ≥1 completion).
  // Null before first fetch — renders as '—' in UI.
  const currentStreak: number | null = habitStore.overallStreak;

  // Workouts this week — real completed session count from Supabase
  const workoutsThisWeek = workoutsThisWeekCount ?? 0;

  // Calories today
  const caloriesToday = useMemo(() => {
    return nutritionStore.todayLogs.reduce((sum, log) => sum + (log.calories ?? 0), 0);
  }, [nutritionStore.todayLogs]);

  // Protein today
  const proteinToday = useMemo(() => {
    return nutritionStore.todayLogs.reduce((sum, log) => sum + (log.protein ?? 0), 0);
  }, [nutritionStore.todayLogs]);

  // Water today (oz)
  const waterOzToday = useMemo(() => {
    return nutritionStore.waterLogs.reduce((sum, log) => sum + (log.amount_oz ?? 0), 0);
  }, [nutritionStore.waterLogs]);

  // Workout done today
  const workoutDoneToday = useMemo(() => {
    return !!workoutStore.activeSession?.completed_at;
  }, [workoutStore.activeSession]);

  // Null until the edge function returns a real value — renders as '—' in UI
  const readinessScoreDisplay = readinessScore;

  // Greeting with user name
  const motivationalGreeting = getTodayGreeting();
  const greetingWithName = useMemo(() => {
    const firstName = profile?.display_name?.split(' ')[0] ?? '';
    return firstName ? `${motivationalGreeting.text.replace(/\.$/, '')}${firstName ? `, ${firstName}` : ''}.` : motivationalGreeting.text;
  }, [profile?.display_name, motivationalGreeting.text]);

  // Latest accountability message from AI coach
  const accountabilityMessage = useMemo(() => {
    const msgs = insightStore.proactiveMessages.filter(
      (m) =>
        m.category.startsWith('accountability_') &&
        !m.is_dismissed,
    );
    return msgs[0] ?? null;
  }, [insightStore.proactiveMessages]);

  // Habits remaining today
  const habitsRemaining = useMemo(() => {
    const totalActive = habitStore.habits.filter((h) => h.is_active !== false).length;
    const completedToday = habitStore.todayCompletions.length;
    return Math.max(0, totalActive - completedToday);
  }, [habitStore.habits, habitStore.todayCompletions]);

  // Weight data for sparkline — real data when available, profile fallback otherwise
  const weightData = useMemo(() => {
    if (realWeightData.length > 0) return realWeightData;
    if (!profile?.current_weight) return [];
    const base = profile.current_weight;
    return [{ date: new Date().toISOString().split('T')[0] as string, weight: base }];
  }, [realWeightData, profile?.current_weight]);

  // Revenue sparkline data
  const revenueData = useMemo(() => {
    if (businessStore.businesses.length === 0) return [];
    return businessStore.revenueData.slice(-7).map((r) => ({ value: r.amount }));
  }, [businessStore.businesses, businessStore.revenueData]);

  // Load dashboard-specific data from Supabase
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Readiness score from edge function
        const { data: readinessData } = await supabase.functions.invoke('readiness-score', {
          body: { userId: user.id },
        });
        if (readinessData?.score != null) setReadinessScore(readinessData.score as number);

        // Weight history from weight_logs
        const { data: weightLogs } = await supabase
          .from('weight_logs')
          .select('logged_at, weight_lbs')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: true })
          .limit(14);
        if (weightLogs && weightLogs.length > 0) {
          setRealWeightData(
            weightLogs.map((w) => ({
              date: (w.logged_at as string).split('T')[0] ?? '',
              weight: w.weight_lbs as number,
            })),
          );
        }

        // Workouts completed this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const { count: sessionCount } = await supabase
          .from('workout_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .gte('completed_at', weekStart.toISOString());
        if (sessionCount != null) setWorkoutsThisWeekCount(sessionCount);

        // Recent achievements
        const { data: achievements } = await supabase
          .from('user_achievements')
          .select('id, achievement:achievements(title, icon, tier)')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false })
          .limit(3);
        if (achievements && achievements.length > 0) {
          setRecentAchievements(
            achievements.map((a) => {
              const raw = a.achievement;
              const ach = (Array.isArray(raw) ? raw[0] : raw) as { title?: string; icon?: string; tier?: string } | null;
              return {
                id: a.id as string,
                title: ach?.title ?? 'Achievement',
                icon: ach?.icon ?? '🏆',
                tier: (ach?.tier as 'bronze' | 'silver' | 'gold' | 'platinum') ?? 'bronze',
              };
            }),
          );
        }
      } catch (err: unknown) {
        setDashboardError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      }
    };
    void loadDashboardData();
  }, []);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setDashboardError(null);
    await hapticLight();
    await Promise.allSettled([
      fetchProfile(),
      goalStore.fetchGoals(),
      habitStore.fetchHabits(),
      nutritionStore.fetchTodayNutrition(),
      workoutStore.fetchTemplates(),
      partnerStore.fetchPartnership(),
      businessStore.fetchBusinesses(),
      insightStore.fetchAll(),
    ]);
    setRefreshing(false);
  }, [fetchProfile, goalStore, habitStore, nutritionStore, workoutStore, partnerStore, businessStore, insightStore]);

  // Initial fetch — timeout ensures skeleton never hangs if network is unavailable
  useEffect(() => {
    const timeout = setTimeout(() => setInitialLoading(false), 15_000);
    void onRefresh().finally(() => {
      clearTimeout(timeout);
      setInitialLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quick stats
  const readinessColor = readinessScoreDisplay == null
    ? colors.text.muted
    : readinessScoreDisplay >= 75
      ? colors.accent.success
      : readinessScoreDisplay >= 50
        ? colors.accent.warning
        : colors.accent.danger;

  const quickStats = useMemo(
    () => [
      {
        icon: <Text style={{ fontSize: 18 }}>🔥</Text>,
        label: 'Streak',
        valueNode: <MonoText variant="monoBody" color={colors.accent.fire}>{currentStreak !== null ? `${currentStreak}d` : '—'}</MonoText>,
        value: currentStreak !== null ? `${currentStreak}d` : '—',
        glowColor: colors.accent.fire,
        accentColor: colors.accent.fire,
      },
      {
        icon: <Text style={{ fontSize: 18 }}>💪</Text>,
        label: 'Workouts',
        valueNode: <MonoText variant="monoBody" color={colors.accent.primary}>{String(workoutsThisWeek)}</MonoText>,
        value: String(workoutsThisWeek),
        glowColor: colors.accent.primary,
        accentColor: colors.accent.primary,
      },
      {
        icon: <Text style={{ fontSize: 18 }}>🍎</Text>,
        label: 'Calories',
        valueNode: <MonoText variant="monoBody" color={colors.accent.success}>{formatNumber(caloriesToday)}</MonoText>,
        value: formatNumber(caloriesToday),
        glowColor: colors.accent.success,
        accentColor: colors.accent.success,
      },
      {
        icon: <Text style={{ fontSize: 18 }}>⚡</Text>,
        label: 'Readiness',
        valueNode: <MonoText variant="monoBody" color={readinessColor}>{readinessScoreDisplay != null ? `${readinessScoreDisplay}%` : '—'}</MonoText>,
        value: readinessScoreDisplay != null ? `${readinessScoreDisplay}%` : '—',
        glowColor: readinessColor,
        accentColor: readinessColor,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStreak, workoutsThisWeek, caloriesToday, readinessScoreDisplay, readinessColor],
  );

  const tierColors: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: colors.accent.gold,
    diamond: '#B9F2FF',
  };

  if (initialLoading) {
    return <DashboardSkeleton />;
  }

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
      {/* Dashboard error banner */}
      {dashboardError && (
        <Pressable
          onPress={() => { void hapticLight(); void onRefresh(); }}
          accessibilityLabel="Retry loading dashboard data"
          style={[styles.errorBanner, { backgroundColor: colors.accent.danger + '18', borderColor: colors.accent.danger + '40' }]}
        >
          <Text style={[typography.caption, { color: colors.accent.danger }]}>
            {dashboardError}
          </Text>
          <Text style={[typography.captionBold, { color: colors.accent.danger, marginTop: spacing.xs }]}>
            Tap to retry
          </Text>
        </Pressable>
      )}

      {/* Greeting */}
      <Animated.View
        entering={FadeInDown.delay(0).duration(800)}
        style={{ marginBottom: spacing.xl }}
      >
        <View ref={greetingRef} onLayout={measureCoachmarks} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Text
            style={[
              typography.h2,
              { color: colors.text.primary, lineHeight: 32, marginBottom: spacing.sm, flex: 1, paddingRight: 8 },
            ]}
          >
            {greetingWithName}
          </Text>
          <HelpIcon content={SCREEN_HELP.dashboard} size={20} style={{ marginTop: 4 }} />
        </View>
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

      {/* Quick Actions — placed here so they're always above the ChatFAB */}
      <Animated.View entering={FadeInDown.delay(30).duration(400)}>
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <View ref={quickActionsRef} style={styles.quickActionsRow}>
            <Pressable
              onPress={() => { void hapticMedium(); router.push('/(tabs)/fitness'); }}
              accessibilityLabel="Log Workout"
              accessibilityRole="button"
              hitSlop={8}
              style={[
                styles.quickActionBtn,
                {
                  backgroundColor: colors.accent.primarySubtle,
                  borderColor: colors.accent.primary,
                  shadowColor: colors.accent.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 6,
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>💪</Text>
              <Text style={[typography.tiny, { color: colors.accent.primary, textAlign: 'center', marginTop: spacing.xs }]}>
                Log Workout
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { void hapticMedium(); router.push('/(tabs)/nutrition/add-food' as never); }}
              accessibilityLabel="Log Meal"
              accessibilityRole="button"
              hitSlop={8}
              style={[
                styles.quickActionBtn,
                {
                  backgroundColor: colors.accent.successSubtle,
                  borderColor: colors.accent.success,
                  shadowColor: colors.accent.success,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 6,
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>🍽️</Text>
              <Text style={[typography.tiny, { color: colors.accent.success, textAlign: 'center', marginTop: spacing.xs }]}>
                Log Meal
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { void hapticMedium(); router.push('/(tabs)/profile' as never); }}
              accessibilityLabel="Log Weight"
              accessibilityRole="button"
              hitSlop={8}
              style={[
                styles.quickActionBtn,
                {
                  backgroundColor: colors.accent.cyanSubtle,
                  borderColor: colors.accent.cyan,
                  shadowColor: colors.accent.cyan,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 6,
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>⚖️</Text>
              <Text style={[typography.tiny, { color: colors.accent.cyan, textAlign: 'center', marginTop: spacing.xs }]}>
                Log Weight
              </Text>
            </Pressable>
          </View>
        </Card>
      </Animated.View>

      {/* Daily Accountability Card */}
      {accountabilityMessage && (
        <Animated.View
          entering={FadeInDown.delay(50).duration(600)}
          style={{ marginBottom: spacing.md }}
        >
          <Card
            variant="ai"
            borderAccent
            style={{
              shadowColor: colors.accent.cyan,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.20,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.accent.cyan,
                  }}
                />
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.accent.cyan, marginLeft: spacing.xs },
                  ]}
                >
                  AI COACH
                </Text>
              </View>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>
                {formatRelativeTime(accountabilityMessage.created_at)}
              </Text>
            </View>

            <Text
              style={[
                typography.bodyBold,
                { color: colors.text.primary, marginTop: spacing.xs },
              ]}
            >
              {accountabilityMessage.title}
            </Text>

            <Text
              style={[
                typography.body,
                {
                  color: colors.text.secondary,
                  marginTop: spacing.xs,
                  lineHeight: 22,
                },
              ]}
            >
              {accountabilityMessage.body}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
              <Pressable
                onPress={() => {
                  void hapticLight();
                  router.push('/chat');
                }}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  backgroundColor: `${colors.accent.cyan}20`,
                  borderWidth: 1,
                  borderColor: colors.accent.cyan,
                  borderRadius: borderRadius.sm,
                }}
                accessibilityRole="button"
                accessibilityLabel="Talk to Coach"
              >
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.accent.cyan },
                  ]}
                >
                  Talk to Coach
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void hapticLight();
                  void insightStore.dismissMessage(accountabilityMessage.id);
                }}
                style={{ padding: spacing.xs }}
                accessibilityRole="button"
                accessibilityLabel="Dismiss accountability message"
              >
                <Text style={[typography.caption, { color: colors.text.muted }]}>
                  Dismiss
                </Text>
              </Pressable>
            </View>
          </Card>
        </Animated.View>
      )}

      {/* Weather */}
      <WeatherCard style={{ marginBottom: spacing.md }} />

      {/* AI Insight */}
      <View ref={aiCardRef}>
        <AIInsightCard screenKey="dashboard" style={{ marginBottom: spacing.md }} />
      </View>

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
      {primaryGoal && primaryGoal.start_date && primaryGoal.target_date ? (
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <CountdownCard
            title={primaryGoal.title}
            emoji={primaryGoal.icon ?? '🎯'}
            targetDate={primaryGoal.target_date}
            startDate={primaryGoal.start_date}
            style={{ marginBottom: spacing.lg }}
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={{ marginBottom: spacing.lg }}>
          <Pressable
            onPress={() => { void hapticMedium(); router.push('/(tabs)/goals'); }}
            accessibilityLabel="Set your goal deadline"
            accessibilityRole="button"
          >
            <Card
              style={{
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.accent.primary + '60',
                backgroundColor: colors.accent.primary + '08',
                alignItems: 'center',
                paddingVertical: spacing.xl,
              }}
            >
              <Text style={{ fontSize: 28, marginBottom: spacing.sm }}>🎯</Text>
              <Text style={[typography.bodyBold, { color: colors.accent.primary, marginBottom: spacing.xs }]}>
                Set Your Goal Deadline
              </Text>
              <Text style={[typography.caption, { color: colors.text.secondary }]}>
                Add a target date to track your countdown
              </Text>
            </Card>
          </Pressable>
        </Animated.View>
      )}

      {/* Quick Stats Row */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <QuickStatsRow stats={quickStats} style={{ marginBottom: spacing.lg }} />
      </Animated.View>

      {/* Stats Grid — calories, protein, water, workout */}
      <Animated.View entering={FadeInDown.delay(110).duration(400)}>
        <View ref={statsCardRef}>
        <Card
          variant="default"
          style={{ marginBottom: spacing.lg }}
          header={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[typography.h3, { color: colors.text.primary }]}>Today's Stats</Text>
              <HelpIcon content={HELP.readinessScore} size={14} />
            </View>
          }
        >
          <View style={styles.statsGrid}>
            <StatsCell
              label="Calories"
              logged={caloriesToday}
              target={profile?.daily_calorie_target ?? 2000}
              unit="kcal"
            />
            <StatsCell
              label="Protein"
              logged={Math.round(proteinToday)}
              target={profile?.daily_protein_target ?? 150}
              unit="g"
            />
            <StatsCell
              label="Water"
              logged={Math.round(waterOzToday)}
              target={profile?.daily_water_target_oz ?? 64}
              unit="oz"
            />
            <View style={styles.statsCell}>
              <Text
                style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.xs }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Workout
              </Text>
              <Text style={{ fontSize: 20 }}>{workoutDoneToday ? '✅' : '⏳'}</Text>
              <Text
                style={[typography.caption, { color: workoutDoneToday ? colors.accent.success : colors.text.muted }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {workoutDoneToday ? 'Done' : 'Pending'}
              </Text>
            </View>
          </View>
        </Card>
        </View>
      </Animated.View>

      {/* Top 3 Streaks */}
      {top3Streaks.length > 0 && (
        <Animated.View entering={FadeInDown.delay(130).duration(400)}>
          <Card
            variant="default"
            style={{ marginBottom: spacing.lg }}
            header={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[typography.h3, { color: colors.text.primary }]}>Top Streaks 🔥</Text>
                <HelpIcon content={HELP.streakCounter} size={14} />
              </View>
            }
          >
            {top3Streaks.map((habit) => (
              <View
                key={habit.id}
                style={[styles.streakRow, { borderBottomColor: colors.border.subtle }]}
              >
                <Text style={{ fontSize: 20, marginRight: spacing.sm }}>
                  {habit.icon ?? '🔥'}
                </Text>
                <Text style={[typography.body, { color: colors.text.primary, flex: 1 }]}>
                  {habit.name}
                </Text>
                <MonoText variant="monoBody" color={colors.accent.warning}>
                  {`🔥 ${habit.current_streak ?? 0}`}
                </MonoText>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

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
            variant="partner"
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[typography.h3, { color: colors.text.primary }]}>
                    Revenue
                  </Text>
                  <HelpIcon content={HELP.revenueLog} size={14} />
                </View>
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
          {recentAchievements.length === 0 ? (
            <Text style={[typography.caption, { color: colors.text.muted }]}>
              Keep logging workouts, meals, and habits — your first achievement is closer than you think.
            </Text>
          ) : null}
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
      <Coachmark screenKey={COACHMARK_KEYS.dashboard} steps={coachmarkSteps} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatsCell({
  label,
  logged,
  target,
  unit,
}: {
  label: string;
  logged: number;
  target: number;
  unit: string;
}) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={styles.statsCell}>
      <Text
        style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.xs }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
      <MonoText variant="monoBody" color={colors.text.primary} numberOfLines={1} adjustsFontSizeToFit>
        {formatNumber(logged)}
      </MonoText>
      <Text
        style={[typography.tiny, { color: colors.text.muted }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {`/ ${formatNumber(target)} ${unit}`}
      </Text>
    </View>
  );
}

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
  errorBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 72,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
