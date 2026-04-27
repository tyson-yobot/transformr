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
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { EmptyState } from '@components/ui/EmptyState';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { GlassSkeleton } from '@components/ui/GlassSkeleton';
import { useWorkoutStore } from '@stores/workoutStore';
import { formatDuration } from '@utils/formatters';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { supabase } from '@services/supabase';
import { addWorkoutToCalendar } from '@services/calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutTemplate, WorkoutTemplateExercise, Exercise } from '@app-types/database';

interface ProgramWithExercises extends WorkoutTemplate {
  exercises: (WorkoutTemplateExercise & { exercise?: Exercise })[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Accent color per program type for left stripe differentiation
function getProgramAccentColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('push') || lower.includes('pull') || lower.includes('ppl'))
    return '#A855F7'; // purple
  if (lower.includes('upper') || lower.includes('lower'))
    return '#7E22CE'; // indigo
  if (lower.includes('full body') || lower.includes('fullbody'))
    return '#22D3EE'; // teal
  if (lower.includes('couple') || lower.includes('partner'))
    return '#EC4899'; // pink
  if (lower.includes('leg'))
    return '#A855F7'; // purple (PPL family)
  return '#A855F7'; // default purple
}

// Icon per program type
function getProgramIcon(name: string): keyof typeof Ionicons.glyphMap {
  const lower = name.toLowerCase();
  if (lower.includes('push') || lower.includes('chest') || lower.includes('bench'))
    return 'fitness-outline';
  if (lower.includes('pull') || lower.includes('back'))
    return 'arrow-down-outline';
  if (lower.includes('leg') || lower.includes('squat'))
    return 'walk-outline';
  if (lower.includes('upper'))
    return 'body-outline';
  if (lower.includes('lower'))
    return 'walk-outline';
  if (lower.includes('full'))
    return 'barbell-outline';
  if (lower.includes('cardio') || lower.includes('run'))
    return 'heart-outline';
  return 'barbell-outline';
}

export default function ProgramsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const fetchTemplates = useWorkoutStore((s) => s.fetchTemplates);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const isLoading = useWorkoutStore((s) => s.isLoading);

  const [programsWithExercises, setProgramsWithExercises] = useState<ProgramWithExercises[]>([]);
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create/Edit modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.programsScreen} />,
    });
  }, [navigation]);

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
      setError('Failed to load programs. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPrograms();
    setRefreshing(false);
  }, [loadPrograms]);

  const handleStartProgram = useCallback(
    async (templateId: string) => {
      await hapticLight();
      try {
        await startWorkout(templateId);

        const calendarEnabled = await AsyncStorage.getItem('calendar_sync_enabled').catch(() => null);
        if (calendarEnabled === 'true') {
          const program = programsWithExercises.find((p) => p.id === templateId);
          if (program) {
            await addWorkoutToCalendar({
              name: program.name,
              startTime: new Date(),
              durationMin: (program.estimated_duration_minutes as number | null) ?? 60,
              notes: (program.description as string | null) ?? '',
            }).catch(() => undefined);
          }
        }

        router.push('/(tabs)/fitness/workout-player' as never);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to start workout';
        Alert.alert('Could not start workout', message, [{ text: 'OK' }]);
      }
    },
    [startWorkout, router, programsWithExercises],
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
    ({ item, index }: { item: ProgramWithExercises; index: number }) => {
      const isExpanded = expandedProgramId === item.id;
      const accentColor = getProgramAccentColor(item.name);
      const programIcon = getProgramIcon(item.name);

      const difficultyColor =
        item.difficulty === 'beginner'
          ? colors.accent.success
          : item.difficulty === 'intermediate'
            ? colors.accent.warning
            : item.difficulty === 'advanced'
              ? colors.accent.danger
              : null;

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <Card
          style={{ marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: accentColor }}
          onPress={() => {
            setExpandedProgramId(isExpanded ? null : item.id);
            hapticLight();
          }}
        >
          <View style={styles.programHeader}>
            {/* Program type icon */}
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: `${accentColor}1F`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.sm,
            }}>
              <Ionicons name={programIcon} size={20} color={accentColor} />
            </View>
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
                {difficultyColor && item.difficulty && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      backgroundColor: `${difficultyColor}15`,
                      marginLeft: spacing.sm,
                    }}
                  >
                    <Text
                      style={[
                        typography.tiny,
                        { color: difficultyColor, textTransform: 'capitalize' },
                      ]}
                    >
                      {item.difficulty}
                    </Text>
                  </View>
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
                    {item.exercises.length > 0 ? (
                      <><Text style={typography.monoCaption}>{item.exercises.length}</Text> exercises</>
                    ) : (
                      'Tap to add exercises'
                    )}
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
        </Animated.View>
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
        <AmbientBackground />
        <GlassSkeleton preset="card" style={{ marginBottom: spacing.sm }} />
        <GlassSkeleton preset="card" style={{ marginBottom: spacing.sm }} />
        <GlassSkeleton preset="card" />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <AmbientBackground />
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
        removeClippedSubviews={true}
        windowSize={5}
        maxToRenderPerBatch={5}
        initialNumToRender={6}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            ionIcon="calendar-outline"
            title="No Programs Yet"
            subtitle="Create your first workout program to get started."
          />
        }
      />

      {/* Create Program FAB — glass with glow */}
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
            backgroundColor: 'rgba(168,85,247,0.88)',
            shadowColor: colors.accent.primary,
            shadowOpacity: 0.5,
            shadowRadius: 16,
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
