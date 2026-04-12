// =============================================================================
// TRANSFORMR -- Mobility & Recovery Screen
// =============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import { ProgressBar } from '@components/ui/ProgressBar';
import { formatTimerDisplay } from '@utils/formatters';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { Skeleton } from '@components/ui/Skeleton';
import { supabase } from '@services/supabase';
import type { MobilitySession } from '@app-types/database';

interface StretchExercise {
  id: string;
  name: string;
  targetMuscles: string[];
  durationSeconds: number;
  instructions: string;
  isCompleted: boolean;
}

interface MobilityRoutine {
  id: string;
  name: string;
  description: string;
  exercises: StretchExercise[];
  totalDurationMinutes: number;
  isAiGenerated: boolean;
}

function getStretch(index: number): StretchExercise {
  const item = STRETCH_LIBRARY[index];
  if (!item) throw new Error(`Stretch index ${index} not found`);
  return item;
}

const STRETCH_LIBRARY: StretchExercise[] = [
  { id: 's1', name: 'Hip Flexor Stretch', targetMuscles: ['hip flexors', 'quads'], durationSeconds: 30, instructions: 'Kneel on one knee, push hips forward until you feel a stretch in the front of the hip. Hold.', isCompleted: false },
  { id: 's2', name: 'Pigeon Pose', targetMuscles: ['glutes', 'hip rotators'], durationSeconds: 45, instructions: 'From a plank, bring one knee forward between your hands. Lower your hips and hold.', isCompleted: false },
  { id: 's3', name: 'Hamstring Stretch', targetMuscles: ['hamstrings'], durationSeconds: 30, instructions: 'Sit with one leg extended. Reach toward your toes, keeping your back straight.', isCompleted: false },
  { id: 's4', name: 'Chest Doorway Stretch', targetMuscles: ['chest', 'front delts'], durationSeconds: 30, instructions: 'Place forearm on a doorframe at 90 degrees. Step through until you feel a stretch in your chest.', isCompleted: false },
  { id: 's5', name: 'Lat Stretch', targetMuscles: ['lats', 'teres major'], durationSeconds: 30, instructions: 'Grab a pole or doorframe overhead. Lean away and let your lat stretch fully.', isCompleted: false },
  { id: 's6', name: 'Shoulder Cross-Body Stretch', targetMuscles: ['rear delts', 'upper back'], durationSeconds: 30, instructions: 'Pull one arm across your body at shoulder height. Hold and breathe.', isCompleted: false },
  { id: 's7', name: 'Cat-Cow Stretch', targetMuscles: ['spine', 'core'], durationSeconds: 45, instructions: 'On all fours, alternate between arching and rounding your back. Move slowly.', isCompleted: false },
  { id: 's8', name: 'Quad Stretch', targetMuscles: ['quads'], durationSeconds: 30, instructions: 'Standing, grab your foot behind you and pull heel toward glute. Keep knees together.', isCompleted: false },
  { id: 's9', name: 'Calf Stretch', targetMuscles: ['calves', 'achilles'], durationSeconds: 30, instructions: 'Step one foot back, press heel into ground, lean forward into wall.', isCompleted: false },
  { id: 's10', name: 'Child\'s Pose', targetMuscles: ['lats', 'lower back', 'hips'], durationSeconds: 45, instructions: 'Kneel and sit back on your heels, arms extended overhead on the ground. Breathe deeply.', isCompleted: false },
];

export default function MobilityScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();

  const [routines, setRoutines] = useState<MobilityRoutine[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<MobilityRoutine | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [recentSessions, setRecentSessions] = useState<MobilitySession[]>([]);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: sessions } = await supabase
          .from('mobility_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(10);

        if (sessions) {
          setRecentSessions(sessions as MobilitySession[]);
        }

        // Generate recommended routines (AI-driven in production)
        const pushDayRoutine: MobilityRoutine = {
          id: 'r1',
          name: 'Post-Push Day Recovery',
          description: 'Stretches targeting chest, shoulders, and triceps',
          exercises: [
            { ...getStretch(3), isCompleted: false },
            { ...getStretch(5), isCompleted: false },
            { ...getStretch(4), isCompleted: false },
            { ...getStretch(6), isCompleted: false },
            { ...getStretch(9), isCompleted: false },
          ],
          totalDurationMinutes: 8,
          isAiGenerated: true,
        };

        const legDayRoutine: MobilityRoutine = {
          id: 'r2',
          name: 'Post-Leg Day Recovery',
          description: 'Stretches targeting quads, hamstrings, hips, and glutes',
          exercises: [
            { ...getStretch(0), isCompleted: false },
            { ...getStretch(1), isCompleted: false },
            { ...getStretch(2), isCompleted: false },
            { ...getStretch(7), isCompleted: false },
            { ...getStretch(8), isCompleted: false },
            { ...getStretch(9), isCompleted: false },
          ],
          totalDurationMinutes: 10,
          isAiGenerated: true,
        };

        const fullBodyRoutine: MobilityRoutine = {
          id: 'r3',
          name: 'Full Body Mobility',
          description: 'Complete stretching routine for all major muscle groups',
          exercises: STRETCH_LIBRARY.map((s) => ({ ...s, isCompleted: false })),
          totalDurationMinutes: 15,
          isAiGenerated: false,
        };

        setRoutines([pushDayRoutine, legDayRoutine, fullBodyRoutine]);
      } catch {
        // Silently fail; routines will use defaults
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            handleStretchComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleStartRoutine = useCallback(
    (routine: MobilityRoutine) => {
      hapticLight();
      const resetRoutine = {
        ...routine,
        exercises: routine.exercises.map((e) => ({ ...e, isCompleted: false })),
      };
      setActiveRoutine(resetRoutine);
      setActiveExerciseIndex(0);
      setCompletedCount(0);
      setTimerSeconds(resetRoutine.exercises[0]?.durationSeconds ?? 30);
      setIsTimerRunning(false);
    },
    [],
  );

  const handleStartTimer = useCallback(() => {
    setIsTimerRunning(true);
    hapticLight();
  }, []);

  const handlePauseTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const handleStretchComplete = useCallback(async () => {
    if (!activeRoutine) return;
    await hapticSuccess();

    const updatedExercises = activeRoutine.exercises.map((e, idx) =>
      idx === activeExerciseIndex ? { ...e, isCompleted: true } : e,
    );

    const newCompleted = completedCount + 1;
    setCompletedCount(newCompleted);

    if (activeExerciseIndex < activeRoutine.exercises.length - 1) {
      const nextIdx = activeExerciseIndex + 1;
      setActiveExerciseIndex(nextIdx);
      const nextExercise = updatedExercises[nextIdx];
      if (nextExercise) {
        setTimerSeconds(nextExercise.durationSeconds);
      }
      setIsTimerRunning(false);
      setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
    } else {
      setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
      await hapticSuccess();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('mobility_sessions').insert({
            user_id: user.id,
            target_muscles: activeRoutine.exercises.flatMap((e) => e.targetMuscles),
            duration_minutes: activeRoutine.totalDurationMinutes,
            completed_at: new Date().toISOString(),
          });
        }
      } catch {
        // Non-critical failure
      }
    }
  }, [activeRoutine, activeExerciseIndex, completedCount]);

  const handleSkipStretch = useCallback(() => {
    if (!activeRoutine) return;
    hapticLight();

    if (activeExerciseIndex < activeRoutine.exercises.length - 1) {
      const nextIdx = activeExerciseIndex + 1;
      setActiveExerciseIndex(nextIdx);
      const nextExercise = activeRoutine.exercises[nextIdx];
      if (nextExercise) {
        setTimerSeconds(nextExercise.durationSeconds);
      }
      setIsTimerRunning(false);
    }
  }, [activeRoutine, activeExerciseIndex]);

  const handleExitRoutine = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveRoutine(null);
    setIsTimerRunning(false);
  }, []);

  const activeExercise = activeRoutine?.exercises[activeExerciseIndex] ?? null;
  const routineProgress = activeRoutine
    ? completedCount / activeRoutine.exercises.length
    : 0;
  const isRoutineComplete = activeRoutine
    ? completedCount >= activeRoutine.exercises.length
    : false;

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, padding: spacing.lg }]}>
        <Skeleton variant="card" height={200} style={{ marginBottom: spacing.md }} />
        <Skeleton variant="card" height={200} style={{ marginBottom: spacing.md }} />
        <Skeleton variant="card" height={200} />
      </View>
    );
  }

  // Active routine player
  if (activeRoutine) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Routine Header */}
          <View style={styles.routineHeader}>
            <Pressable onPress={handleExitRoutine} hitSlop={12} accessibilityLabel="Exit routine" accessibilityRole="button">
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </Pressable>
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary, flex: 1, textAlign: 'center' },
              ]}
            >
              {activeRoutine.name}
            </Text>
            <Text style={[typography.monoCaption, { color: colors.text.muted, fontWeight: '700' }]}>
              {completedCount}/{activeRoutine.exercises.length}
            </Text>
          </View>

          {/* Progress Bar */}
          <ProgressBar
            progress={routineProgress}
            style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
          />

          {isRoutineComplete ? (
            <View style={[styles.completionBlock, { marginTop: spacing.xxxl }]}>
              <Ionicons name="checkmark-circle" size={80} color={colors.accent.success} />
              <Text
                style={[
                  typography.h1,
                  { color: colors.text.primary, marginTop: spacing.lg },
                ]}
              >
                Routine Complete!
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
                ]}
              >
                Great work on your mobility. Your muscles will thank you.
              </Text>
              <Button
                title="Done"
                onPress={handleExitRoutine}
                style={{ marginTop: spacing.xl }}
              />
            </View>
          ) : activeExercise ? (
            <>
              {/* Timer Display */}
              <View style={[styles.timerBlock, { marginBottom: spacing.xl }]}>
                <ProgressRing
                  progress={
                    activeExercise.durationSeconds > 0
                      ? 1 - timerSeconds / activeExercise.durationSeconds
                      : 0
                  }
                  size={180}
                  strokeWidth={10}
                  color={colors.accent.primary}
                >
                  <Text style={[typography.hero, { color: colors.text.primary, fontSize: 48 }]}>
                    {formatTimerDisplay(timerSeconds)}
                  </Text>
                </ProgressRing>
              </View>

              {/* Exercise Info */}
              <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h2, { color: colors.text.primary }]}>
                  {activeExercise.name}
                </Text>
                <View style={[styles.muscleRow, { marginTop: spacing.sm, gap: spacing.xs }]}>
                  {activeExercise.targetMuscles.map((muscle) => (
                    <Badge key={muscle} label={muscle} size="sm" variant="info" />
                  ))}
                </View>
                <Text
                  style={[
                    typography.body,
                    { color: colors.text.secondary, marginTop: spacing.md, lineHeight: 24 },
                  ]}
                >
                  {activeExercise.instructions}
                </Text>
              </Card>

              {/* Controls */}
              <View style={[styles.controlsRow, { gap: spacing.sm }]}>
                <Button
                  title="Skip"
                  variant="ghost"
                  onPress={handleSkipStretch}
                  style={{ flex: 1 }}
                />
                {isTimerRunning ? (
                  <Button
                    title="Pause"
                    variant="secondary"
                    onPress={handlePauseTimer}
                    style={{ flex: 2 }}
                    leftIcon={<Ionicons name="pause" size={20} color={colors.text.primary} />}
                  />
                ) : (
                  <Button
                    title={timerSeconds === activeExercise.durationSeconds ? 'Start' : 'Resume'}
                    onPress={handleStartTimer}
                    style={{ flex: 2 }}
                    leftIcon={<Ionicons name="play" size={20} color="#FFFFFF" />}
                  />
                )}
                <Button
                  title="Done"
                  variant="outline"
                  onPress={() => {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setIsTimerRunning(false);
                    handleStretchComplete();
                  }}
                  style={{ flex: 1 }}
                />
              </View>

              {/* Exercise List Overview */}
              <View style={{ marginTop: spacing.xl }}>
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.text.muted, marginBottom: spacing.sm },
                  ]}
                >
                  Routine Overview
                </Text>
                {activeRoutine.exercises.map((exercise, idx) => (
                  <Pressable
                    key={exercise.id}
                    onPress={() => {
                      setActiveExerciseIndex(idx);
                      setTimerSeconds(exercise.durationSeconds);
                      setIsTimerRunning(false);
                      hapticLight();
                    }}
                    style={[
                      styles.exerciseListItem,
                      {
                        paddingVertical: spacing.sm,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border.subtle,
                        opacity: exercise.isCompleted ? 0.5 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.exerciseIndex,
                        {
                          backgroundColor:
                            idx === activeExerciseIndex
                              ? colors.accent.primary
                              : exercise.isCompleted
                                ? colors.accent.success
                                : colors.background.tertiary,
                          borderRadius: 12,
                          width: 24,
                          height: 24,
                        },
                      ]}
                    >
                      {exercise.isCompleted ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : (
                        <Text
                          style={[
                            typography.tiny,
                            {
                              color:
                                idx === activeExerciseIndex ? '#FFFFFF' : colors.text.muted,
                            },
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        typography.body,
                        {
                          color:
                            idx === activeExerciseIndex
                              ? colors.text.primary
                              : colors.text.secondary,
                          flex: 1,
                          marginLeft: spacing.md,
                        },
                      ]}
                    >
                      {exercise.name}
                    </Text>
                    <Text style={[typography.monoCaption, { color: colors.text.muted }]}>
                      {exercise.durationSeconds}s
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  // Routine selection view
  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Recommended Routines */}
        <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
          Recommended Routines
        </Text>
        {routines.map((routine) => (
          <Card key={routine.id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.routineCardHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.routineNameRow}>
                  <Text style={[typography.h3, { color: colors.text.primary }]}>
                    {routine.name}
                  </Text>
                  {routine.isAiGenerated && (
                    <Badge
                      label="AI"
                      variant="info"
                      size="sm"
                      style={{ marginLeft: spacing.sm }}
                    />
                  )}
                </View>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text.secondary, marginTop: spacing.xs },
                  ]}
                >
                  {routine.description}
                </Text>
                <View style={[styles.routineMeta, { marginTop: spacing.sm, gap: spacing.md }]}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.text.muted} />
                    <Text style={[typography.monoCaption, { color: colors.text.muted, marginLeft: 4 }]}>
                      {routine.totalDurationMinutes} min
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="fitness-outline" size={14} color={colors.text.muted} />
                    <Text style={[typography.monoCaption, { color: colors.text.muted, marginLeft: 4 }]}>
                      {routine.exercises.length} stretches
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Exercise preview */}
            <View style={{ marginTop: spacing.md }}>
              {routine.exercises.slice(0, 3).map((exercise, idx) => (
                <Text
                  key={exercise.id}
                  style={[
                    typography.caption,
                    { color: colors.text.muted, marginTop: idx > 0 ? 2 : 0 },
                  ]}
                >
                  {idx + 1}. {exercise.name} ({exercise.durationSeconds}s)
                </Text>
              ))}
              {routine.exercises.length > 3 && (
                <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 2 }]}>
                  +{routine.exercises.length - 3} more
                </Text>
              )}
            </View>

            <Button
              title="Start Routine"
              onPress={() => handleStartRoutine(routine)}
              fullWidth
              style={{ marginTop: spacing.md }}
              leftIcon={<Ionicons name="play" size={18} color="#FFFFFF" />}
            />
          </Card>
        ))}

        {/* Completion History */}
        {recentSessions.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary, marginBottom: spacing.md },
              ]}
            >
              Recent Sessions
            </Text>
            {recentSessions.map((session) => (
              <Card key={session.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.sessionRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.accent.success} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                      Mobility Session
                    </Text>
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      <Text style={typography.monoCaption}>{session.duration_minutes ?? 0}</Text> min |{' '}
                      <Text style={typography.monoCaption}>{session.target_muscles?.length ?? 0}</Text> muscle groups
                    </Text>
                  </View>
                  {session.completed_at && (
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      {new Date(session.completed_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerBlock: {
    alignItems: 'center',
  },
  completionBlock: {
    alignItems: 'center',
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIndex: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routineNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
