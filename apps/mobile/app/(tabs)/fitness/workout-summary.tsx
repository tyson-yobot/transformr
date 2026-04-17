// =============================================================================
// TRANSFORMR -- Post-Workout Summary Screen
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { PurpleRadialBackground } from '@components/ui/PurpleRadialBackground';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { hapticLight } from '@utils/haptics';
import { ShareButton } from '@components/social/ShareButton';
import {
  formatDuration,
  formatVolume,
  formatSetDisplay,
  formatDate,
} from '@utils/formatters';
import { supabase } from '@services/supabase';
import type { WorkoutSession, WorkoutSet, PersonalRecord, Exercise } from '@app-types/database';

interface ExerciseBreakdown {
  exercise: Exercise;
  sets: WorkoutSet[];
  totalVolume: number;
  hasPR: boolean;
}

export default function WorkoutSummaryScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [breakdown, setBreakdown] = useState<ExerciseBreakdown[]>([]);
  const [prsAchieved, setPrsAchieved] = useState<PersonalRecord[]>([]);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        const [sessionRes, setsRes, prsRes] = await Promise.all([
          supabase
            .from('workout_sessions')
            .select('*')
            .eq('id', sessionId)
            .single(),
          supabase
            .from('workout_sets')
            .select('*, exercises(*)')
            .eq('session_id', sessionId)
            .order('set_number'),
          supabase
            .from('personal_records')
            .select('*')
            .eq('workout_session_id', sessionId),
        ]);

        if (sessionRes.error) throw sessionRes.error;
        setSession(sessionRes.data as WorkoutSession);

        if (prsRes.data) {
          setPrsAchieved(prsRes.data as PersonalRecord[]);
        }

        if (setsRes.data) {
          // Group sets by exercise
          const exerciseMap = new Map<string, ExerciseBreakdown>();

          for (const set of setsRes.data) {
            const exerciseData = (set as Record<string, unknown>).exercises as Exercise | null;
            const exerciseId = set.exercise_id ?? 'unknown';

            if (!exerciseMap.has(exerciseId)) {
              exerciseMap.set(exerciseId, {
                exercise: exerciseData ?? {
                  id: exerciseId,
                  name: 'Unknown Exercise',
                  muscle_groups: [],
                },
                sets: [],
                totalVolume: 0,
                hasPR: false,
              });
            }

            const entry = exerciseMap.get(exerciseId);
            if (entry) {
              entry.sets.push(set as WorkoutSet);
              entry.totalVolume += (set.weight ?? 0) * (set.reps ?? 0);
              if (set.is_personal_record) entry.hasPR = true;
            }
          }

          setBreakdown(Array.from(exerciseMap.values()));
        }

        // Check for AI coaching note
        if (sessionRes.data?.ai_form_feedback) {
          const feedback = sessionRes.data.ai_form_feedback as Record<string, string>;
          setAiNote(feedback.coaching_note ?? null);
        }
      } catch (err: unknown) {
        setError('Failed to load workout summary. Pull to refresh.');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [sessionId]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.workoutSummary} />,
    });
  }, [navigation]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!session) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('workout_templates').insert({
        user_id: user.id,
        name: session.name,
        description: `Template from workout on ${formatDate(session.started_at)}`,
        estimated_duration_minutes: session.duration_minutes,
        sort_order: 0,
      });

      if (insertError) throw insertError;
      Alert.alert('Saved!', 'Workout saved as a new template.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save template';
      Alert.alert('Error', message);
    }
  }, [session]);

  const moodChange = session
    ? (session.mood_after ?? 0) - (session.mood_before ?? 0)
    : 0;

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, padding: spacing.lg }]}>
        <Skeleton variant="card" height={80} style={{ marginBottom: spacing.md }} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <Skeleton variant="card" height={100} style={{ flex: 1 }} />
          <Skeleton variant="card" height={100} style={{ flex: 1 }} />
          <Skeleton variant="card" height={100} style={{ flex: 1 }} />
        </View>
        <Skeleton variant="card" height={160} style={{ marginBottom: spacing.md }} />
        <Skeleton variant="card" height={120} />
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background.primary }]}>
        <Ionicons name="warning-outline" size={48} color={colors.accent.danger} />
        <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.md }]}>
          {error ?? 'Session not found'}
        </Text>
        <Button
          title="Go Back"
          variant="outline"
          onPress={() => router.replace('/(tabs)/fitness' as never)}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <PurpleRadialBackground />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={[styles.headerBlock, { marginBottom: spacing.xl }]}>
          <Ionicons name="checkmark-circle" size={56} color={colors.accent.success} />
          <Text style={[typography.h1, { color: colors.text.primary, marginTop: spacing.md }]}>
            Workout Complete!
          </Text>
          <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.xs }]}>
            {session.name}
          </Text>
        </Animated.View>

        {/* Summary Stats */}
        <Animated.View entering={FadeInDown.delay(200)} style={[styles.statsGrid, { gap: spacing.sm, marginBottom: spacing.lg }]}>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
              },
            ]}
          >
            <Ionicons name="time-outline" size={22} color={colors.accent.primary} />
            <Text style={[typography.stat, { color: colors.text.primary, marginTop: spacing.xs }]}>
              {formatDuration(session.duration_minutes ?? 0)}
            </Text>
            <Text style={[typography.tiny, { color: colors.text.muted }]}>Duration</Text>
          </View>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
              },
            ]}
          >
            <Ionicons name="barbell-outline" size={22} color={colors.accent.fire} />
            <Text style={[typography.stat, { color: colors.text.primary, marginTop: spacing.xs }]}>
              {formatVolume(session.total_volume ?? 0)}
            </Text>
            <Text style={[typography.tiny, { color: colors.text.muted }]}>Volume</Text>
          </View>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
              },
            ]}
          >
            <Ionicons name="layers-outline" size={22} color={colors.accent.info} />
            <Text style={[typography.stat, { color: colors.text.primary, marginTop: spacing.xs }]}>
              {session.total_sets ?? 0}
            </Text>
            <Text style={[typography.tiny, { color: colors.text.muted }]}>Total Sets</Text>
          </View>
        </Animated.View>

        {/* PRs Achieved */}
        {prsAchieved.length > 0 && (
          <Card
            variant="elevated"
            style={{
              marginBottom: spacing.lg,
              borderLeftWidth: 3,
              borderLeftColor: colors.accent.gold,
            }}
          >
            <View style={styles.sectionRow}>
              <Ionicons name="trophy" size={20} color={colors.accent.gold} />
              <Text
                style={[
                  typography.h3,
                  { color: colors.accent.gold, marginLeft: spacing.sm },
                ]}
              >
                {prsAchieved.length} New {prsAchieved.length === 1 ? 'PR' : 'PRs'}!
              </Text>
            </View>
            {prsAchieved.map((pr) => (
              <View
                key={pr.id}
                style={[styles.prRow, { marginTop: spacing.sm }]}
              >
                <Text style={[typography.bodyBold, { color: colors.text.primary, flex: 1 }]}>
                  {pr.record_type?.replace(/_/g, ' ')}
                </Text>
                <Text style={[typography.monoBody, { color: colors.accent.gold, fontWeight: '700' }]}>
                  {pr.value}
                </Text>
                {pr.previous_record ? (
                  <Text style={[typography.monoCaption, { color: colors.text.muted, marginLeft: spacing.sm }]}>
                    (was {pr.previous_record})
                  </Text>
                ) : null}
              </View>
            ))}
          </Card>
        )}

        {/* Exercise Breakdown */}
        <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
          Exercise Breakdown
        </Text>
        {breakdown.map((item) => (
          <Card key={item.exercise.id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.exerciseBreakdownHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                  {item.exercise.name}
                </Text>
                {item.hasPR && (
                  <Badge label="PR" variant="warning" size="sm" style={{ marginTop: spacing.xs }} />
                )}
              </View>
              <Text style={[typography.caption, { color: colors.text.muted }]}>
                {formatVolume(item.totalVolume)}
              </Text>
            </View>
            {item.sets.map((set) => (
              <View
                key={set.id}
                style={[styles.setRow, { marginTop: spacing.xs }]}
              >
                <Text style={[typography.caption, { color: colors.text.muted, width: 40 }]}>
                  Set {set.set_number}
                </Text>
                <Text style={[typography.body, { color: colors.text.primary, flex: 1 }]}>
                  {formatSetDisplay(set.weight ?? 0, set.reps ?? 0)}
                </Text>
                {set.ghost_beaten && (
                  <Ionicons name="arrow-up-circle" size={16} color={colors.accent.success} />
                )}
                {set.is_personal_record && (
                  <Ionicons name="star" size={16} color={colors.accent.gold} />
                )}
              </View>
            ))}
          </Card>
        ))}

        {/* Mood Change */}
        {session.mood_before !== null &&
          session.mood_before !== undefined &&
          session.mood_after !== null &&
          session.mood_after !== undefined && (
            <Card style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
              <View style={styles.sectionRow}>
                <Ionicons name="happy-outline" size={20} color={colors.accent.primary} />
                <Text
                  style={[
                    typography.h3,
                    { color: colors.text.primary, marginLeft: spacing.sm },
                  ]}
                >
                  Mood
                </Text>
              </View>
              <View style={[styles.moodRow, { marginTop: spacing.md }]}>
                <View style={styles.moodItem}>
                  <Text style={[typography.tiny, { color: colors.text.muted }]}>Before</Text>
                  <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                    {session.mood_before}/10
                  </Text>
                </View>
                <Ionicons
                  name={moodChange >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={20}
                  color={moodChange >= 0 ? colors.accent.success : colors.accent.danger}
                />
                <View style={styles.moodItem}>
                  <Text style={[typography.tiny, { color: colors.text.muted }]}>After</Text>
                  <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                    {session.mood_after}/10
                  </Text>
                </View>
                <View style={styles.moodItem}>
                  <Text style={[typography.tiny, { color: colors.text.muted }]}>Change</Text>
                  <Text
                    style={[
                      typography.statSmall,
                      {
                        color:
                          moodChange > 0
                            ? colors.accent.success
                            : moodChange < 0
                              ? colors.accent.danger
                              : colors.text.muted,
                      },
                    ]}
                  >
                    {moodChange > 0 ? '+' : ''}
                    {moodChange}
                  </Text>
                </View>
              </View>
            </Card>
          )}

        {/* AI Coaching Note */}
        {aiNote && (
          <Card
            style={{
              marginBottom: spacing.lg,
              borderLeftWidth: 3,
              borderLeftColor: colors.accent.secondary,
            }}
          >
            <View style={styles.sectionRow}>
              <Ionicons name="sparkles" size={18} color={colors.accent.secondary} />
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.accent.secondary, marginLeft: spacing.sm },
                ]}
              >
                AI Coaching Note
              </Text>
            </View>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.sm },
              ]}
            >
              {aiNote}
            </Text>
          </Card>
        )}

        {/* Actions */}
        <View style={{ gap: spacing.sm }}>
          <ShareButton
            type={prsAchieved.length > 0 ? 'pr' : 'achievement'}
            data={{
              title: 'Workout Complete',
              value: formatDuration(session.duration_minutes ?? 0),
              subtitle: formatDate(session.started_at),
            }}
            label="Share Workout"
          />
          <Button
            title="Save as Template"
            variant="secondary"
            onPress={() => { hapticLight(); handleSaveAsTemplate(); }}
            fullWidth
            accessibilityLabel="Save workout as template"
            leftIcon={<Ionicons name="bookmark-outline" size={20} color={colors.text.primary} />}
          />
          <Button
            title="Done"
            onPress={() => { hapticLight(); router.replace('/(tabs)/fitness' as never); }}
            fullWidth
            accessibilityLabel="Return to fitness tab"
          />
        </View>
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
  headerBlock: {
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  moodItem: {
    alignItems: 'center',
  },
});
