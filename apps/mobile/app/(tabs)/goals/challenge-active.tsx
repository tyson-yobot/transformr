// =============================================================================
// TRANSFORMR -- Active Challenge Dashboard
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import type { ColorScheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Modal } from '@components/ui/Modal';
import { useChallengeStore } from '@stores/challengeStore';
import { hapticLight } from '@utils/haptics';
import { ShareButton } from '@components/social/ShareButton';
import { supabase } from '@services/supabase';
import { verifyDailyTasks } from '@services/calculations/challengeVerification';
import {
  getChallengeCoaching,
  generateFailureReflection,
  generateCompletionMessage,
} from '@services/ai/challengeCoach';
import { getFullComplianceStatus, type ComplianceResult } from '@services/ai/compliance';
import { FastingTimer } from '@components/challenges/FastingTimer';
import { PlankTimer } from '@components/challenges/PlankTimer';
import { C25KTimer } from '@components/challenges/C25KTimer';
import { MurphWorkout } from '@components/challenges/MurphWorkout';
import { SavingsCalculator } from '@components/challenges/SavingsCalculator';
import { ProgressPhotoGuide } from '@components/challenges/ProgressPhotoGuide';
import { Ionicons } from '@expo/vector-icons';
import type {
  ChallengeDefinition,
  ChallengeDailyLog,
  ChallengeTask,
} from '@app-types/database';

// ---------------------------------------------------------------------------
// Coach response type (mirrors ChallengeCoachResponse in the service)
// ---------------------------------------------------------------------------
interface CoachResponse {
  message:      string;
  tips:         string[];
  urgentTasks:  string[];
  motivation:   string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if the current local time is 20:00 or later. */
function isPast8PM(): boolean {
  return new Date().getHours() >= 20;
}

/** Format an ISO date string as a readable label. */
function formatDate(iso?: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Compute the day status for the calendar heatmap. */
type DayStatus = 'completed' | 'missed' | 'today' | 'future';

function getDayStatus(
  dayNumber: number,
  currentDay: number,
  logsMap: Map<number, ChallengeDailyLog>,
): DayStatus {
  if (dayNumber > currentDay) return 'future';
  if (dayNumber === currentDay) return 'today';
  const log = logsMap.get(dayNumber);
  if (log && log.all_tasks_completed) return 'completed';
  return 'missed';
}

// getDayStatusColor maps a day status to a theme color token.
// Defined as a function (not a const map) so callers pass in the live
// `colors` object from useTheme(), keeping everything theme-aware.
function getDayStatusColor(status: DayStatus, themeColors: ColorScheme): string {
  switch (status) {
    case 'completed': return themeColors.accent.success;
    case 'missed':    return themeColors.accent.danger;
    case 'today':     return themeColors.accent.warning;
    case 'future':    return themeColors.text.muted;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChallengeActiveScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.challengeActiveScreen} />,
    });
  }, [navigation]);

  // Store -----------------------------------------------------------------
  const {
    activeEnrollment,
    challengeDefinitions,
    todayLog,
    dailyLogs,
    isLoading,
    logDailyTask,
    completeDailyLog,
    restartChallenge,
    abandonChallenge,
    getTodayProgress,
    fetchActiveEnrollment,
    fetchDailyLogs,
  } = useChallengeStore();

  // Local state -----------------------------------------------------------
  const [refreshing,          setRefreshing]          = useState(false);
  const [abandonModalVisible, setAbandonModalVisible] = useState(false);
  const [restartModalVisible, setRestartModalVisible] = useState(false);
  const [coachResponse,       setCoachResponse]       = useState<CoachResponse | null>(null);
  const [coachLoading,        setCoachLoading]        = useState(false);
  const [showPhotoGuide,      setShowPhotoGuide]      = useState(false);
  const [failureReflection,   setFailureReflection]   = useState<string | null>(null);
  const [completionMsg,       setCompletionMsg]       = useState<string | null>(null);
  const [complianceStatus,    setComplianceStatus]    = useState<ComplianceResult | null>(null);

  const userIdRef    = useRef<string | null>(null);
  const coachFiredRef = useRef(false);

  // Derived data ----------------------------------------------------------
  const definition: ChallengeDefinition | null = useMemo(() => {
    if (!activeEnrollment?.challenge_id) return null;
    return (
      challengeDefinitions.find((d) => d.id === activeEnrollment.challenge_id) ??
      null
    );
  }, [activeEnrollment, challengeDefinitions]);

  const tasks: ChallengeTask[] = useMemo(() => {
    if (!definition?.rules) return [];
    const raw = (definition.rules as Record<string, unknown>).tasks;
    if (Array.isArray(raw)) return raw as ChallengeTask[];
    return [];
  }, [definition]);

  const currentDay = activeEnrollment?.current_day ?? 1;
  const totalDays = definition?.duration_days ?? 1;
  const overallProgress = currentDay / totalDays;
  const restartCount = activeEnrollment?.restart_count ?? 0;

  const todayProgress = useMemo(() => getTodayProgress(), [getTodayProgress]);
  const tasksCompleted = useMemo(() => todayLog?.tasks_completed ?? {}, [todayLog]);
  const autoVerified = todayLog?.auto_verified ?? {};

  const incompleteTasks = useMemo(() => {
    return tasks.filter((t) => !tasksCompleted[t.id]);
  }, [tasks, tasksCompleted]);

  const allTasksDone = incompleteTasks.length === 0 && tasks.length > 0;

  // Determine if any day was missed (for restart prompt)
  const logsMap = useMemo(() => {
    const map = new Map<number, ChallengeDailyLog>();
    for (const log of dailyLogs) {
      map.set(log.day_number, log);
    }
    return map;
  }, [dailyLogs]);

  const hasMissedDay = useMemo(() => {
    for (let d = 1; d < currentDay; d++) {
      const log = logsMap.get(d);
      if (!log || !log.all_tasks_completed) return true;
    }
    return false;
  }, [logsMap, currentDay]);

  const showRestartButton =
    definition?.restart_on_failure && hasMissedDay;

  // Resolve today's date string (YYYY-MM-DD) ------------------------------
  const todayDateStr = useMemo((): string => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  }, []);

  // Resolve time-of-day for coaching prompt --------------------------------
  const timeOfDay = useMemo((): 'morning' | 'afternoon' | 'evening' => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }, []);

  // Effects ---------------------------------------------------------------

  // Resolve user ID once on mount
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null;
    });
  }, []);

  // Fetch daily logs on mount so calendar heatmap is populated
  useEffect(() => {
    if (activeEnrollment?.id) {
      void fetchDailyLogs(activeEnrollment.id);
    }
  }, [activeEnrollment?.id, fetchDailyLogs]);

  // Run auto-verification once per mount (for auto_verify tasks)
  useEffect(() => {
    const autoTasks = tasks.filter((t) => t.auto_verify);
    if (!activeEnrollment || !userIdRef.current || autoTasks.length === 0) return;

    const verifyAll = async () => {
      const uid = userIdRef.current;
      if (!uid) return;
      const results = await verifyDailyTasks(uid, todayDateStr, autoTasks).catch(() => null);
      if (!results) return;
      for (const [taskId, result] of Object.entries(results)) {
        if (result.verified && !todayLog?.tasks_completed[taskId]) {
          await logDailyTask(activeEnrollment.id, taskId, true, true).catch(() => undefined);
        }
      }
    };
    void verifyAll();
    // tasks length + enrollment id are the reactive deps here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEnrollment?.id, todayDateStr]);

  // Fetch AI coaching card and compliance status once per session
  useEffect(() => {
    if (!activeEnrollment || !definition || coachFiredRef.current) return;
    const uid = userIdRef.current;
    if (!uid) return;

    coachFiredRef.current = true;
    setCoachLoading(true);

    // Coaching and compliance fire concurrently
    void getChallengeCoaching(uid, activeEnrollment.id, definition, activeEnrollment, dailyLogs.slice(-7), timeOfDay)
      .then((res) => setCoachResponse(res as CoachResponse))
      .catch(() => undefined)
      .finally(() => setCoachLoading(false));

    void getFullComplianceStatus(activeEnrollment.id)
      .then((result) => setComplianceStatus(result))
      .catch(() => undefined);

    // Fire once when uid and definition resolve
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEnrollment?.id, definition?.id]);

  // Handlers --------------------------------------------------------------
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && activeEnrollment) {
        await Promise.all([
          fetchActiveEnrollment(user.id),
          fetchDailyLogs(activeEnrollment.id),
        ]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeEnrollment, fetchActiveEnrollment, fetchDailyLogs]);

  const handleToggleTask = useCallback(
    async (taskId: string, currentlyCompleted: boolean) => {
      if (!activeEnrollment) return;
      await logDailyTask(activeEnrollment.id, taskId, !currentlyCompleted);
    },
    [activeEnrollment, logDailyTask],
  );

  const handleCompleteDay = useCallback(async () => {
    if (!activeEnrollment || !definition) return;
    await completeDailyLog(activeEnrollment.id);
    // If this was the final day, generate a completion message
    if (currentDay >= totalDays) {
      const uid = userIdRef.current;
      if (uid) {
        const result = await generateCompletionMessage(uid, definition, activeEnrollment, dailyLogs).catch(() => null);
        if (result?.message) setCompletionMsg(result.message);
      }
    }
  }, [activeEnrollment, definition, completeDailyLog, currentDay, totalDays, dailyLogs]);

  const handleAbandon = useCallback(async () => {
    if (!activeEnrollment) return;
    await abandonChallenge(activeEnrollment.id);
    setAbandonModalVisible(false);
    router.back();
  }, [activeEnrollment, abandonChallenge, router]);

  const handleRestart = useCallback(async () => {
    if (!activeEnrollment || !definition) return;
    const uid = userIdRef.current;
    const missedIds = incompleteTasks.map((t) => t.id);
    if (uid) {
      const reflection = await generateFailureReflection(uid, definition, activeEnrollment, currentDay, missedIds).catch(() => null);
      if (reflection?.reflection) setFailureReflection(reflection.reflection);
    }
    await restartChallenge(activeEnrollment.id);
    setRestartModalVisible(false);
    coachFiredRef.current = false; // allow coaching to reload after restart
  }, [activeEnrollment, definition, restartChallenge, incompleteTasks, currentDay]);

  // Guard: no active enrollment -------------------------------------------
  if (!activeEnrollment || !definition) {
    return (
      <View
        style={[
          styles.screen,
          {
            backgroundColor: colors.background.primary,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
          },
        ]}
      >
        <Text style={[typography.h3, { color: colors.text.primary, textAlign: 'center' }]}>
          No Active Challenge
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md },
          ]}
        >
          Browse and enroll in a challenge to get started.
        </Text>
        <Button
          title="Browse Challenges"
          onPress={() => router.push('/(tabs)/goals/challenges')}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
      </View>
    );
  }

  // Render ----------------------------------------------------------------
  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* ----------------------------------------------------------------- */}
        {/* Day Counter + Progress Ring                                        */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.dayCounterRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h2, { color: colors.text.primary }]}>
                  Day {currentDay} of {totalDays}
                </Text>
                <ProgressBar
                  progress={overallProgress}
                  showPercentage
                  style={{ marginTop: spacing.sm }}
                />
              </View>

              <ProgressRing
                progress={overallProgress}
                size={88}
                strokeWidth={7}
              >
                <Text style={[typography.statSmall, { color: colors.accent.primary }]}>
                  {Math.round(overallProgress * 100)}%
                </Text>
              </ProgressRing>
            </View>
          </Card>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Streak Indicator                                                   */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(150)}>
          <View style={[styles.streakRow, { marginBottom: spacing.lg }]}>
            <Badge
              label={`\uD83D\uDD25 ${currentDay} day streak`}
              variant="warning"
              size="sm"
            />
            {restartCount > 0 && (
              <Text
                style={[
                  typography.tiny,
                  { color: colors.text.muted, marginLeft: spacing.sm },
                ]}
              >
                Restart #{restartCount}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Failure Reflection (shown after restart)                          */}
        {/* ----------------------------------------------------------------- */}
        {failureReflection && (
          <Animated.View entering={FadeInDown.delay(160)}>
            <Card variant="ai" style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="refresh-circle-outline" size={18} color={colors.accent.primary} style={{ marginRight: spacing.sm, marginTop: 2 }} />
                <Text style={[typography.body, { color: colors.text.secondary, flex: 1 }]}>
                  {failureReflection}
                </Text>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Challenge Completion Message                                       */}
        {/* ----------------------------------------------------------------- */}
        {completionMsg && (
          <Animated.View entering={FadeInDown.delay(160)}>
            <Card variant="success" style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="trophy-outline" size={18} color={colors.accent.success} style={{ marginRight: spacing.sm, marginTop: 2 }} />
                <Text style={[typography.bodyBold, { color: colors.accent.success, flex: 1 }]}>
                  {completionMsg}
                </Text>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* AI Coach Card                                                      */}
        {/* ----------------------------------------------------------------- */}
        {(coachLoading || coachResponse) && (
          <Animated.View entering={FadeInDown.delay(170)}>
            <Card variant="ai" style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Ionicons name="sparkles-outline" size={16} color={colors.accent.primary} style={{ marginRight: spacing.sm }} />
                <Text style={[typography.captionBold, { color: colors.accent.primary }]}>Challenge Coach</Text>
                {coachLoading && !isLoading && (
                  <Text style={[typography.tiny, { color: colors.text.muted, marginLeft: spacing.sm }]}>Thinking…</Text>
                )}
              </View>
              {coachResponse && (
                <>
                  <Text style={[typography.body, { color: colors.text.primary, marginBottom: spacing.sm }]}>
                    {coachResponse.message}
                  </Text>
                  {coachResponse.tips.length > 0 && (
                    <View style={{ marginTop: spacing.xs }}>
                      {coachResponse.tips.slice(0, 2).map((tip, i) => (
                        <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                          <Text style={[typography.tiny, { color: colors.accent.primary, marginRight: 4 }]}>›</Text>
                          <Text style={[typography.tiny, { color: colors.text.secondary, flex: 1 }]}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {complianceStatus?.recommendation && (
                    <View
                      style={{
                        marginTop: spacing.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons
                        name={complianceStatus.compliant ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                        size={13}
                        color={complianceStatus.compliant ? colors.accent.success : colors.accent.warning}
                      />
                      <Text style={[typography.tiny, { color: colors.text.muted, flex: 1 }]}>
                        {complianceStatus.recommendation}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </Card>
          </Animated.View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Fail Warning                                                       */}
        {/* ----------------------------------------------------------------- */}
        {isPast8PM() && incompleteTasks.length > 0 && (
          <Animated.View entering={FadeInDown.delay(175)}>
            <Card
              style={{
                marginBottom: spacing.lg,
                backgroundColor: `${colors.accent.danger}20`,
                borderWidth: 1,
                borderColor: colors.accent.danger,
              }}
            >
              <Text
                style={[
                  typography.bodyBold,
                  { color: colors.accent.danger },
                ]}
              >
                {'\u26A0\uFE0F'} Warning: {incompleteTasks.length} task
                {incompleteTasks.length !== 1 ? 's' : ''} remaining. Don't let
                your streak break!
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Daily Task Checklist                                               */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, marginBottom: spacing.md },
            ]}
          >
            Today's Tasks
          </Text>

          {tasks.map((task) => {
            const completed = !!tasksCompleted[task.id];
            const isAutoVerified = !!autoVerified[task.id];
            const isLocked = task.auto_verify && isAutoVerified;
            const taskConfig = task.config ?? {};
            const currentValue = taskConfig.current_value as number | undefined;
            const targetValue = taskConfig.target_value as number | undefined;
            const unit = taskConfig.unit as string | undefined;

            return (
              <Pressable
                key={task.id}
                onPress={() => {
                  if (isLocked) return;
                  hapticLight();
                  handleToggleTask(task.id, completed);
                }}
                disabled={isLocked}
                accessibilityLabel={`${completed ? 'Unmark' : 'Mark'} task ${task.label}`}
              >
                <Card style={{ marginBottom: spacing.md, opacity: isLocked ? 0.85 : 1 }}>
                  <View style={styles.taskRow}>
                    <Text style={{ fontSize: 22 }}>
                      {completed ? '\u2705' : '\u2B1C'}
                    </Text>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text
                        style={[
                          typography.bodyBold,
                          {
                            color: completed
                              ? colors.text.secondary
                              : colors.text.primary,
                            textDecorationLine: completed ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {task.label}
                      </Text>

                      {/* Task-specific progress data */}
                      {currentValue != null && targetValue != null && unit && (
                        <View style={{ marginTop: spacing.xs }}>
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.text.secondary },
                            ]}
                          >
                            <Text style={typography.monoBody}>{currentValue}/{targetValue}</Text> {unit}
                          </Text>
                          <ProgressBar
                            progress={currentValue / targetValue}
                            height={4}
                            style={{ marginTop: 4 }}
                          />
                        </View>
                      )}
                    </View>

                    <View style={styles.taskBadges}>
                      {task.auto_verify && (
                        <Badge label="Auto" variant="info" size="sm" />
                      )}
                      {isLocked && (
                        <Text style={{ fontSize: 14, marginLeft: 4 }}>{'\uD83D\uDD12'}</Text>
                      )}
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}

          <Text
            style={[
              typography.caption,
              {
                color: colors.text.secondary,
                textAlign: 'right',
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Text style={typography.monoBody}>{todayProgress.completed}/{todayProgress.total}</Text> tasks complete
          </Text>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Calendar Heatmap                                                   */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, marginBottom: spacing.md },
            ]}
          >
            Challenge Calendar
          </Text>

          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.calendarGrid}>
              {Array.from({ length: totalDays }, (_, i) => {
                const dayNum = i + 1;
                const status = getDayStatus(dayNum, currentDay, logsMap);
                const bgColor = getDayStatusColor(status, colors);

                return (
                  <View
                    key={dayNum}
                    style={[
                      styles.calendarCell,
                      {
                        backgroundColor: bgColor,
                        borderRadius: borderRadius.sm,
                        margin: 2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        {
                          color: status === 'future' ? colors.text.muted : colors.text.inverse,
                          fontSize: totalDays > 60 ? 8 : totalDays > 30 ? 9 : 10,
                        },
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Legend */}
            <View style={[styles.legendRow, { marginTop: spacing.md }]}>
              {(
                [
                  { label: 'Done',     color: getDayStatusColor('completed', colors) },
                  { label: 'Missed',   color: getDayStatusColor('missed',    colors) },
                  { label: 'Today',    color: getDayStatusColor('today',     colors) },
                  { label: 'Upcoming', color: getDayStatusColor('future',    colors) },
                ]
              ).map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      {
                        backgroundColor: item.color,
                        borderRadius: borderRadius.full,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      typography.tiny,
                      { color: colors.text.secondary, marginLeft: 4 },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Challenge-Specific Widget                                          */}
        {/* ----------------------------------------------------------------- */}
        {definition && (() => {
          const slug = definition.slug;
          const cfg = activeEnrollment.configuration ?? {};

          if (slug === 'intermittent-fasting') {
            const protocol = (cfg.protocol as string) || '16:8';
            const windowStart = (cfg.eating_window_start as string) || '12:00';
            return (
              <Animated.View entering={FadeInDown.delay(350)} style={{ marginBottom: spacing.lg }}>
                <FastingTimer
                  protocol={protocol as import('@components/challenges/FastingTimer').FastingProtocol}
                  eatingWindowStart={windowStart}
                />
              </Animated.View>
            );
          }

          if (slug === '30-day-plank') {
            const rules = definition.rules as Record<string, unknown>;
            const schedule = (rules.daily_schedule ?? rules.daily_targets ?? {}) as Record<string, number>;
            const target = schedule[String(currentDay)] ?? 30;
            return (
              <Animated.View entering={FadeInDown.delay(350)} style={{ marginBottom: spacing.lg }}>
                <PlankTimer
                  targetSeconds={target}
                  onComplete={(held) => void logDailyTask(activeEnrollment.id, 'plank', held >= target, true).catch(() => undefined)}
                />
              </Animated.View>
            );
          }

          if (slug === 'c25k') {
            const rules = definition.rules as Record<string, unknown>;
            const schedule = (rules.daily_schedule ?? {}) as Record<string, unknown>;
            const daySchedule = (schedule[String(currentDay)] ?? {}) as Record<string, unknown>;
            const intervals = (daySchedule.intervals ?? []) as { type: 'run' | 'walk'; duration: number }[];
            const week  = Math.ceil(currentDay / 3);
            const runNo = ((currentDay - 1) % 3) + 1;
            return (
              <Animated.View entering={FadeInDown.delay(350)} style={{ marginBottom: spacing.lg }}>
                <C25KTimer
                  weekNumber={week}
                  runNumber={runNo}
                  intervals={intervals}
                  onComplete={() => void logDailyTask(activeEnrollment.id, 'run', true, false).catch(() => undefined)}
                />
              </Animated.View>
            );
          }

          if (slug === 'murph') {
            return (
              <Animated.View entering={FadeInDown.delay(350)} style={{ marginBottom: spacing.lg }}>
                <MurphWorkout
                  weightedVest={(cfg.weighted_vest as boolean) ?? false}
                  partitioned={(cfg.partitioned as boolean) ?? false}
                  onComplete={(_secs) => void logDailyTask(activeEnrollment.id, 'murph_complete', true, false)
                    .then(() => void logDailyTask(activeEnrollment.id, 'murph_time', true, false))
                    .catch(() => undefined)
                  }
                />
              </Animated.View>
            );
          }

          if (slug === 'sober-month') {
            return (
              <Animated.View entering={FadeInDown.delay(350)} style={{ marginBottom: spacing.lg }}>
                <SavingsCalculator
                  weeklySpend={(cfg.weekly_spend as number) ?? 50}
                  dayNumber={currentDay}
                  totalDays={definition.duration_days}
                />
              </Animated.View>
            );
          }

          if (slug === '75-hard' || slug === '75-soft' || slug === '75-medium') {
            const hasPhotoTask = tasks.some((t) => t.type === 'photo');
            if (hasPhotoTask) {
              return (
                <Animated.View entering={FadeInDown.delay(350)} style={{ marginBottom: spacing.lg }}>
                  <Pressable
                    onPress={() => { hapticLight(); setShowPhotoGuide(true); }}
                    style={[
                      styles.photoRow,
                      { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.md },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Take today's progress photo"
                  >
                    <Ionicons name="camera-outline" size={20} color={colors.accent.primary} />
                    <Text style={[typography.bodyBold, { color: colors.accent.primary, marginLeft: spacing.sm }]}>
                      Take Today's Progress Photo
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            }
          }

          return null;
        })()}

        {/* ----------------------------------------------------------------- */}
        {/* Action Buttons                                                     */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(400)}>
          {/* Share Progress */}
          <ShareButton
            type="challenge_complete"
            data={{
              title: definition.name,
              value: `Day ${currentDay} of ${totalDays}`,
              subtitle: 'Challenge Progress',
            }}
            label="Share Progress"
          />

          {/* Complete Day */}
          <Button
            title="Complete Day"
            onPress={handleCompleteDay}
            fullWidth
            disabled={!allTasksDone}
            style={{ marginBottom: spacing.md }}
          />

          {/* Restart from Day 1 */}
          {showRestartButton && (
            <Button
              title="Restart from Day 1"
              onPress={() => setRestartModalVisible(true)}
              fullWidth
              style={{ marginBottom: spacing.md }}
            />
          )}

          {/* Abandon Challenge */}
          <Pressable
            onPress={() => { hapticLight(); setAbandonModalVisible(true); }}
            accessibilityLabel="Abandon this challenge"
            style={[
              styles.abandonButton,
              {
                borderRadius: borderRadius.md,
                borderColor: colors.accent.danger,
                borderWidth: 1,
                padding: spacing.md,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Text
              style={[
                typography.bodyBold,
                {
                  color: colors.accent.danger,
                  textAlign: 'center',
                },
              ]}
            >
              Abandon Challenge
            </Text>
          </Pressable>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Challenge Info Footer                                              */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.captionBold, { color: colors.text.primary }]}>
              {definition.icon ? `${definition.icon} ` : ''}
              {definition.name}
            </Text>
            <View style={[styles.footerRow, { marginTop: spacing.sm }]}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.tiny, { color: colors.text.secondary }]}>
                  Started
                </Text>
                <Text style={[typography.caption, { color: colors.text.primary }]}>
                  {formatDate(activeEnrollment.started_at)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.tiny, { color: colors.text.secondary }]}>
                  Target End
                </Text>
                <Text style={[typography.caption, { color: colors.text.primary }]}>
                  {formatDate(activeEnrollment.target_end_date)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.tiny, { color: colors.text.secondary }]}>
                  Duration
                </Text>
                <Text style={[typography.caption, { color: colors.text.primary }]}>
                  {definition.duration_days} days
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ------------------------------------------------------------------- */}
      {/* Abandon Confirmation Modal                                           */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        visible={abandonModalVisible}
        onDismiss={() => setAbandonModalVisible(false)}
        title="Abandon Challenge?"
      >
        <Text style={[typography.body, { color: colors.text.secondary }]}>
          Are you sure you want to abandon this challenge? All progress for this
          attempt will be lost. This action cannot be undone.
        </Text>
        <Button
          title="Yes, Abandon Challenge"
          onPress={handleAbandon}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
        <Button
          title="Cancel"
          onPress={() => setAbandonModalVisible(false)}
          fullWidth
          style={{ marginTop: spacing.md }}
        />
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* Restart Confirmation Modal                                           */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        visible={restartModalVisible}
        onDismiss={() => setRestartModalVisible(false)}
        title="Restart from Day 1?"
      >
        <Text style={[typography.body, { color: colors.text.secondary }]}>
          You missed a day. This challenge requires a full restart on failure.
          Your restart count will be incremented and you will start over from
          Day 1. Previous logs will be preserved for history.
        </Text>
        <Button
          title="Restart Challenge"
          onPress={handleRestart}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
        <Button
          title="Cancel"
          onPress={() => setRestartModalVisible(false)}
          fullWidth
          style={{ marginTop: spacing.md }}
        />
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* Progress Photo Guide Modal                                           */}
      {/* ------------------------------------------------------------------- */}
      <ProgressPhotoGuide
        visible={showPhotoGuide}
        onClose={() => setShowPhotoGuide(false)}
        onPhotoTaken={(uri) => {
          setShowPhotoGuide(false);
          if (activeEnrollment) {
            void logDailyTask(activeEnrollment.id, 'progress_photo', true, false).catch(() => undefined);
          }
          void uri; // uri available for future upload integration
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  dayCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
  },
  abandonButton: {
    alignItems: 'center',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
