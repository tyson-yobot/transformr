// =============================================================================
// TRANSFORMR -- Daily Affirmations & Evening Wind-Down
// Personalized AI-generated morning affirmations and evening wind-down sessions.
// Time-aware: shows morning content (5am–12pm) or evening content (6pm–11pm).
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Icon3D } from '@components/ui/Icon3D';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { EmptyState } from '@components/ui/EmptyState';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { supabase } from '@services/supabase';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { formatDate } from '@utils/formatters';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { EmptyStateBackground } from '@components/ui/EmptyStateBackground';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyAffirmation {
  id: string;
  date: string;
  type: 'morning' | 'evening';
  affirmation: string | null;
  intention: string | null;
  action_tip: string | null;
  reflection_prompt: string | null;
  gratitude_cue: string | null;
  wind_down_exercise: string | null;
  tomorrow_prep: string | null;
  audio_script: string | null;
  created_at: string;
}

interface UserContext {
  date: string;
  streak: number;
  goals: string[];
  mood_yesterday: number | null;
  workout_yesterday: boolean;
}

type SessionType = 'morning' | 'evening' | 'off-hours';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSessionType(): SessionType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'off-hours';
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

// ---------------------------------------------------------------------------
// BoxBreathing animation component
// ---------------------------------------------------------------------------

function BoxBreathingVisual() {
  const { colors, typography, spacing } = useTheme();
  const scale = useSharedValue(1);
  const [phase, setPhase] = useState<'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('inhale');
  const phaseRef = useRef<'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('inhale');
  const cycleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PHASE_DURATION = 4000;
  const PHASES: ('inhale' | 'hold-in' | 'exhale' | 'hold-out')[] = ['inhale', 'hold-in', 'exhale', 'hold-out'];
  const PHASE_LABELS: Record<string, string> = {
    inhale: 'Inhale 4...',
    'hold-in': 'Hold 4...',
    exhale: 'Exhale 4...',
    'hold-out': 'Hold 4...',
  };

  useEffect(() => {
    let idx = 0;

    const runCycle = () => {
      const current = PHASES[idx % PHASES.length] ?? 'inhale';
      phaseRef.current = current;
      setPhase(current);

      if (current === 'inhale') {
        scale.value = withTiming(1.4, { duration: PHASE_DURATION, easing: Easing.inOut(Easing.ease) });
      } else if (current === 'hold-in') {
        scale.value = withTiming(1.4, { duration: PHASE_DURATION });
      } else if (current === 'exhale') {
        scale.value = withTiming(1.0, { duration: PHASE_DURATION, easing: Easing.inOut(Easing.ease) });
      } else {
        scale.value = withTiming(1.0, { duration: PHASE_DURATION });
      }

      idx++;
    };

    runCycle();
    cycleIntervalRef.current = setInterval(runCycle, PHASE_DURATION);

    return () => {
      if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);
      cancelAnimation(scale);
    };
    // scale is a stable SharedValue; PHASES is a constant array defined in function scope
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.breathingContainer}>
      <Animated.View
        style={[
          styles.breathingBox,
          {
            backgroundColor: colors.accent.primaryDim,
            borderColor: colors.accent.primary,
            borderWidth: 2,
            borderRadius: 16,
          },
          boxStyle,
        ]}
      >
        <Icon3D name="drink" size={32} />
      </Animated.View>
      <Text style={[typography.bodyBold, { color: colors.text.primary, marginTop: spacing.lg }]}>
        {PHASE_LABELS[phase]}
      </Text>
      <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
        Box Breathing — 4 cycles
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AffirmationsScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { toast, show: showToast, hide: hideToast } = useActionToast();

  const affirmationGate = useFeatureGate('ai_daily_affirmation');

  const sessionType = getSessionType();
  const [todayAffirmation, setTodayAffirmation] = useState<DailyAffirmation | null>(null);
  const [history, setHistory] = useState<DailyAffirmation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionChecked, setActionChecked] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ScreenHelpButton
          content={{
            title: 'Daily Affirmations',
            body: 'Daily affirmations are personalized to your streak, goals, and mood. Morning content runs 5am–12pm. Evening content runs 6pm–11pm.',
          }}
        />
      ),
    });
  }, [navigation]);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = todayStr();
    const typeForToday = sessionType === 'off-hours' ? 'morning' : sessionType;

    const { data: todayData } = await supabase
      .from('daily_affirmations')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('type', typeForToday)
      .single();

    setTodayAffirmation(todayData as DailyAffirmation | null);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: historyData } = await supabase
      .from('daily_affirmations')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0] ?? '')
      .order('date', { ascending: false })
      .order('type', { ascending: false })
      .limit(14);

    setHistory((historyData as DailyAffirmation[] | null) ?? []);
    setIsLoading(false);
  }, [sessionType]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleGenerate = useCallback(async () => {
    if (!affirmationGate.isAvailable) return;
    setIsGenerating(true);
    hapticLight();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const typeToGenerate = sessionType === 'off-hours' ? 'morning' : sessionType;
      const today = todayStr();

      const { data: ctx } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      const streak = (ctx as { current_streak: number } | null)?.current_streak ?? 0;

      const { data: goalRows } = await supabase
        .from('goals')
        .select('title')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(5);

      const goals = ((goalRows as { title: string }[] | null) ?? []).map((g) => g.title);

      const userContext: UserContext = {
        date: today,
        streak,
        goals,
        mood_yesterday: null,
        workout_yesterday: false,
      };

      const { data, error } = await supabase.functions.invoke('ai-daily-affirmation', {
        body: { type: typeToGenerate, user_context: userContext },
      });

      if (error) throw error;

      setTodayAffirmation(data as DailyAffirmation);
      hapticSuccess();
      showToast('Generated', { subtext: `Your ${typeToGenerate} session is ready` });
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      showToast(message, { type: 'info' });
    } finally {
      setIsGenerating(false);
    }
  }, [sessionType, loadData, showToast, affirmationGate.isAvailable]);

  const typeLabel = sessionType === 'morning' ? 'Morning Affirmation'
    : sessionType === 'evening' ? 'Evening Wind-Down'
    : 'Daily Affirmation';

  const typeIcon: string = sessionType === 'morning' ? 'sunny-outline'
    : sessionType === 'evening' ? 'moon-outline'
    : 'sparkles-outline';
  const typeIcon3D = sessionType === 'morning' ? 'sun' as const
    : sessionType === 'evening' ? 'moon' as const
    : 'sparkles' as const;

  const accentColor = sessionType === 'morning' ? colors.accent.gold : colors.accent.primary;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ActionToast
        message={toast.message}
        subtext={toast.subtext}
        visible={toast.visible}
        onHide={hideToast}
        type={toast.type}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        <AIInsightCard screenKey="goals/affirmations" style={{ marginBottom: spacing.md }} />

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={[styles.headerRow, { marginBottom: spacing.lg }]}>
            <Icon3D name={typeIcon3D} size={28} />
            <Text style={[typography.h2, { color: colors.text.primary, marginLeft: spacing.sm }]}>
              {typeLabel}
            </Text>
          </View>
        </Animated.View>

        {/* Today's Content */}
        {!isLoading && !todayAffirmation && (
          <Animated.View entering={FadeInDown.delay(150)} style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, minHeight: 300 }}>
            <EmptyStateBackground query="meditation mindfulness dark" opacity={0.18} />
            <EmptyState
              ionIcon={typeIcon as 'sunny-outline'}
              title={`No ${typeLabel.toLowerCase()} yet`}
              subtitle="Generate your personalized session — it takes your streak, goals, and mood into account."
              actionLabel={`Generate ${typeLabel}`}
              onAction={handleGenerate}
            />
          </Animated.View>
        )}

        {isLoading && (
          <Animated.View entering={FadeInDown.delay(150)}>
            <Card style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Text style={[typography.body, { color: colors.text.secondary }]}>
                Loading your session...
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Morning Content */}
        {todayAffirmation?.type === 'morning' && (
          <>
            <Animated.View entering={FadeInDown.delay(200)}>
              <Card
                variant="elevated"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: colors.accent.gold,
                  marginBottom: spacing.md,
                }}
              >
                <Badge label="Affirmation" variant="info" size="sm" />
                <Text
                  style={[
                    typography.h3,
                    { color: colors.text.primary, marginTop: spacing.md, lineHeight: 28 },
                  ]}
                >
                  {todayAffirmation.affirmation}
                </Text>
              </Card>
            </Animated.View>

            {todayAffirmation.intention && (
              <Animated.View entering={FadeInDown.delay(300)}>
                <Card style={{ marginBottom: spacing.md }}>
                  <View style={styles.sectionHeader}>
                    <Icon3D name="flag" size={18} />
                    <Text style={[typography.bodyBold, { color: colors.accent.cyan, marginLeft: spacing.xs }]}>
                      Today's Intention
                    </Text>
                  </View>
                  <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.sm }]}>
                    {todayAffirmation.intention}
                  </Text>
                </Card>
              </Animated.View>
            )}

            {todayAffirmation.action_tip && (
              <Animated.View entering={FadeInDown.delay(400)}>
                <Card style={{ marginBottom: spacing.md }}>
                  <View style={styles.sectionHeader}>
                    <Icon3D name="check" size={18} />
                    <Text
                      style={[typography.bodyBold, { color: colors.accent.success, marginLeft: spacing.xs }]}
                    >
                      Action Tip
                    </Text>
                  </View>
                  <View style={[styles.actionTipRow, { marginTop: spacing.sm }]}>
                    <Pressable
                      onPress={() => { hapticLight(); setActionChecked(!actionChecked); }}
                      accessibilityLabel={actionChecked ? 'Mark action tip incomplete' : 'Mark action tip complete'}
                      style={[
                        styles.checkbox,
                        {
                          borderColor: actionChecked ? colors.accent.success : colors.border.default,
                          backgroundColor: actionChecked ? colors.accent.successDim : 'transparent',
                        },
                      ]}
                    >
                      {actionChecked && (
                        <Ionicons name="checkmark" size={14} color={colors.accent.success} />
                      )}
                    </Pressable>
                    <Text
                      style={[
                        typography.body,
                        {
                          color: actionChecked ? colors.text.muted : colors.text.secondary,
                          flex: 1,
                          textDecorationLine: actionChecked ? 'line-through' : 'none',
                          marginLeft: spacing.sm,
                        },
                      ]}
                    >
                      {todayAffirmation.action_tip}
                    </Text>
                  </View>
                </Card>
              </Animated.View>
            )}
          </>
        )}

        {/* Evening Content */}
        {todayAffirmation?.type === 'evening' && (
          <>
            {todayAffirmation.reflection_prompt && (
              <Animated.View entering={FadeInDown.delay(200)}>
                <Card
                  variant="elevated"
                  style={{
                    borderLeftWidth: 3,
                    borderLeftColor: colors.accent.primary,
                    marginBottom: spacing.md,
                  }}
                >
                  <Badge label="Reflection" variant="info" size="sm" />
                  <Text
                    style={[
                      typography.h3,
                      { color: colors.text.primary, marginTop: spacing.md, lineHeight: 28 },
                    ]}
                  >
                    {todayAffirmation.reflection_prompt}
                  </Text>
                </Card>
              </Animated.View>
            )}

            {todayAffirmation.gratitude_cue && (
              <Animated.View entering={FadeInDown.delay(300)}>
                <Card style={{ marginBottom: spacing.md }}>
                  <View style={styles.sectionHeader}>
                    <Icon3D name="heart" size={18} />
                    <Text
                      style={[typography.bodyBold, { color: colors.accent.pink, marginLeft: spacing.xs }]}
                    >
                      Gratitude Practice
                    </Text>
                  </View>
                  <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.sm }]}>
                    {todayAffirmation.gratitude_cue}
                  </Text>
                </Card>
              </Animated.View>
            )}

            {todayAffirmation.wind_down_exercise && (
              <Animated.View entering={FadeInDown.delay(400)}>
                <Card style={{ marginBottom: spacing.md }}>
                  <View style={styles.sectionHeader}>
                    <Icon3D name="body" size={18} />
                    <Text
                      style={[typography.bodyBold, { color: colors.accent.cyan, marginLeft: spacing.xs }]}
                    >
                      Box Breathing Exercise
                    </Text>
                  </View>
                  <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.sm }]}>
                    {todayAffirmation.wind_down_exercise}
                  </Text>
                  <BoxBreathingVisual />
                </Card>
              </Animated.View>
            )}

            {todayAffirmation.tomorrow_prep && (
              <Animated.View entering={FadeInDown.delay(500)}>
                <Card style={{ marginBottom: spacing.md }}>
                  <View style={styles.sectionHeader}>
                    <Icon3D name="calendar" size={18} />
                    <Text
                      style={[typography.bodyBold, { color: colors.accent.warning, marginLeft: spacing.xs }]}
                    >
                      Tomorrow's Prep
                    </Text>
                  </View>
                  <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.sm }]}>
                    {todayAffirmation.tomorrow_prep}
                  </Text>
                </Card>
              </Animated.View>
            )}
          </>
        )}

        {/* Generate / Regenerate Button */}
        {!isLoading && (
          <Animated.View entering={FadeInDown.delay(600)}>
            <Button
              title={todayAffirmation ? `Regenerate ${typeLabel}` : `Generate ${typeLabel}`}
              onPress={handleGenerate}
              variant={todayAffirmation ? 'outline' : 'primary'}
              loading={isGenerating}
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </Animated.View>
        )}

        {/* History Toggle */}
        <Animated.View entering={FadeInDown.delay(700)}>
          <Pressable
            onPress={() => { hapticLight(); setShowHistory(!showHistory); }}
            accessibilityLabel={showHistory ? 'Hide past 7 days' : 'View past 7 days'}
            style={{ marginTop: spacing.xl, alignItems: 'center' }}
          >
            <Text style={[typography.bodyBold, { color: colors.accent.primary }]}>
              {showHistory ? 'Hide History' : 'Past 7 Days'}
            </Text>
          </Pressable>
        </Animated.View>

        {showHistory && history.length === 0 && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <EmptyState
              ionIcon="time-outline"
              title="No history yet"
              subtitle="Your affirmations will appear here after you generate them."
              style={{ paddingVertical: spacing.lg }}
            />
          </Animated.View>
        )}

        {showHistory && history.map((entry, idx) => (
          <Animated.View key={entry.id} entering={FadeInDown.delay(100 + idx * 50)}>
            <Card style={{ marginTop: spacing.sm }}>
              <View style={styles.historyCardHeader}>
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                  {formatDate(entry.date)}
                </Text>
                <Badge
                  label={entry.type === 'morning' ? 'Morning' : 'Evening'}
                  variant={entry.type === 'morning' ? 'warning' : 'info'}
                  size="sm"
                />
              </View>
              <Text
                style={[typography.body, { color: colors.text.secondary, marginTop: spacing.xs }]}
                numberOfLines={2}
              >
                {entry.affirmation ?? entry.reflection_prompt ?? '—'}
              </Text>
            </Card>
          </Animated.View>
        ))}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  actionTipRow: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  breathingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  breathingBox: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
