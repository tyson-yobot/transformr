// =============================================================================
// TRANSFORMR -- Exercise Library Screen
// =============================================================================

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { EmptyState } from '@components/ui/EmptyState';
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import { useWorkoutStore } from '@stores/workoutStore';
import { hapticLight } from '@utils/haptics';
import { supabase } from '@services/supabase';
import type { Exercise } from '@app-types/database';
import { MuscleGroupTile } from '@components/workout/MuscleGroupTile';
import { ExerciseThumbnail } from '@components/workout/ExerciseThumbnail';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';

type CategoryFilter = Exercise['category'] | 'all';
type EquipmentFilter = Exercise['equipment'] | 'all';

const MUSCLE_GROUPS = [
  { value: 'chest',     label: 'Chest' },
  { value: 'back',      label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps',    label: 'Biceps' },
  { value: 'triceps',   label: 'Triceps' },
  { value: 'abs',       label: 'Abs' },
  { value: 'legs',      label: 'Legs' },
  { value: 'glutes',    label: 'Glutes' },
  { value: 'cardio',    label: 'Cardio' },
] as const;

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

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  beginner:     { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', border: 'rgba(16,185,129,0.30)'  },
  intermediate: { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', border: 'rgba(245,158,11,0.30)'  },
  advanced:     { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', border: 'rgba(239,68,68,0.30)'   },
};

export default function ExercisesScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const exercises = useWorkoutStore((s) => s.exercises);
  const fetchExercises = useWorkoutStore((s) => s.fetchExercises);
  const isLoading = useWorkoutStore((s) => s.isLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input to avoid firing API calls on every keystroke
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  const doFetch = useCallback(() => {
    const category = selectedCategory !== 'all' ? selectedCategory : undefined;
    const equipment = selectedEquipment !== 'all' ? selectedEquipment : undefined;
    const search = debouncedSearch.trim() || undefined;
    const hasFilters = category !== undefined || equipment !== undefined || search !== undefined;
    return fetchExercises(hasFilters ? { category, equipment, search } : undefined);
  }, [selectedCategory, selectedEquipment, debouncedSearch, fetchExercises]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await doFetch();
    setRefreshing(false);
  }, [doFetch]);

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
        <Pressable
          onPress={() => handleExercisePress(item)}
          style={{
            backgroundColor: colors.background.secondary,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: 'rgba(168, 85, 247, 0.15)',
            marginBottom: spacing.sm,
            padding: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          }}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.category ?? ''} exercise`}
        >
          <ExerciseThumbnail muscleGroups={item.muscle_groups ?? []} category={item.category ?? undefined} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyBold, { color: colors.text.primary }]} numberOfLines={1}>
              {item.name}
            </Text>
            {(item.muscle_groups ?? []).length > 0 && (
              <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]} numberOfLines={1}>
                {item.muscle_groups.slice(0, 3).join(', ')}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, alignItems: 'center' }}>
              {item.equipment && <Text style={[typography.tiny, { color: colors.text.muted }]}>{item.equipment}</Text>}
              {item.equipment && item.difficulty && <Text style={[typography.tiny, { color: colors.text.muted }]}>·</Text>}
              {item.difficulty ? (() => {
                const diffStyle = DIFFICULTY_COLORS[item.difficulty.toLowerCase()];
                return diffStyle ? (
                  <View style={{
                    paddingHorizontal: 7, paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: diffStyle.bg,
                    borderWidth: 1,
                    borderColor: diffStyle.border,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: diffStyle.text }}>
                      {item.difficulty}
                    </Text>
                  </View>
                ) : (
                  <Text style={[typography.tiny, { color: colors.text.muted }]}>{item.difficulty}</Text>
                );
              })() : null}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </Pressable>
      </Animated.View>
    ),
    [colors, typography, spacing, borderRadius, handleExercisePress],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />

      {/* Custom header with back button */}
      <View style={{
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.sm,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.dim.primary,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.accent.primary} />
        </Pressable>
        <Text style={[typography.h2, { color: colors.text.primary, flex: 1 }]}>
          Exercise Library
        </Text>
        <ScreenHelpButton content={SCREEN_HELP.exercisesLibrary} />
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
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

      {/* Muscle Groups section header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm, marginTop: spacing.xs, marginHorizontal: spacing.lg }}>
        <View style={{ width: 2, height: 14, backgroundColor: colors.accent.primary, borderRadius: 1 }} />
        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', color: colors.text.muted }}>
          Muscle Groups
        </Text>
      </View>

      {/* Category Filter Chips */}
      <View style={[styles.muscleGrid, { marginHorizontal: spacing.lg, marginBottom: spacing.sm }]}>
        {MUSCLE_GROUPS.map((mg) => (
          <MuscleGroupTile
            key={mg.value}
            muscleGroup={mg.value}
            label={mg.label}
            isSelected={selectedCategory === mg.value}
            onPress={() => setSelectedCategory(
              selectedCategory === mg.value ? 'all' : mg.value as CategoryFilter
            )}
            size={72}
          />
        ))}
      </View>

      {/* Equipment Filter */}
      <View style={{ paddingTop: spacing.sm }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingRight: spacing.lg }}
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
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md }}>
              <View style={{ width: 2, height: 14, backgroundColor: colors.accent.primary, borderRadius: 1 }} />
              <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', color: colors.text.muted }}>
                {selectedCategory !== 'all' ? `${MUSCLE_GROUPS.find(g => g.value === selectedCategory)?.label ?? selectedCategory} Exercises` : 'All Exercises'}
              </Text>
              <Text style={{ color: colors.text.muted, fontSize: 11, marginLeft: 'auto' }}>
                {filteredExercises.length} exercises
              </Text>
            </View>
          }
          removeClippedSubviews={true}
          windowSize={5}
          maxToRenderPerBatch={10}
          initialNumToRender={12}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: insets.bottom + 90,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              ionIcon="barbell-outline"
              title="No Exercises Found"
              subtitle="Try adjusting your search or filters to find what you're looking for."
            />
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
        <Ionicons name="add" size={28} color={colors.text.inverse} />
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
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
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
