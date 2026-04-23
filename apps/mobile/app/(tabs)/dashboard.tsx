// =============================================================================
// TRANSFORMR -- Dashboard Screen
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  withTiming,
  withRepeat,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { MonoText } from '@components/ui/MonoText';
import { AnimatedNumber } from '@components/ui/AnimatedNumber';
import { DashboardSkeleton } from '@components/ui/ScreenSkeleton';
import { QuickActionTile } from '@components/ui/QuickActionTile';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { WeatherCard } from '@components/cards/WeatherCard';
import { PredictionAlert } from '@components/cards/PredictionAlert';
import { CountdownCard } from '@components/cards/CountdownCard';
import { QuickStatsRow } from '@components/cards/QuickStatsRow';
import { WeightChart } from '@components/charts/WeightChart';
import { SkiaSparkline } from '@components/charts/SkiaSparkline';
import { PurpleRadialBackground } from '@components/ui/PurpleRadialBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { NoiseOverlay } from '@components/ui/NoiseOverlay';
import { useProfileStore } from '@stores/profileStore';
import { useWorkoutStore } from '@stores/workoutStore';
import { useNutritionStore } from '@stores/nutritionStore';
import { useHabitStore } from '@stores/habitStore';
import { useGoalStore } from '@stores/goalStore';
import { usePartnerStore } from '@stores/partnerStore';
import { useBusinessStore } from '@stores/businessStore';
import { useInsightStore } from '@stores/insightStore';
import { useChallengeStore } from '@stores/challengeStore';
import { ActiveChallengeCard } from '@components/challenges/ActiveChallengeCard';
import { useCountdown } from '@hooks/useCountdown';
import { useScreenEntrance } from '@hooks/useScreenEntrance';
import { formatNumber, formatCurrency, formatRelativeTime } from '@utils/formatters';
import { hapticLight } from '@utils/haptics';
import { getTodayGreeting } from '@utils/greetings';
import { HelpBubble } from '@components/ui/HelpBubble';
import { LogSuccessRipple } from '@components/ui/LogSuccessRipple';
import type { LogSuccessRippleHandle } from '@components/ui/LogSuccessRipple';
import { HelpIcon } from '@components/ui/HelpIcon';
import { Coachmark } from '@components/ui/Coachmark';
import type { CoachmarkStep } from '@components/ui/Coachmark';
import { HELP } from '../../constants/helpContent';
import { SCREEN_HELP } from '../../constants/screenHelp';
import { COACHMARK_KEYS, COACHMARK_CONTENT } from '../../constants/coachmarkSteps';
import { supabase } from '../../services/supabase';
import { useFeatureGate } from '../../hooks/useFeatureGate';

// ---------------------------------------------------------------------------
// Mini sparkline component for revenue
// ---------------------------------------------------------------------------
interface SparklinePoint {
  value: number;
}

function MiniSparkline({ data, color, width = 120, height = 40 }: {
  data: SparklinePoint[]; color: string; width?: number; height?: number;
}) {
  if (data.length < 2) return null;
  return <SkiaSparkline data={data} color={color} width={width} height={height} strokeWidth={2} showFill animated />;
}

// ---------------------------------------------------------------------------
// Main Dashboard Screen
// ---------------------------------------------------------------------------
export default function DashboardScreen() {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
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
  const rippleWorkoutRef = useRef<LogSuccessRippleHandle>(null);
  const rippleMealRef = useRef<LogSuccessRippleHandle>(null);
  const rippleWeightRef = useRef<LogSuccessRippleHandle>(null);

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
  const readinessGate = useFeatureGate('readiness_score');

  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [realWeightData, setRealWeightData] = useState<{ date: string; weight: number }[]>([]);

  // Animated gradient bar (greeting section)
  const gradientBarWidth = useSharedValue(0);
  useEffect(() => {
    gradientBarWidth.value = withTiming(120, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [gradientBarWidth]);
  const gradientBarStyle = useAnimatedStyle(() => ({ width: gradientBarWidth.value }));

  // Pulsing dot for AI accountability card
  const pulseAnim = useSharedValue(1);
  useEffect(() => {
    pulseAnim.value = withRepeat(withTiming(0.3, { duration: 1000 }), -1, true);
  }, [pulseAnim]);
  const pulseDotStyle = useAnimatedStyle(() => ({ opacity: pulseAnim.value }));
  const [recentAchievements, setRecentAchievements] = useState<{ id: string; title: string; icon: string; tier: 'bronze' | 'silver' | 'gold' | 'platinum' }[]>([]);
  const [workoutsThisWeekCount, setWorkoutsThisWeekCount] = useState<number | null>(null);

  // Stores — targeted selectors to prevent unnecessary re-renders
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);

  const activeSession = useWorkoutStore((s) => s.activeSession);
  const fetchTemplates = useWorkoutStore((s) => s.fetchTemplates);

  const todayLogs = useNutritionStore((s) => s.todayLogs);
  const waterLogs = useNutritionStore((s) => s.waterLogs);
  const fetchTodayNutrition = useNutritionStore((s) => s.fetchTodayNutrition);

  const habits = useHabitStore((s) => s.habits);
  const todayCompletions = useHabitStore((s) => s.todayCompletions);
  const overallStreak = useHabitStore((s) => s.overallStreak);
  const fetchHabits = useHabitStore((s) => s.fetchHabits);

  const goals = useGoalStore((s) => s.goals);
  const fetchGoals = useGoalStore((s) => s.fetchGoals);

  const partnerProfile = usePartnerStore((s) => s.partnerProfile);
  const partnership = usePartnerStore((s) => s.partnership);
  const fetchPartnership = usePartnerStore((s) => s.fetchPartnership);

  const businesses = useBusinessStore((s) => s.businesses);
  const revenueData = useBusinessStore((s) => s.revenueData);
  const fetchBusinesses = useBusinessStore((s) => s.fetchBusinesses);

  const predictions = useInsightStore((s) => s.predictions);
  const proactiveMessages = useInsightStore((s) => s.proactiveMessages);
  const fetchAll = useInsightStore((s) => s.fetchAll);
  const dismissMessage = useInsightStore((s) => s.dismissMessage);
  const acknowledgePrediction = useInsightStore((s) => s.acknowledgePrediction);

  const activeEnrollment = useChallengeStore((s) => s.activeEnrollment);
  const challengeDefinitions = useChallengeStore((s) => s.challengeDefinitions);
  const challengeTodayLog = useChallengeStore((s) => s.todayLog);

  // Active challenge definition for dashboard card
  const activeChallengeDefinition = useMemo(
    () => challengeDefinitions.find((d) => d.id === activeEnrollment?.challenge_id) ?? null,
    [challengeDefinitions, activeEnrollment],
  );

  // Top prediction for dashboard
  const topPrediction = useMemo(
    () => predictions[0] ?? null,
    [predictions],
  );

  // Primary countdown -- uses the first active goal with a target date
  const primaryGoal = useMemo(() => {
    const now = new Date();
    const goalsWithDates = goals.filter(
      (g) => g.status === 'active' && g.target_date && new Date(g.target_date) > now,
    );
    return goalsWithDates[0] ?? null;
  }, [goals]);

  useCountdown(primaryGoal?.target_date ?? null);

  // Screen entrance choreography
  const { getEntranceStyle } = useScreenEntrance({
    sections: ['header', 'quickActions', 'statsGrid', 'aiCard', 'todaysPlan'],
  });

  // Top 3 habits by streak
  const top3Streaks = useMemo(() => {
    return habits
      .filter((h) => h.is_active !== false && (h.current_streak ?? 0) > 0)
      .sort((a, b) => (b.current_streak ?? 0) - (a.current_streak ?? 0))
      .slice(0, 3);
  }, [habits]);

  // Streak from computed overallStreak (consecutive days with ≥1 completion).
  // Null before first fetch — renders as '—' in UI.
  const currentStreak: number | null = overallStreak;

  // Workouts this week — real completed session count from Supabase
  const workoutsThisWeek = workoutsThisWeekCount ?? 0;

  // Calories today
  const caloriesToday = useMemo(() => {
    return todayLogs.reduce((sum, log) => sum + (log.calories ?? 0), 0);
  }, [todayLogs]);

  // Protein today
  const proteinToday = useMemo(() => {
    return todayLogs.reduce((sum, log) => sum + (log.protein ?? 0), 0);
  }, [todayLogs]);

  // Water today (oz)
  const waterOzToday = useMemo(() => {
    return waterLogs.reduce((sum, log) => sum + (log.amount_oz ?? 0), 0);
  }, [waterLogs]);

  // Workout done today
  const workoutDoneToday = useMemo(() => {
    return !!activeSession?.completed_at;
  }, [activeSession]);

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
    const msgs = proactiveMessages.filter(
      (m) =>
        m.category.startsWith('accountability_') &&
        !m.is_dismissed,
    );
    return msgs[0] ?? null;
  }, [proactiveMessages]);

  // Habits remaining today
  const habitsRemaining = useMemo(() => {
    const totalActive = habits.filter((h) => h.is_active !== false).length;
    const completedToday = todayCompletions.length;
    return Math.max(0, totalActive - completedToday);
  }, [habits, todayCompletions]);

  // Weight data for sparkline — real data when available, profile fallback otherwise
  const weightData = useMemo(() => {
    if (realWeightData.length > 0) return realWeightData;
    if (!profile?.current_weight) return [];
    const base = profile.current_weight;
    return [{ date: new Date().toISOString().split('T')[0] as string, weight: base }];
  }, [realWeightData, profile?.current_weight]);

  // Revenue sparkline data
  const revenueSparkline = useMemo(() => {
    if (businesses.length === 0) return [];
    return revenueData.slice(-7).map((r) => ({ value: r.amount }));
  }, [businesses, revenueData]);

  // Load dashboard-specific data from Supabase
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Readiness score from edge function — only when gate is available
        if (readinessGate.isAvailable) {
          const { data: readinessData } = await supabase.functions.invoke('readiness-score', {
            body: { userId: user.id },
          });
          if (readinessData?.score != null) setReadinessScore(readinessData.score as number);
        }

        // Weight history from weight_logs
        const { data: weightLogs } = await supabase
          .from('weight_logs')
          .select('logged_at, weight_lbs')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: true })
          .limit(14);
        if (weightLogs && weightLogs.length > 0) {
          setRealWeightData(
            weightLogs.map((w: { logged_at: string; weight_lbs: number }) => ({
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
            achievements.map((a: { id: string; achievement: unknown }) => {
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
        setDashboardError('Failed to load dashboard data. Pull to refresh.');
      }
    };
    void loadDashboardData();
  }, [readinessGate.isAvailable]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setDashboardError(null);
    await hapticLight();
    await Promise.allSettled([
      fetchProfile(),
      fetchGoals(),
      fetchHabits(),
      fetchTodayNutrition(),
      fetchTemplates(),
      fetchPartnership(),
      fetchBusinesses(),
      fetchAll(),
    ]);
    setRefreshing(false);
  }, [fetchProfile, fetchGoals, fetchHabits, fetchTodayNutrition, fetchTemplates, fetchPartnership, fetchBusinesses, fetchAll]);

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
        icon: (
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.dim.fire, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="flame" size={18} color={colors.accent.fire} />
          </View>
        ),
        label: 'Streak',
        valueNode: <MonoText variant="monoBody" color={colors.accent.fire}>{currentStreak !== null ? `${currentStreak}d` : '—'}</MonoText>,
        value: currentStreak !== null ? `${currentStreak}d` : '—',
        glowColor: colors.accent.fire,
        accentColor: colors.accent.fire,
      },
      {
        icon: (
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.dim.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="barbell" size={18} color={colors.accent.primary} />
          </View>
        ),
        label: 'Workouts',
        valueNode: <MonoText variant="monoBody" color={colors.accent.primary}>{String(workoutsThisWeek)}</MonoText>,
        value: String(workoutsThisWeek),
        glowColor: colors.accent.primary,
        accentColor: colors.accent.primary,
      },
      {
        icon: (
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.dim.success, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="nutrition" size={18} color={colors.accent.success} />
          </View>
        ),
        label: 'Calories',
        valueNode: <MonoText variant="monoBody" color={colors.accent.success}>{formatNumber(caloriesToday)}</MonoText>,
        value: formatNumber(caloriesToday),
        glowColor: colors.accent.success,
        accentColor: colors.accent.success,
      },
      {
        icon: (
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.dim.cyan, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="pulse" size={18} color={colors.accent.cyan} />
          </View>
        ),
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
    bronze: '#CD7F32', /* brand-ok */
    silver: '#C0C0C0', /* brand-ok */
    gold: colors.accent.gold,
    diamond: '#B9F2FF', /* brand-ok */
  };

  if (initialLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background.primary} />
      <PurpleRadialBackground />
      <NoiseOverlay />
      <ScrollView
        style={styles.container}
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
      <Animated.View style={getEntranceStyle('header')}>
      <Animated.View
        entering={FadeInDown.delay(0).duration(800)}
        style={{ marginBottom: spacing.xl }}
      >
        <View ref={greetingRef} onLayout={measureCoachmarks} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Text
            style={[
              typography.h1,
              { color: colors.text.primary, lineHeight: 40, marginBottom: spacing.sm, flex: 1, paddingRight: 8 },
            ]}
          >
            {greetingWithName}
          </Text>
          <HelpIcon content={SCREEN_HELP.dashboard} size={20} style={{ marginTop: 4 }} />
        </View>
        {/* Animated brand gradient bar */}
        <View style={{ height: 3, marginBottom: spacing.sm, overflow: 'hidden', borderRadius: 2 }}>
          <Animated.View style={[{ height: 3, borderRadius: 2, overflow: 'hidden' }, gradientBarStyle]}>
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.cyan, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
        <Text style={[typography.caption, { color: colors.accent.primary }]}>
          {motivationalGreeting.timeLabel}
        </Text>
        <Text style={[typography.caption, { color: colors.text.secondary }]}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Animated.View>
      </Animated.View>
      <HelpBubble id="dashboard_greeting" message="Pull down to refresh your daily briefing" position="below" />

      {/* Quick Actions — placed here so they're always above the ChatFAB */}
      <Animated.View style={getEntranceStyle('quickActions')}>
      <Animated.View entering={FadeInDown.delay(30).duration(400)}>
        <View ref={quickActionsRef} style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, justifyContent: 'center', alignItems: 'stretch' }}>
          <LogSuccessRipple ref={rippleWorkoutRef}>
            <QuickActionTile
              icon="barbell-outline"
              label="Log Workout"
              accentColor={colors.accent.primary}
              dimColor={colors.dim.primary}
              onPress={() => {
                rippleWorkoutRef.current?.trigger();
                router.push('/(tabs)/fitness' as never);
              }}
            />
          </LogSuccessRipple>
          <LogSuccessRipple ref={rippleMealRef}>
            <QuickActionTile
              icon="restaurant-outline"
              label="Log Meal"
              accentColor={colors.accent.success}
              dimColor={colors.dim.success}
              onPress={() => {
                rippleMealRef.current?.trigger();
                router.push('/(tabs)/nutrition/add-food' as never);
              }}
            />
          </LogSuccessRipple>
          <LogSuccessRipple ref={rippleWeightRef}>
            <QuickActionTile
              icon="scale-outline"
              label="Log Weight"
              accentColor={colors.accent.info}
              dimColor={colors.dim.info}
              onPress={() => {
                rippleWeightRef.current?.trigger();
                router.push('/(tabs)/profile' as never);
              }}
            />
          </LogSuccessRipple>
        </View>
      </Animated.View>
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
                <Animated.View
                  style={[
                    {
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.accent.cyan,
                    },
                    pulseDotStyle,
                  ]}
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
                  void dismissMessage(accountabilityMessage.id);
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
      <Animated.View style={getEntranceStyle('aiCard')}>
      <View ref={aiCardRef}>
        <AIInsightCard screenKey="dashboard" style={{ marginBottom: spacing.md }} />
      </View>
      </Animated.View>

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
            onDismiss={() => void acknowledgePrediction(topPrediction.id)}
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
            onPress={() => router.push('/trajectory' as never)}
            accessibilityLabel="Set your countdown goal"
            accessibilityRole="button"
            style={{
              backgroundColor: colors.dim.primary,
              borderRadius: borderRadius.xl,
              borderWidth: 1.5,
              borderColor: `${colors.accent.primary}50`,
              padding: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
            }}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.accent.primary,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.accent.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 6,
            }}>
              <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.text.primary }]}>Set Your Countdown Goal</Text>
              <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]}>Every transformation needs a deadline. Set yours.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
          </Pressable>
        </Animated.View>
      )}

      {/* Active Challenge Card */}
      {activeEnrollment && activeChallengeDefinition && (
        <Animated.View entering={FadeInDown.delay(75).duration(400)}>
          <ActiveChallengeCard
            definition={activeChallengeDefinition}
            enrollment={activeEnrollment}
            todayLog={challengeTodayLog}
            onPress={() => router.push('/(tabs)/goals/challenge-active')}
            style={{ marginBottom: spacing.lg }}
          />
        </Animated.View>
      )}

      {/* Quick Stats Row */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <QuickStatsRow stats={quickStats} style={{ marginBottom: spacing.lg }} />
      </Animated.View>

      {/* Stats Grid — calories, protein, water, workout */}
      <Animated.View style={getEntranceStyle('statsGrid')}>
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
              <Ionicons
                name={workoutDoneToday ? 'checkmark-circle' : 'time-outline'}
                size={22}
                color={workoutDoneToday ? colors.accent.success : colors.text.muted}
              />
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
      </Animated.View>

      {/* Top 3 Streaks */}
      {top3Streaks.length > 0 && (
        <Animated.View entering={FadeInDown.delay(130).duration(400)}>
          <Card
            variant="default"
            style={{ marginBottom: spacing.lg }}
            header={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="flame" size={18} color={colors.accent.fire} />
                <Text style={[typography.h3, { color: colors.text.primary }]}>Top Streaks</Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="flame" size={14} color={colors.accent.fire} />
                  <MonoText variant="monoCaption" color={colors.accent.fire}>
                    {String(habit.current_streak ?? 0)}
                  </MonoText>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

      {/* Today's Plan */}
      <Animated.View style={getEntranceStyle('todaysPlan')}>
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
            icon="barbell"
            iconColor={colors.accent.primary}
            label="Workout"
            detail={activeSession ? 'In progress' : 'Scheduled'}
            done={!!activeSession?.completed_at}
          />
          <PlanRow
            icon="restaurant"
            iconColor={colors.accent.success}
            label="Meals logged"
            detail={`${todayLogs.length}/4`}
            done={todayLogs.length >= 4}
            mono
          />
          <PlanRow
            icon="checkmark-circle-outline"
            iconColor={colors.accent.info}
            label="Habits remaining"
            detail={`${habitsRemaining} left`}
            done={habitsRemaining === 0}
            mono
          />
        </Card>
      </Animated.View>
      </Animated.View>

      {/* Partner Card */}
      {partnerProfile && (
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
                  {partnerProfile.display_name}
                </Text>
                <Text
                  style={[typography.caption, { color: colors.text.secondary }]}
                >
                  Joint streak:{' '}
                  <MonoText variant="monoCaption">{partnership?.joint_streak ?? 0}</MonoText> days
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
      {revenueSparkline.length > 0 && (
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
                    revenueSparkline.reduce((s, r) => s + r.value, 0),
                  )}
                </Text>
              </View>
            }
          >
            <MiniSparkline
              data={revenueSparkline}
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
    </View>
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
      <AnimatedNumber
        value={logged}
        style={[typography.monoBody, { color: colors.text.primary }]}
      />
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
  icon,
  iconColor,
  label,
  detail,
  done,
  mono = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
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
      <Ionicons name={icon} size={20} color={iconColor} style={{ marginRight: spacing.sm }} />
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
