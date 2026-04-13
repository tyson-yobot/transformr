// =============================================================================
// TRANSFORMR -- Active Challenge Dashboard
// =============================================================================

import { useCallback, useMemo, useState } from 'react';
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
import type {
  ChallengeDefinition,
  ChallengeDailyLog,
  ChallengeTask,
} from '@app-types/database';

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
  const router = useRouter();

  // Store -----------------------------------------------------------------
  const {
    activeEnrollment,
    challengeDefinitions,
    todayLog,
    dailyLogs,
    logDailyTask,
    completeDailyLog,
    restartChallenge,
    abandonChallenge,
    getTodayProgress,
  } = useChallengeStore();

  // Local state -----------------------------------------------------------
  const [refreshing, setRefreshing] = useState(false);
  const [abandonModalVisible, setAbandonModalVisible] = useState(false);
  const [restartModalVisible, setRestartModalVisible] = useState(false);

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

  // Handlers --------------------------------------------------------------
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleToggleTask = useCallback(
    async (taskId: string, currentlyCompleted: boolean) => {
      if (!activeEnrollment) return;
      await logDailyTask(activeEnrollment.id, taskId, !currentlyCompleted);
    },
    [activeEnrollment, logDailyTask],
  );

  const handleCompleteDay = useCallback(async () => {
    if (!activeEnrollment) return;
    await completeDailyLog(activeEnrollment.id);
  }, [activeEnrollment, completeDailyLog]);

  const handleAbandon = useCallback(async () => {
    if (!activeEnrollment) return;
    await abandonChallenge(activeEnrollment.id);
    setAbandonModalVisible(false);
    router.back();
  }, [activeEnrollment, abandonChallenge, router]);

  const handleRestart = useCallback(async () => {
    if (!activeEnrollment) return;
    await restartChallenge(activeEnrollment.id);
    setRestartModalVisible(false);
  }, [activeEnrollment, restartChallenge]);

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
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
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
        {/* Fail Warning                                                       */}
        {/* ----------------------------------------------------------------- */}
        {isPast8PM() && incompleteTasks.length > 0 && (
          <Animated.View entering={FadeInDown.delay(175)}>
            <Card
              style={{
                marginBottom: spacing.lg,
                backgroundColor: `${colors.accent.danger ?? '#F44336'}20`,
                borderWidth: 1,
                borderColor: colors.accent.danger ?? '#F44336',
              }}
            >
              <Text
                style={[
                  typography.bodyBold,
                  { color: colors.accent.danger ?? '#F44336' },
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
                          color: status === 'future' ? colors.text.muted : '#FFFFFF',
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
                borderColor: colors.accent.danger ?? '#F44336',
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
                  color: colors.accent.danger ?? '#F44336',
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
