// =============================================================================
// TRANSFORMR — ActiveChallengeCard
// Compact dashboard card for the user's active challenge enrollment.
// Shows a progress ring, mini task checklist, and day progress.
// =============================================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import type { ChallengeDefinition, ChallengeEnrollment, ChallengeDailyLog } from '@/types/database';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ActiveChallengeCardProps {
  definition:  ChallengeDefinition;
  enrollment:  ChallengeEnrollment;
  todayLog:    ChallengeDailyLog | null;
  onPress:     () => void;
  style?:      ViewStyle;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ActiveChallengeCard = React.memo(function ActiveChallengeCard({
  definition,
  enrollment,
  todayLog,
  onPress,
  style,
}: ActiveChallengeCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const currentDay   = enrollment.current_day ?? 1;
  const totalDays    = definition.duration_days;
  const dayProgress  = totalDays > 0 ? Math.min((currentDay - 1) / totalDays, 1) : 0;
  const restartCount = enrollment.restart_count ?? 0;

  // Extract up to 4 task IDs from the rules
  const taskIds = useMemo((): string[] => {
    const rules = definition.rules as Record<string, unknown>;
    if (Array.isArray(rules.tasks)) {
      return (rules.tasks as { id: string }[])
        .slice(0, 4)
        .map((t) => t.id);
    }
    return [];
  }, [definition.rules]);

  const tasksCompleted = useMemo((): number => {
    if (!todayLog) return 0;
    return taskIds.filter((id) => todayLog.tasks_completed[id] === true).length;
  }, [todayLog, taskIds]);

  const ringProgress = taskIds.length > 0 ? tasksCompleted / taskIds.length : 0;

  // Resolve accent color from definition.color token (maps to colors.accent.*)
  const accentColorResolved = definition.color
    ? (colors.accent as unknown as Record<string, string | undefined>)[definition.color]
    : undefined;
  const accentColor = accentColorResolved ?? colors.accent.primary;

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={style}>
      <Card
        onPress={onPress}
        style={[styles.card, { borderLeftWidth: 3, borderLeftColor: accentColor }]}
        accessibilityLabel={`Active challenge: ${definition.name}, day ${currentDay} of ${totalDays}`}
        accessibilityRole="button"
      >
        <View style={styles.topRow}>
          {/* Left: name + day info */}
          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text
                style={[typography.bodyBold, { color: colors.text.primary, flex: 1 }]}
                numberOfLines={1}
              >
                {definition.name}
              </Text>
              {restartCount > 0 && (
                <Badge
                  label={`Restart ${restartCount}`}
                  variant="warning"
                  size="sm"
                  style={{ marginLeft: spacing.sm }}
                />
              )}
            </View>
            <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]}>
              {`Day ${currentDay} of ${totalDays}`}
            </Text>
          </View>

          {/* Right: progress ring */}
          <ProgressRing
            progress={ringProgress}
            size={56}
            strokeWidth={5}
            color={todayLog?.all_tasks_completed ? colors.accent.success : accentColor}
          >
            <Text style={[typography.captionBold, { color: colors.text.primary, fontSize: 11 }]}>
              {`${tasksCompleted}/${taskIds.length}`}
            </Text>
          </ProgressRing>
        </View>

        {/* Task checklist (max 4) */}
        {taskIds.length > 0 && (
          <View style={[styles.taskList, { marginTop: spacing.sm }]}>
            {taskIds.map((id) => {
              const done = todayLog?.tasks_completed[id] === true;
              return (
                <View key={id} style={styles.taskRow}>
                  <Ionicons
                    name={done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={done ? colors.accent.success : colors.text.muted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      typography.tiny,
                      { color: done ? colors.text.muted : colors.text.secondary, flex: 1 },
                    ]}
                    numberOfLines={1}
                  >
                    {id.replace(/_/g, ' ')}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* CTA when no log yet */}
        {!todayLog && (
          <View
            style={[
              styles.ctaRow,
              { marginTop: spacing.sm, backgroundColor: colors.background.tertiary, borderRadius: borderRadius.sm, padding: spacing.sm },
            ]}
          >
            <Ionicons name="play-circle-outline" size={14} color={accentColor} style={{ marginRight: 4 }} />
            <Text style={[typography.captionBold, { color: accentColor }]}>
              Log today's tasks
            </Text>
          </View>
        )}

        {/* Day-of-challenge progress bar (thin, bottom) */}
        <View
          style={[
            styles.progressTrack,
            { marginTop: spacing.sm, backgroundColor: colors.border.subtle, borderRadius: borderRadius.sm },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(dayProgress * 100)}%`, backgroundColor: accentColor, borderRadius: borderRadius.sm },
            ]}
          />
        </View>
      </Card>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card:          { paddingLeft: 12 },
  topRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameBlock:     { flex: 1, marginRight: 12 },
  nameRow:       { flexDirection: 'row', alignItems: 'center' },
  taskList:      {},
  taskRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  ctaRow:        { flexDirection: 'row', alignItems: 'center' },
  progressTrack: { height: 3, width: '100%' },
  progressFill:  { height: 3 },
});
