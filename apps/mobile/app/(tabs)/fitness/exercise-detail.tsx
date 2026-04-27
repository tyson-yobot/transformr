// =============================================================================
// TRANSFORMR -- Exercise Detail Screen
// =============================================================================

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { Ionicons } from '@expo/vector-icons';
import { Icon3D } from '@components/ui/Icon3D';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { DetailSkeleton } from '@components/ui/ScreenSkeleton';
import { hapticLight } from '@utils/haptics';
import { formatWeight, formatDate, formatSetDisplay } from '@utils/formatters';
import { supabase } from '@services/supabase';
import { useWorkoutStore } from '@stores/workoutStore';
import type { Exercise, PersonalRecord, WorkoutSet } from '@app-types/database';
import { BodyMap } from '@components/ui/BodyMap';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { EmptyStateBackground } from '@components/ui/EmptyStateBackground';
import { musclesToBodyParts } from '@utils/muscleMapping';
import type { BodyPart } from '@components/ui/BodyMap';

interface RecentPerformance {
  date: string;
  bestSet: string;
  totalVolume: number;
}

export default function ExerciseDetailScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  const setPendingExerciseId = useWorkoutStore((s) => s.setPendingExerciseId);
  const activeSession = useWorkoutStore((s) => s.activeSession);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [recentPerformance, setRecentPerformance] = useState<RecentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const primaryParts: BodyPart[] = useMemo(
    () => (exercise ? musclesToBodyParts(exercise.muscle_groups ?? []) : []),
    [exercise],
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.exerciseDetail} />,
    });
  }, [navigation]);

  useEffect(() => {
    const loadExercise = async () => {
      if (!exerciseId) {
        setError('No exercise ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        const [exerciseRes, prsRes, setsRes] = await Promise.all([
          supabase.from('exercises').select('*').eq('id', exerciseId).single(),
          user
            ? supabase
                .from('personal_records')
                .select('*')
                .eq('user_id', user.id)
                .eq('exercise_id', exerciseId)
                .order('achieved_at', { ascending: false })
            : Promise.resolve({ data: null, error: null }),
          user
            ? supabase
                .from('workout_sets')
                .select('*, workout_sessions!inner(user_id, completed_at)')
                .eq('exercise_id', exerciseId)
                .eq('workout_sessions.user_id', user.id)
                .not('workout_sessions.completed_at', 'is', null)
                .order('logged_at', { ascending: false })
                .limit(50)
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (exerciseRes.error) throw exerciseRes.error;
        setExercise(exerciseRes.data as Exercise);

        if (prsRes.data) {
          setPrs(prsRes.data as PersonalRecord[]);
        }

        if (setsRes.data && setsRes.data.length > 0) {
          // Group sets by session date
          const sessionMap = new Map<string, WorkoutSet[]>();
          for (const set of setsRes.data) {
            const sessionData = (set as Record<string, unknown>).workout_sessions as
              | { completed_at: string }
              | null;
            const date = sessionData?.completed_at?.split('T')[0] ?? 'unknown';
            const existing = sessionMap.get(date) ?? [];
            existing.push(set as WorkoutSet);
            sessionMap.set(date, existing);
          }

          const performances: RecentPerformance[] = [];
          for (const [date, sets] of sessionMap.entries()) {
            let bestVolume = 0;
            let bestSet = '';
            let totalVolume = 0;

            for (const set of sets) {
              const weight = set.weight ?? 0;
              const reps = set.reps ?? 0;
              const vol = weight * reps;
              totalVolume += vol;
              if (vol > bestVolume) {
                bestVolume = vol;
                bestSet = formatSetDisplay(weight, reps);
              }
            }

            performances.push({ date, bestSet, totalVolume });
          }

          setRecentPerformance(performances.slice(0, 10));
        }
      } catch (err: unknown) {
        setError('Failed to load exercise. Pull to refresh.');
      } finally {
        setLoading(false);
      }
    };

    loadExercise();
  }, [exerciseId]);

  const handleAddToWorkout = useCallback(() => {
    hapticLight();
    if (!activeSession) {
      // No active workout — navigate to workout player which will start one
      router.push({ pathname: '/(tabs)/fitness/workout-player' as never, params: { exerciseId } });
      return;
    }
    // Signal workout-player via store, then navigate back to it
    setPendingExerciseId(exerciseId);
    router.back();
  }, [router, exerciseId, activeSession, setPendingExerciseId]);

  if (loading) {
    return (
      <DetailSkeleton style={{ backgroundColor: colors.background.primary }} />
    );
  }

  if (error || !exercise) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background.primary, overflow: 'hidden' }]}>
        <EmptyStateBackground query="barbell dumbbell dark gym" opacity={0.15} />
        <Icon3D name="warning" size={48} />
        <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.md }]}>
          {error ?? 'Exercise not found'}
        </Text>
        <Button
          title="Go Back"
          variant="outline"
          onPress={() => { hapticLight(); router.back(); }}
          accessibilityLabel="Go back to previous screen"
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise Header */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.h1, { color: colors.text.primary }]}>{exercise.name}</Text>
          <View style={[styles.tagRow, { marginTop: spacing.md, gap: spacing.sm }]}>
            {exercise.category && <Badge label={exercise.category} variant="info" />}
            {exercise.equipment && (
              <Badge label={exercise.equipment.replace(/_/g, ' ')} />
            )}
            {exercise.difficulty && (
              <Badge
                label={exercise.difficulty}
                variant={
                  exercise.difficulty === 'beginner'
                    ? 'success'
                    : exercise.difficulty === 'intermediate'
                      ? 'warning'
                      : 'danger'
                }
              />
            )}
            {exercise.is_compound && <Badge label="Compound" variant="info" />}
          </View>
        </View>

        {/* Muscle Groups */}
        {(exercise.muscle_groups ?? []).length > 0 && (
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
              Muscle Activation
            </Text>
            <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
              <BodyMap mode="muscle" highlightPrimary={primaryParts} showBack size="md" />
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent.primary }} />
                <Text style={[typography.captionBold, { color: colors.text.secondary }]}>PRIMARY MUSCLES</Text>
              </View>
              {exercise.muscle_groups.map((m) => (
                <Text key={m} style={[typography.body, { color: colors.text.primary, marginLeft: spacing.lg, marginBottom: 2 }]}>
                  {m.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}
                </Text>
              ))}
            </View>
          </Card>
        )}

        {/* Instructions */}
        {exercise.instructions && (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Icon3D name="document" size={20} />
              <Text
                style={[
                  typography.h3,
                  { color: colors.text.primary, marginLeft: spacing.sm },
                ]}
              >
                Instructions
              </Text>
            </View>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.md, lineHeight: 24 },
              ]}
            >
              {exercise.instructions}
            </Text>
          </Card>
        )}

        {/* Tips */}
        {exercise.tips && (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Icon3D name="bulb" size={20} />
              <Text
                style={[
                  typography.h3,
                  { color: colors.text.primary, marginLeft: spacing.sm },
                ]}
              >
                Tips
              </Text>
            </View>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.md },
              ]}
            >
              {exercise.tips}
            </Text>
          </Card>
        )}

        {/* Common Mistakes */}
        {exercise.common_mistakes && (
          <Card
            style={{
              marginBottom: spacing.lg,
              borderLeftWidth: 3,
              borderLeftColor: colors.accent.danger,
            }}
          >
            <View style={styles.sectionHeader}>
              <Icon3D name="warning" size={20} />
              <Text
                style={[
                  typography.h3,
                  { color: colors.text.primary, marginLeft: spacing.sm },
                ]}
              >
                Common Mistakes
              </Text>
            </View>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.md },
              ]}
            >
              {exercise.common_mistakes}
            </Text>
          </Card>
        )}

        {/* PR History */}
        {prs.length > 0 && (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Icon3D name="trophy" size={20} />
              <Text
                style={[
                  typography.h3,
                  { color: colors.text.primary, marginLeft: spacing.sm },
                ]}
              >
                PR History
              </Text>
            </View>
            {prs.map((pr) => (
              <View
                key={pr.id}
                style={[
                  styles.prRow,
                  {
                    marginTop: spacing.sm,
                    paddingVertical: spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.subtle,
                  },
                ]}
              >
                <Icon3D name="trophy" size={16} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                    {pr.record_type?.replace(/_/g, ' ')}
                  </Text>
                  {pr.achieved_at && (
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      {formatDate(pr.achieved_at)}
                    </Text>
                  )}
                </View>
                <Text style={[typography.statSmall, { color: colors.accent.gold }]}>
                  {pr.value}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Recent Performance */}
        {recentPerformance.length > 0 && (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Icon3D name="bar-chart" size={20} />
              <Text
                style={[
                  typography.h3,
                  { color: colors.text.primary, marginLeft: spacing.sm },
                ]}
              >
                Recent Performance
              </Text>
            </View>
            {recentPerformance.map((perf, idx) => (
              <View
                key={`${perf.date}-${idx}`}
                style={[
                  styles.performanceRow,
                  {
                    marginTop: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderBottomWidth:
                      idx < recentPerformance.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border.subtle,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: colors.text.muted, width: 80 }]}>
                  {formatDate(perf.date)}
                </Text>
                <Text style={[typography.monoBody, { color: colors.text.primary, flex: 1, fontWeight: '600' }]}>
                  {perf.bestSet}
                </Text>
                <Text style={[typography.monoCaption, { color: colors.text.secondary }]}>
                  {formatWeight(perf.totalVolume)} vol
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Bottom Add to Workout Button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background.primary,
            padding: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border.subtle,
          },
        ]}
      >
        <Button
          title="Add to Workout"
          onPress={handleAddToWorkout}
          fullWidth
          size="lg"
          accessibilityLabel={`Add ${exercise.name} to workout`}
          leftIcon={<Ionicons name="add-circle" size={22} color={colors.text.inverse} />}
        />
      </View>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  muscleChip: {},
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBar: {},
});
