// =============================================================================
// TRANSFORMR -- Exercise Library Screen
// =============================================================================

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import { useWorkoutStore } from '@stores/workoutStore';
import { hapticLight } from '@utils/haptics';
import { supabase } from '@services/supabase';
import type { Exercise } from '@app-types/database';

type CategoryFilter = Exercise['category'] | 'all';
type EquipmentFilter = Exercise['equipment'] | 'all';

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'legs', label: 'Legs' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'abs', label: 'Abs' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'compound', label: 'Compound' },
  { value: 'olympic', label: 'Olympic' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'mobility', label: 'Mobility' },
];

const EQUIPMENT: { value: EquipmentFilter; label: string }[] = [
  { value: 'all', label: 'All Equipment' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'cable', label: 'Cable' },
  { value: 'machine', label: 'Machine' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'bands', label: 'Bands' },
  { value: 'smith_machine', label: 'Smith Machine' },
];

export default function ExercisesScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { exercises, fetchExercises, isLoading } = useWorkoutStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');

  useEffect(() => {
    const category = selectedCategory !== 'all' ? selectedCategory : undefined;
    const equipment = selectedEquipment !== 'all' ? selectedEquipment : undefined;
    const search = searchQuery.trim() || undefined;
    const hasFilters = category !== undefined || equipment !== undefined || search !== undefined;

    fetchExercises(hasFilters ? { category, equipment, search } : undefined);
  }, [selectedCategory, selectedEquipment, searchQuery, fetchExercises]);

  const filteredExercises = useMemo(() => {
    return exercises;
  }, [exercises]);

  const handleExercisePress = useCallback(
    (exercise: Exercise) => {
      hapticLight();
      router.push(`/(tabs)/fitness/exercise-detail?exerciseId=${exercise.id}` as never);
    },
    [router],
  );

  const handleAddCustomExercise = useCallback(async () => {
    if (!newExerciseName.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('exercises').insert({
        name: newExerciseName.trim(),
        muscle_groups: [],
        is_custom: true,
        created_by: user.id,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;

      setShowAddModal(false);
      setNewExerciseName('');
      await fetchExercises();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add exercise');
    }
  }, [newExerciseName, fetchExercises]);

  const renderExerciseItem = useCallback(
    ({ item, index }: { item: Exercise; index: number }) => (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Card
        style={{ marginBottom: spacing.sm }}
        onPress={() => handleExercisePress(item)}
        accessibilityLabel={`${item.name}, ${item.category ?? ''} exercise`}
        accessibilityRole="button"
      >
        <View style={styles.exerciseRow}>
          <View
            style={[
              styles.exerciseIcon,
              {
                backgroundColor: `${colors.accent.primary}15`,
                borderRadius: borderRadius.sm,
                width: 44,
                height: 44,
              },
            ]}
          >
            <Ionicons name="barbell-outline" size={22} color={colors.accent.primary} />
          </View>
          <View style={[styles.exerciseInfo, { marginLeft: spacing.md }]}>
            <Text style={[typography.bodyBold, { color: colors.text.primary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.tagRow, { marginTop: spacing.xs, gap: spacing.xs }]}>
              {item.category && (
                <Badge label={item.category} size="sm" variant="info" />
              )}
              {item.equipment && (
                <Badge label={item.equipment.replace(/_/g, ' ')} size="sm" />
              )}
              {item.difficulty && (
                <Badge
                  label={item.difficulty}
                  size="sm"
                  variant={
                    item.difficulty === 'beginner'
                      ? 'success'
                      : item.difficulty === 'intermediate'
                        ? 'warning'
                        : 'danger'
                  }
                />
              )}
            </View>
            {(item.muscle_groups ?? []).length > 0 && (
              <Text
                style={[
                  typography.tiny,
                  { color: colors.text.muted, marginTop: spacing.xs },
                ]}
                numberOfLines={1}
              >
                {item.muscle_groups.join(', ')}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </View>
      </Card>
      </Animated.View>
    ),
    [colors, typography, spacing, borderRadius, handleExercisePress],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Search Bar */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search-outline" size={18} color={colors.text.muted} />}
          rightIcon={
            searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.text.muted} />
              </Pressable>
            ) : undefined
          }
        />
      </View>

      {/* Category Filter Chips */}
      <View style={{ paddingTop: spacing.md }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        >
          {CATEGORIES.map((item) => {
            const isActive = item.value === selectedCategory;
            return (
              <Pressable
                key={item.value ?? 'all'}
                accessibilityLabel={`Filter by ${item.label}`}
                accessibilityRole="button"
                onPress={() => {
                  setSelectedCategory(item.value);
                  hapticLight();
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive
                      ? colors.accent.primary
                      : colors.background.secondary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    marginRight: spacing.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.captionBold,
                    { color: isActive ? colors.text.inverse : colors.text.secondary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Equipment Filter */}
      <View style={{ paddingTop: spacing.sm }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        >
          {EQUIPMENT.map((item) => {
            const isActive = item.value === selectedEquipment;
            return (
              <Pressable
                key={item.value ?? 'all'}
                onPress={() => {
                  setSelectedEquipment(item.value);
                  hapticLight();
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive
                      ? colors.accent.info
                      : colors.background.tertiary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    marginRight: spacing.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.tiny,
                    { color: isActive ? colors.text.inverse : colors.text.muted },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Exercise List */}
      {isLoading ? (
        <ListSkeleton rows={6} style={{ backgroundColor: colors.background.primary }} />
      ) : (
        <FlatList<Exercise>
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          removeClippedSubviews={true}
          windowSize={5}
          maxToRenderPerBatch={10}
          initialNumToRender={12}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: 100,
          }}
          ListEmptyComponent={
            <View style={[styles.centered, { paddingVertical: spacing.xxxl }]}>
              <Ionicons name="search-outline" size={48} color={colors.text.muted} />
              <Text
                style={[
                  typography.body,
                  { color: colors.text.muted, marginTop: spacing.md, textAlign: 'center' },
                ]}
              >
                No exercises found.{'\n'}Try adjusting your filters.
              </Text>
            </View>
          }
        />
      )}

      {/* Add Custom Exercise Button */}
      <Pressable
        onPress={() => {
          hapticLight();
          setShowAddModal(true);
        }}
        accessibilityLabel="Add custom exercise"
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

      {/* Add Custom Exercise Modal */}
      <Modal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        title="Add Custom Exercise"
      >
        <View style={{ gap: spacing.lg }}>
          <Input
            label="Exercise Name"
            placeholder="e.g., Hip Thrust"
            value={newExerciseName}
            onChangeText={setNewExerciseName}
          />
          <Button
            title="Add Exercise"
            onPress={handleAddCustomExercise}
            fullWidth
            disabled={!newExerciseName.trim()}
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
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    alignItems: 'center',
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
