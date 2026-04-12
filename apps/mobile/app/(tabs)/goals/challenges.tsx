// =============================================================================
// TRANSFORMR -- Challenge Center
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import { useChallengeStore } from '@stores/challengeStore';
import { hapticLight } from '@utils/haptics';
import { supabase } from '@services/supabase';
import type { ChallengeDefinition, ChallengeDifficulty } from '@app-types/database';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  mental_toughness: 'Mental Toughness',
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  running: 'Running',
  strength: 'Strength',
  lifestyle: 'Lifestyle',
  custom: 'Custom',
};

const DIFFICULTY_VARIANTS: Record<ChallengeDifficulty, 'success' | 'warning' | 'danger' | 'info'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
  extreme: 'info',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChallengesScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    challengeDefinitions,
    activeEnrollment,
    enrollments,
    todayLog,
    isLoading,
    fetchChallengeDefinitions,
    fetchActiveEnrollment,
    fetchEnrollments,
    getTodayProgress,
  } = useChallengeStore();

  // Fetch data on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await Promise.all([
        fetchChallengeDefinitions(),
        fetchActiveEnrollment(user.id),
        fetchEnrollments(user.id),
      ]);
    }
    load();
  }, [fetchChallengeDefinitions, fetchActiveEnrollment, fetchEnrollments]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await Promise.all([
        fetchChallengeDefinitions(),
        fetchActiveEnrollment(user.id),
        fetchEnrollments(user.id),
      ]);
    }
    setRefreshing(false);
  }, [fetchChallengeDefinitions, fetchActiveEnrollment, fetchEnrollments]);

  // Active challenge definition
  const activeDef = useMemo(() => {
    if (!activeEnrollment?.challenge_id) return null;
    return challengeDefinitions.find((d) => d.id === activeEnrollment.challenge_id) ?? null;
  }, [activeEnrollment, challengeDefinitions]);

  // Build today's task list from the active challenge definition + todayLog
  const todayTasks = useMemo(() => {
    if (!activeDef) return [];
    return (activeDef.rules?.tasks ?? []).map((task) => ({
      label: task.label,
      completed: todayLog?.tasks_completed?.[task.id] === true,
    }));
  }, [activeDef, todayLog]);

  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayTotal = todayTasks.length;

  // Calculate streak from consecutive completed daily logs
  const streak = useMemo(() => {
    return activeEnrollment?.current_day
      ? (activeEnrollment.current_day - 1)
      : 0;
  }, [activeEnrollment]);

  // Completed challenges
  const completedEnrollments = useMemo(() => {
    return enrollments
      .filter((e) => e.status === 'completed')
      .map((e) => {
        const def = challengeDefinitions.find((d) => d.id === e.challenge_id);
        return {
          id: e.id,
          name: def?.name ?? 'Challenge',
          completedAt: e.actual_end_date ?? e.created_at ?? '',
          totalDays: def?.duration_days ?? 0,
        };
      });
  }, [enrollments, challengeDefinitions]);

  // Only show system challenges in browse (exclude any the user already has active)
  const browseChallenges = useMemo(() => {
    return challengeDefinitions.filter((d) => d.is_system);
  }, [challengeDefinitions]);

  if (isLoading && challengeDefinitions.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <ListSkeleton />
      </View>
    );
  }

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
        {/* Active Challenge Card                                              */}
        {/* ----------------------------------------------------------------- */}
        {activeEnrollment && activeDef && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <Pressable
              onPress={() => {
                hapticLight();
                router.push('/(tabs)/goals/challenge-active');
              }}
              accessibilityLabel={`View active challenge ${activeDef.name}`}
            >
              <Card style={{ marginBottom: spacing.lg }}>
                <View style={styles.activeHeader}>
                  <View style={{ flex: 1 }}>
                    <Badge label="ACTIVE" variant="success" size="sm" />
                    <Text
                      style={[
                        typography.h3,
                        { color: colors.text.primary, marginTop: spacing.sm },
                      ]}
                    >
                      {activeDef.icon ? `${activeDef.icon} ` : ''}{activeDef.name}
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.text.secondary, marginTop: spacing.xs },
                      ]}
                    >
                      Day {activeEnrollment.current_day ?? 1} of {activeDef.duration_days}
                    </Text>
                    {(activeEnrollment.restart_count ?? 0) > 0 && (
                      <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 2 }]}>
                        Restart #{activeEnrollment.restart_count}
                      </Text>
                    )}
                  </View>

                  <ProgressRing
                    progress={(activeEnrollment.current_day ?? 1) / activeDef.duration_days}
                    size={72}
                    strokeWidth={6}
                    color={activeDef.color ?? undefined}
                  >
                    <Text style={[typography.statSmall, { color: colors.accent.primary }]}>
                      {Math.round(
                        ((activeEnrollment.current_day ?? 1) / activeDef.duration_days) * 100,
                      )}
                      %
                    </Text>
                  </ProgressRing>
                </View>

                {/* Today's task summary */}
                <View
                  style={[
                    styles.taskSummary,
                    {
                      backgroundColor: colors.background.tertiary,
                      borderRadius: borderRadius.sm,
                      padding: spacing.md,
                      marginTop: spacing.md,
                    },
                  ]}
                >
                  <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                    Today's Tasks
                  </Text>
                  {todayTasks.map((task, i) => (
                    <View key={i} style={[styles.taskRow, { marginTop: spacing.xs }]}>
                      <Text style={{ fontSize: 14 }}>
                        {task.completed ? '\u2705' : '\u2B1C'}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: task.completed
                              ? colors.text.secondary
                              : colors.text.primary,
                            marginLeft: spacing.sm,
                            textDecorationLine: task.completed ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {task.label}
                      </Text>
                    </View>
                  ))}
                  <Text
                    style={[
                      typography.tiny,
                      {
                        color: colors.accent.primary,
                        marginTop: spacing.sm,
                        textAlign: 'right',
                      },
                    ]}
                  >
                    <Text style={typography.monoBody}>{todayCompleted}/{todayTotal}</Text> complete {'  '}
                    {streak > 0 ? `\uD83D\uDD25 ${streak} day streak` : ''}
                  </Text>
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Browse Challenges                                                  */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, marginBottom: spacing.md },
            ]}
          >
            Browse Challenges
          </Text>
        </Animated.View>

        <View style={styles.grid}>
          {browseChallenges.map((def, index) => (
            <Animated.View
              key={def.id}
              entering={FadeInDown.delay(250 + index * 50)}
              style={styles.gridItem}
            >
              <Pressable
                onPress={() => {
                  hapticLight();
                  router.push(
                    { pathname: '/(tabs)/goals/challenge-detail', params: { id: def.id } },
                  );
                }}
                accessibilityLabel={`View challenge ${def.name}`}
              >
                <Card>
                  <View style={styles.programHeader}>
                    <Text style={{ fontSize: 28 }}>{def.icon ?? '\uD83C\uDFC6'}</Text>
                    {def.difficulty && (
                      <Badge
                        label={def.difficulty}
                        variant={DIFFICULTY_VARIANTS[def.difficulty]}
                        size="sm"
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      typography.bodyBold,
                      { color: colors.text.primary, marginTop: spacing.sm },
                    ]}
                    numberOfLines={1}
                  >
                    {def.name}
                  </Text>
                  <Text
                    style={[
                      typography.tiny,
                      { color: colors.accent.primary, marginTop: 2 },
                    ]}
                  >
                    {def.duration_days} days
                    {def.category ? ` \u2022 ${CATEGORY_LABELS[def.category] ?? def.category}` : ''}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: colors.text.secondary,
                        marginTop: spacing.xs,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {def.description}
                  </Text>
                </Card>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Create Custom Challenge */}
        <Animated.View entering={FadeInDown.delay(900)}>
          <Button
            title="Create Custom Challenge"
            onPress={() => {
              hapticLight();
              router.push('/(tabs)/goals/challenge-builder');
            }}
            accessibilityLabel="Create a custom challenge"
            fullWidth
            style={{ marginTop: spacing.lg }}
          />
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Completed Challenges                                               */}
        {/* ----------------------------------------------------------------- */}
        {completedEnrollments.length > 0 && (
          <>
            <Animated.View entering={FadeInDown.delay(950)}>
              <Text
                style={[
                  typography.h3,
                  {
                    color: colors.text.primary,
                    marginTop: spacing.xl,
                    marginBottom: spacing.md,
                  },
                ]}
              >
                Completed
              </Text>
            </Animated.View>

            {completedEnrollments.map((challenge, index) => (
              <Animated.View
                key={challenge.id}
                entering={FadeInDown.delay(1000 + index * 80)}
              >
                <Card style={{ marginBottom: spacing.md }}>
                  <View style={styles.completedRow}>
                    <Text style={{ fontSize: 24 }}>{'\uD83C\uDFC6'}</Text>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text
                        style={[typography.bodyBold, { color: colors.text.primary }]}
                      >
                        {challenge.name}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.text.secondary, marginTop: 2 },
                        ]}
                      >
                        Completed {challenge.completedAt} {'\u2022'}{' '}
                        {challenge.totalDays} days
                      </Text>
                    </View>
                    <Badge label="Done" variant="success" size="sm" />
                  </View>
                </Card>
              </Animated.View>
            ))}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 24 },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskSummary: {},
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
