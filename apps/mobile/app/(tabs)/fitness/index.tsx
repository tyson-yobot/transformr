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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Barbell, CalendarDots, TrendUp, VideoCamera, PersonSimpleRun, Storefront, Camera, FirstAidKit, CaretRight, Fire, Trophy, Scales, Plus } from 'phosphor-react-native';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { MonoText } from '@components/ui/MonoText';
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { WeightChart } from '@components/charts/WeightChart';
import { useWorkoutStore } from '@stores/workoutStore';
import { useScreenEntrance } from '@hooks/useScreenEntrance';
import { formatVolume, formatRelativeTime, formatDuration } from '@utils/formatters';
import { hapticLight } from '@utils/haptics';
import type { PersonalRecord } from '@app-types/database';
import { HelpBubble } from '@components/ui/HelpBubble';
import { supabase } from '@services/supabase';
import { SpotifyMiniPlayer } from '@components/ui/SpotifyMiniPlayer';
import { addWorkoutToCalendar } from '@services/calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { LinearGradient } from 'expo-linear-gradient';
import { PurpleRadialBackground } from '@components/ui/PurpleRadialBackground';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { HeroCard } from '@components/ui/HeroCard';
import { HERO_IMAGES } from '@services/heroImagePreloader';

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

const FITNESS_NAV_CARDS = [
  {
    label: 'Exercises',
    icon: 'barbell' as keyof typeof Ionicons.glyphMap,
    iconColor: '#A855F7',
    phosphorIcon: Barbell,
    gradient: ['rgba(168,85,247,0.15)', 'rgba(168,85,247,0.05)'] as [string, string],
    description: '100+ exercises with anatomy',
    route: '/(tabs)/fitness/exercises',
    a11y: 'Browse exercises',
  },
  {
    label: 'Programs',
    icon: 'calendar' as keyof typeof Ionicons.glyphMap,
    iconColor: '#06B6D4',
    phosphorIcon: CalendarDots,
    gradient: ['rgba(6,182,212,0.15)', 'rgba(6,182,212,0.05)'] as [string, string],
    description: 'AI-adaptive training blocks',
    route: '/(tabs)/fitness/programs',
    a11y: 'View programs',
  },
  {
    label: 'Progress',
    icon: 'trending-up' as keyof typeof Ionicons.glyphMap,
    iconColor: '#10B981',
    phosphorIcon: TrendUp,
    gradient: ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)'] as [string, string],
    description: 'Charts, PRs, body metrics',
    route: '/(tabs)/fitness/progress',
    a11y: 'View progress',
  },
  {
    label: 'Form Check',
    icon: 'videocam' as keyof typeof Ionicons.glyphMap,
    iconColor: '#F59E0B',
    phosphorIcon: VideoCamera,
    gradient: ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)'] as [string, string],
    description: 'AI frame-by-frame analysis',
    route: '/(tabs)/fitness/form-check',
    a11y: 'Form check with AI',
  },
  {
    label: 'Pain Tracker',
    icon: 'body' as keyof typeof Ionicons.glyphMap,
    iconColor: '#EF4444',
    phosphorIcon: FirstAidKit,
    gradient: ['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.04)'] as [string, string],
    description: 'Body map logging + AI tips',
    route: '/(tabs)/fitness/pain-tracker',
    a11y: 'Open pain tracker',
  },
  {
    label: 'Mobility',
    icon: 'accessibility' as keyof typeof Ionicons.glyphMap,
    iconColor: '#A855F7',
    phosphorIcon: PersonSimpleRun,
    gradient: ['rgba(168,85,247,0.15)', 'rgba(168,85,247,0.05)'] as [string, string],
    description: 'AI recovery + flexibility',
    route: '/(tabs)/fitness/mobility',
    a11y: 'Open mobility exercises',
  },
  {
    label: 'Marketplace',
    icon: 'storefront' as keyof typeof Ionicons.glyphMap,
    iconColor: '#F59E0B',
    phosphorIcon: Storefront,
    gradient: ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)'] as [string, string],
    description: 'Premium programs & coaching',
    route: '/(tabs)/fitness/marketplace',
    a11y: 'Browse program marketplace',
  },
  {
    label: 'Progress Photos',
    icon: 'camera-outline' as keyof typeof Ionicons.glyphMap,
    iconColor: '#EC4899',
    phosphorIcon: Camera,
    gradient: ['rgba(236,72,153,0.15)', 'rgba(236,72,153,0.05)'] as [string, string],
    description: 'Timelapse + AI analysis',
    route: '/(tabs)/fitness/progress-photos',
    a11y: 'Open progress photos',
  },
] as const;

export default function FitnessHomeScreen() {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const templates = useWorkoutStore((s) => s.templates);
  const fetchTemplates = useWorkoutStore((s) => s.fetchTemplates);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const isLoading = useWorkoutStore((s) => s.isLoading);

  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  const todayTemplate = (() => {
    const dayOfWeek = new Date().getDay();
    return templates.find((t) => t.day_of_week === dayOfWeek) ?? null;
  })();

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const [sessionsRes, prsRes, weightRes, profileRes] = await Promise.all([
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
        supabase
          .from('profiles')
          .select('spotify_connected')
          .eq('id', user.id)
          .single(),
      ]);

      setSpotifyConnected(!!(profileRes.data?.spotify_connected));

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
    } catch {
      setError('Unable to load fitness data. Pull to refresh.');
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

      // Calendar sync — add the workout if user has enabled it
      const calendarEnabled = await AsyncStorage.getItem('calendar_sync_enabled').catch(() => null);
      if (calendarEnabled === 'true' && templateId) {
        const template = templates.find((t) => t.id === templateId);
        if (template) {
          const start = new Date();
          await addWorkoutToCalendar({
            name: template.name,
            startTime: start,
            durationMin: template.estimated_duration_minutes ?? 60,
            notes: template.description ?? '',
          }).catch(() => undefined);
        }
      }

      router.push('/(tabs)/fitness/workout-player');
    },
    [startWorkout, router, templates],
  );

  const handleNavigate = useCallback(
    (path: string) => {
      hapticLight();
      router.push(path as never);
    },
    [router],
  );

  // Screen entrance choreography
  const { getEntranceStyle } = useScreenEntrance({
    sections: ['header', 'quickActions', 'workoutCard', 'statsRow'],
  });

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
          <CaretRight size={18} color={colors.text.muted} />
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
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background.primary} />
      <PurpleRadialBackground />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={getEntranceStyle('header')}>
        <AIInsightCard screenKey="fitness/index" style={{ marginBottom: spacing.md }} />
        </Animated.View>

        {error && (
          <Card style={{ marginBottom: spacing.lg, backgroundColor: `${colors.accent.danger}15` }}>
            <Text style={[typography.caption, { color: colors.accent.danger }]}>{error}</Text>
          </Card>
        )}

        {/* Today's Workout */}
        <Animated.View style={getEntranceStyle('workoutCard')}>
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
          <HeroCard heroImage={HERO_IMAGES.fitness} style={{ marginBottom: spacing.lg, borderRadius: 12 }}>
          <Card variant="elevated" style={{ borderLeftWidth: 3, borderLeftColor: colors.accent.primary }}>
            <View style={styles.sectionHeader}>
              <CalendarDots size={20} color={colors.accent.primary} weight="duotone" />
              <Text style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}>
                Today's Workout
              </Text>
            </View>
            {todayTemplate ? (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[typography.h3, { color: colors.text.primary }]}>
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
                  variant="primary"
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
          </HeroCard>
        </Animated.View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View style={getEntranceStyle('statsRow')}>
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
              <Barbell size={18} color={colors.accent.primary} weight="duotone" />
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
              <Barbell size={18} color={colors.accent.success} weight="duotone" />
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
              <Fire size={18} color={colors.accent.fire} weight="duotone" />
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
        </Animated.View>

        {/* Spotify Mini Player — shown when Spotify is connected */}
        {spotifyConnected && userId && (
          <View style={{ marginBottom: spacing.lg }}>
            <SpotifyMiniPlayer userId={userId} />
          </View>
        )}

        {/* Navigation Cards */}
        <Animated.View style={getEntranceStyle('quickActions')}>
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
        >
          <View style={{ marginBottom: spacing.lg }}>
            {FITNESS_NAV_CARDS.map((card) => (
              <Pressable
                key={card.label}
                onPress={() => { hapticLight(); router.push(card.route as never); }}
                accessibilityLabel={card.a11y}
                accessibilityRole="button"
                style={[
                  styles.fitnessNavCard,
                  { backgroundColor: colors.background.secondary, borderColor: colors.border.default },
                ]}
              >
                <LinearGradient
                  colors={card.gradient}
                  style={styles.fitnessNavIconWrap}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {card.phosphorIcon ? (
                    <card.phosphorIcon size={24} color={card.iconColor} weight="duotone" />
                  ) : (
                    <Ionicons name={card.icon} size={24} color={card.iconColor} />
                  )}
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.text.primary }]}>{card.label}</Text>
                  <Text style={[typography.tiny, { color: colors.text.secondary, marginTop: 2 }]}>{card.description}</Text>
                </View>
                <CaretRight size={16} color={colors.text.muted} />
              </Pressable>
            ))}
          </View>
        </Animated.View>
        </Animated.View>
        <HelpBubble id="fitness_programs" message="Follow a program for structured training" position="below" />

        {/* PR Highlights */}
        {personalRecords.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
              Recent PRs
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.lg }}>
              {personalRecords.map((pr) => (
                <View
                  key={pr.id}
                  style={[
                    styles.prCard,
                    {
                      backgroundColor: colors.dim.gold,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginRight: spacing.sm,
                      borderLeftWidth: 3,
                      borderLeftColor: colors.accent.gold,
                    },
                  ]}
                >
                  <Trophy size={16} color={colors.accent.gold} weight="duotone" />
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
              <Scales size={18} color={colors.accent.primary} weight="duotone" />
              <Text style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}>
                Weight Trend
              </Text>
              <View style={{ flex: 1 }} />
              <CaretRight size={16} color={colors.text.muted} />
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
              maxToRenderPerBatch={10}
              initialNumToRender={5}
            />
          ) : (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyStateIcon,
                  { backgroundColor: `${colors.accent.primary}15`, borderRadius: 40 },
                ]}
              >
                <Trophy size={40} color={colors.accent.gold} weight="duotone" />
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
        <Plus size={28} color={colors.text.inverse} weight="bold" />
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
    borderLeftWidth: 3,
    borderLeftColor: '#A855F7',
    paddingLeft: 10,
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
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  // Fitness nav cards
  fitnessNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    gap: 14,
  },
  fitnessNavIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.25)',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
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
