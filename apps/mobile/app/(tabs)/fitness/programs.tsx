// =============================================================================
// TRANSFORMR -- Workout Programs Screen
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { useWorkoutStore } from '@stores/workoutStore';
import { formatDuration } from '@utils/formatters';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { Skeleton } from '@components/ui/Skeleton';
import { supabase } from '@services/supabase';
import type { WorkoutTemplate, WorkoutTemplateExercise, Exercise } from '@app-types/database';

interface ProgramWithExercises extends WorkoutTemplate {
  exercises: (WorkoutTemplateExercise & { exercise?: Exercise })[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ProgramsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { fetchTemplates, startWorkout, isLoading } = useWorkoutStore();

  const [programsWithExercises, setProgramsWithExercises] = useState<ProgramWithExercises[]>([]);
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create/Edit modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');

  const loadPrograms = useCallback(async () => {
    try {
      setError(null);
      await fetchTemplates();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: allTemplates } = await supabase
        .from('workout_templates')
        .select('*')
        .or(`user_id.eq.${user.id},is_shared.eq.true`)
        .order('sort_order');

      if (allTemplates) {
        const programs: ProgramWithExercises[] = [];

        for (const template of allTemplates) {
          const { data: exercisesData } = await supabase
            .from('workout_template_exercises')
            .select('*, exercises(*)')
            .eq('template_id', template.id)
            .order('sort_order');

          programs.push({
            ...(template as WorkoutTemplate),
            exercises: (exercisesData ?? []).map((te: Record<string, unknown>) => ({
              ...(te as unknown as WorkoutTemplateExercise),
              exercise: te.exercises as Exercise | undefined,
            })),
          });
        }

        setProgramsWithExercises(programs);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load programs';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const handleStartProgram = useCallback(
    async (templateId: string) => {
      await hapticLight();
      await startWorkout(templateId);
      router.push('/(tabs)/fitness/workout-player' as never);
    },
    [startWorkout, router],
  );

  const handleCreateProgram = useCallback(async () => {
    if (!newProgramName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('workout_templates').insert({
        user_id: user.id,
        name: newProgramName.trim(),
        description: newProgramDescription.trim() || null,
        sort_order: programsWithExercises.length,
      });

      if (insertError) throw insertError;

      await hapticSuccess();
      setShowCreateModal(false);
      setNewProgramName('');
      setNewProgramDescription('');
      await loadPrograms();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create program';
      Alert.alert('Error', message);
    }
  }, [newProgramName, newProgramDescription, programsWithExercises.length, loadPrograms]);

  const handleDeleteProgram = useCallback(
    (templateId: string, name: string) => {
      Alert.alert('Delete Program', `Are you sure you want to delete "${name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: deleteError } = await supabase
                .from('workout_templates')
                .delete()
                .eq('id', templateId);
              if (deleteError) throw deleteError;
              await loadPrograms();
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Failed to delete program';
              Alert.alert('Error', message);
            }
          },
        },
      ]);
    },
    [loadPrograms],
  );

  const renderProgram = useCallback(
    ({ item }: { item: ProgramWithExercises }) => {
      const isExpanded = expandedProgramId === item.id;

      return (
        <Card
          style={{ marginBottom: spacing.sm }}
          onPress={() => {
            setExpandedProgramId(isExpanded ? null : item.id);
            hapticLight();
          }}
        >
          <View style={styles.programHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  {item.name}
                </Text>
                {item.is_ai_generated && (
                  <Badge
                    label="AI"
                    variant="info"
                    size="sm"
                    style={{ marginLeft: spacing.sm }}
                  />
                )}
              </View>
              {item.description && (
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text.secondary, marginTop: spacing.xs },
                  ]}
                  numberOfLines={isExpanded ? undefined : 1}
                >
                  {item.description}
                </Text>
              )}
              <View style={[styles.metaRow, { marginTop: spacing.sm, gap: spacing.md }]}>
                {item.estimated_duration_minutes && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.text.muted} />
                    <Text style={[typography.tiny, { color: colors.text.muted, marginLeft: 4 }]}>
                      {formatDuration(item.estimated_duration_minutes)}
                    </Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Ionicons name="barbell-outline" size={14} color={colors.text.muted} />
                  <Text style={[typography.tiny, { color: colors.text.muted, marginLeft: 4 }]}>
                    <Text style={typography.monoCaption}>{item.exercises.length}</Text> exercises
                  </Text>
                </View>
                {item.day_of_week !== null && item.day_of_week !== undefined && (
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.text.muted} />
                    <Text style={[typography.tiny, { color: colors.text.muted, marginLeft: 4 }]}>
                      {DAY_NAMES[item.day_of_week] ?? ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text.muted}
            />
          </View>

          {/* Expanded: Day-by-day exercise view */}
          {isExpanded && (
            <View style={{ marginTop: spacing.md }}>
              {item.exercises.length > 0 ? (
                item.exercises.map((te, idx) => (
                  <View
                    key={te.id}
                    style={[
                      styles.exerciseRow,
                      {
                        paddingVertical: spacing.sm,
                        borderTopWidth: idx > 0 ? 1 : 0,
                        borderTopColor: colors.border.subtle,
                      },
                    ]}
                  >
                    <Text style={[typography.captionBold, { color: colors.text.muted, width: 24 }]}>
                      {idx + 1}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                        {te.exercise?.name ?? 'Unknown Exercise'}
                      </Text>
                      <Text style={[typography.tiny, { color: colors.text.muted }]}>
                        <Text style={typography.monoCaption}>{te.target_sets ?? '?'}</Text> sets x <Text style={typography.monoCaption}>{te.target_reps ?? '?'}</Text> reps
                        {te.rest_seconds ? <Text>{' | '}<Text style={typography.monoCaption}>{te.rest_seconds}</Text>s rest</Text> : ''}
                      </Text>
                    </View>
                    {te.target_weight && (
                      <Text style={[typography.caption, { color: colors.text.secondary }]}>
                        {te.target_weight} lbs
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text
                  style={[
                    typography.body,
                    { color: colors.text.muted, textAlign: 'center' },
                  ]}
                >
                  No exercises added yet.
                </Text>
              )}

              <View style={[styles.actionRow, { marginTop: spacing.md, gap: spacing.sm }]}>
                <Button
                  title="Start This Program"
                  onPress={() => handleStartProgram(item.id)}
                  loading={isLoading}
                  size="sm"
                  style={{ flex: 1 }}
                />
                <Pressable
                  onPress={() => handleDeleteProgram(item.id, item.name)}
                  accessibilityLabel={`Delete program ${item.name}`}
                  accessibilityRole="button"
                  style={[
                    styles.deleteBtn,
                    {
                      backgroundColor: `${colors.accent.danger}15`,
                      borderRadius: borderRadius.sm,
                      padding: spacing.sm,
                    },
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.accent.danger} />
                </Pressable>
              </View>
            </View>
          )}
        </Card>
      );
    },
    [
      expandedProgramId,
      colors,
      typography,
      spacing,
      borderRadius,
      isLoading,
      handleStartProgram,
      handleDeleteProgram,
    ],
  );

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, padding: spacing.lg }]}>
        <Skeleton variant="card" height={120} style={{ marginBottom: spacing.sm }} />
        <Skeleton variant="card" height={120} style={{ marginBottom: spacing.sm }} />
        <Skeleton variant="card" height={120} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {error && (
        <Card
          style={{
            margin: spacing.lg,
            marginBottom: 0,
            backgroundColor: `${colors.accent.danger}15`,
          }}
        >
          <Text style={[typography.caption, { color: colors.accent.danger }]}>{error}</Text>
        </Card>
      )}

      <FlatList<ProgramWithExercises>
        data={programsWithExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderProgram}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={[styles.centered, { paddingVertical: spacing.xxxl }]}>
            <Ionicons name="calendar-outline" size={48} color={colors.text.muted} />
            <Text
              style={[
                typography.body,
                { color: colors.text.muted, marginTop: spacing.md, textAlign: 'center' },
              ]}
            >
              No programs yet.{'\n'}Create your first workout program!
            </Text>
          </View>
        }
      />

      {/* Create Program FAB */}
      <Pressable
        onPress={() => {
          hapticLight();
          setShowCreateModal(true);
        }}
        accessibilityLabel="Create new workout program"
        accessibilityRole="button"
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent.primary,
            shadowColor: colors.accent.primary,
          },
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Create Program Modal */}
      <Modal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        title="Create Program"
      >
        <View style={{ gap: spacing.lg }}>
          <Input
            label="Program Name"
            placeholder="e.g., Push Pull Legs"
            value={newProgramName}
            onChangeText={setNewProgramName}
          />
          <Input
            label="Description (optional)"
            placeholder="What is this program about?"
            value={newProgramDescription}
            onChangeText={setNewProgramDescription}
            multiline
          />
          <Button
            title="Create Program"
            onPress={handleCreateProgram}
            fullWidth
            disabled={!newProgramName.trim()}
          />
        </View>
      </Modal>
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
  programHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
