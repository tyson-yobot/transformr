// =============================================================================
// TRANSFORMR -- Exercise Library Screen
// =============================================================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import { useWorkoutStore } from '@stores/workoutStore';
import { hapticLight, hapticWarning } from '@utils/haptics';
import { supabase } from '@services/supabase';
import type { Exercise } from '@app-types/database';
import { MuscleGroupTile } from '@components/workout/MuscleGroupTile';
import { ExerciseThumbnail } from '@components/workout/ExerciseThumbnail';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { ExerciseInfoModal } from '@components/workout/ExerciseInfoModal';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type MuscleGroupValue = string;
type EquipmentValue = string;
type DifficultyValue = 'beginner' | 'intermediate' | 'advanced';
type SortOrder = 'az' | 'difficulty' | 'recent';

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

const EQUIPMENT: { value: EquipmentValue | 'all'; label: string }[] = [
  { value: 'all',           label: 'All Equipment' },
  { value: 'bodyweight',    label: 'Bodyweight' },
  { value: 'barbell',       label: 'Barbell' },
  { value: 'dumbbell',      label: 'Dumbbell' },
  { value: 'cable',         label: 'Cable' },
  { value: 'machine',       label: 'Machine' },
  { value: 'smith_machine', label: 'Smith Machine' },
  { value: 'kettlebell',    label: 'Kettlebell' },
  { value: 'bands',         label: 'Bands' },
  { value: 'trx',           label: 'TRX' },
  { value: 'other',         label: 'Other' },
];

const DIFFICULTIES: { value: DifficultyValue | 'all'; label: string }[] = [
  { value: 'all',          label: 'All Levels' },
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
];

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  beginner:     { bg: 'rgba(34,197,94,0.12)',   text: '#22C55E', border: 'rgba(34,197,94,0.30)'   },
  intermediate: { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', border: 'rgba(245,158,11,0.30)'  },
  advanced:     { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', border: 'rgba(239,68,68,0.30)'   },
};

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'az',         label: 'A-Z' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'recent',     label: 'Recently Added' },
];

const DIFFICULTY_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

// Tab bar height matches (tabs)/_layout.tsx: 60 + insets.bottom
const TAB_BAR_BASE = 60;
const FAB_DIAMETER = 56;
const FAB_BOTTOM_OFFSET = 24;
const SAFETY_GAP = 16;

// ---------------------------------------------------------------------------
// Client-side filter logic
// ---------------------------------------------------------------------------

interface FilterCriteria {
  muscleGroup: MuscleGroupValue | null;
  equipment: EquipmentValue | null;
  difficulty: DifficultyValue | null;
  searchQuery: string;
}

/** Case-insensitive check if a value matches a target */
function ciEq(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Case-insensitive check if an array includes a value */
function ciIncludes(arr: readonly string[], target: string): boolean {
  const t = target.trim().toLowerCase();
  return arr.some((v) => v.trim().toLowerCase() === t);
}

/**
 * Match an exercise against a muscle group using OR logic:
 * category equals the group OR muscle_groups array includes it.
 */
function matchesMuscleGroup(exercise: Exercise, group: string): boolean {
  if (exercise.category && ciEq(exercise.category, group)) return true;
  if (exercise.muscle_groups && ciIncludes(exercise.muscle_groups, group)) return true;
  return false;
}

function matchesEquipment(exercise: Exercise, equipment: string): boolean {
  if (!exercise.equipment) return false;
  return ciEq(exercise.equipment, equipment);
}

function matchesDifficulty(exercise: Exercise, difficulty: string): boolean {
  if (!exercise.difficulty) return false;
  return ciEq(exercise.difficulty, difficulty);
}

function matchesSearch(exercise: Exercise, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (exercise.name.toLowerCase().includes(q)) return true;
  if (exercise.muscle_groups?.some((mg) => mg.toLowerCase().includes(q))) return true;
  if (exercise.equipment?.toLowerCase().includes(q)) return true;
  if (exercise.instructions?.toLowerCase().includes(q)) return true;
  return false;
}

function filterExercises(
  exercises: readonly Exercise[],
  criteria: FilterCriteria,
): readonly Exercise[] {
  return exercises.filter((ex) => {
    if (criteria.muscleGroup && !matchesMuscleGroup(ex, criteria.muscleGroup)) return false;
    if (criteria.equipment && !matchesEquipment(ex, criteria.equipment)) return false;
    if (criteria.difficulty && !matchesDifficulty(ex, criteria.difficulty)) return false;
    if (criteria.searchQuery && !matchesSearch(ex, criteria.searchQuery)) return false;
    return true;
  });
}

function sortExercises(exercises: readonly Exercise[], order: SortOrder): readonly Exercise[] {
  const sorted = [...exercises];
  switch (order) {
    case 'az':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'difficulty':
      sorted.sort((a, b) => {
        const da = DIFFICULTY_ORDER[a.difficulty?.toLowerCase() ?? ''] ?? 99;
        const db = DIFFICULTY_ORDER[b.difficulty?.toLowerCase() ?? ''] ?? 99;
        return da - db || a.name.localeCompare(b.name);
      });
      break;
    case 'recent':
      sorted.sort((a, b) => {
        const ta = a.created_at ?? '';
        const tb = b.created_at ?? '';
        return tb.localeCompare(ta) || a.name.localeCompare(b.name);
      });
      break;
  }
  return sorted;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExercisesScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const exercises = useWorkoutStore((s) => s.exercises);
  const fetchExercises = useWorkoutStore((s) => s.fetchExercises);
  const isLoading = useWorkoutStore((s) => s.isLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroupValue | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentValue | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyValue | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    () => (storage.getString('exerciseLibrary.sortOrder') as SortOrder) ?? 'az',
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  // Fetch ALL exercises on mount (no server-side filters — all filtering is client-side)
  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExercises();
    setRefreshing(false);
  }, [fetchExercises]);

  // ---------- Client-side filtering ----------

  const criteria: FilterCriteria = useMemo(() => ({
    muscleGroup: selectedMuscleGroup,
    equipment: selectedEquipment,
    difficulty: selectedDifficulty,
    searchQuery: debouncedSearch,
  }), [selectedMuscleGroup, selectedEquipment, selectedDifficulty, debouncedSearch]);

  const filteredExercises = useMemo(() => {
    const filtered = filterExercises(exercises, criteria);
    return sortExercises(filtered, sortOrder);
  }, [exercises, criteria, sortOrder]);

  // ---------- Predictive count badges ----------

  const muscleGroupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const mg of MUSCLE_GROUPS) {
      const c: FilterCriteria = { ...criteria, muscleGroup: mg.value };
      counts[mg.value] = filterExercises(exercises, c).length;
    }
    return counts;
  }, [exercises, criteria]);

  const equipmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const eq of EQUIPMENT) {
      if (eq.value === 'all') continue;
      const c: FilterCriteria = { ...criteria, equipment: eq.value };
      counts[eq.value] = filterExercises(exercises, c).length;
    }
    counts['all'] = filterExercises(exercises, { ...criteria, equipment: null }).length;
    return counts;
  }, [exercises, criteria]);

  const difficultyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of DIFFICULTIES) {
      if (d.value === 'all') continue;
      const c: FilterCriteria = { ...criteria, difficulty: d.value };
      counts[d.value] = filterExercises(exercises, c).length;
    }
    counts['all'] = filterExercises(exercises, { ...criteria, difficulty: null }).length;
    return counts;
  }, [exercises, criteria]);

  // ---------- Alternate equipment suggestions for empty state ----------

  const alternateEquipment = useMemo(() => {
    if (filteredExercises.length > 0) return [];
    // Show equipment options that DO have results with current muscle group + difficulty
    return EQUIPMENT.filter((eq) => {
      if (eq.value === 'all') return false;
      const c: FilterCriteria = {
        muscleGroup: selectedMuscleGroup,
        equipment: eq.value,
        difficulty: selectedDifficulty,
        searchQuery: debouncedSearch,
      };
      return filterExercises(exercises, c).length > 0;
    }).map((eq) => ({
      value: eq.value,
      label: eq.label,
      count: filterExercises(exercises, {
        muscleGroup: selectedMuscleGroup,
        equipment: eq.value,
        difficulty: selectedDifficulty,
        searchQuery: debouncedSearch,
      }).length,
    }));
  }, [filteredExercises.length, exercises, selectedMuscleGroup, selectedDifficulty, debouncedSearch]);

  // ---------- Handlers ----------

  const handleMuscleGroupPress = useCallback((value: string) => {
    setSelectedMuscleGroup((prev) => prev === value ? null : value);
    hapticLight();
  }, []);

  const handleEquipmentPress = useCallback((value: string) => {
    const newVal = value === 'all' ? null : value;
    const count = value === 'all' ? equipmentCounts['all'] : (equipmentCounts[value] ?? 0);
    if (count === 0 && value !== 'all') {
      hapticWarning();
      return;
    }
    setSelectedEquipment(newVal);
    hapticLight();
  }, [equipmentCounts]);

  const handleDifficultyPress = useCallback((value: string) => {
    const newVal = value === 'all' ? null : value as DifficultyValue;
    const count = value === 'all' ? difficultyCounts['all'] : (difficultyCounts[value] ?? 0);
    if (count === 0 && value !== 'all') {
      hapticWarning();
      return;
    }
    setSelectedDifficulty(newVal);
    hapticLight();
  }, [difficultyCounts]);

  const handleSortChange = useCallback((order: SortOrder) => {
    setSortOrder(order);
    storage.set('exerciseLibrary.sortOrder', order);
    setShowSortMenu(false);
    hapticLight();
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedEquipment(null);
    setSelectedDifficulty(null);
    hapticLight();
  }, []);

  const handleExercisePress = useCallback(
    (exercise: Exercise) => {
      hapticLight();
      router.push(`/(tabs)/fitness/exercise-detail?exerciseId=${exercise.id}` as never);
    },
    [router],
  );

  const handleQuickAddPress = useCallback(
    (exercise: Exercise) => {
      hapticLight();
      router.push(`/(tabs)/fitness/workout-player?exerciseId=${exercise.id}` as never);
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

  // ---------- Bottom padding ----------

  const tabBarHeight = TAB_BAR_BASE + insets.bottom;
  const listBottomPadding = tabBarHeight + FAB_DIAMETER + FAB_BOTTOM_OFFSET + SAFETY_GAP + insets.bottom;

  // ---------- Render helpers ----------

  const renderExerciseItem = useCallback(
    ({ item, index }: { item: Exercise; index: number }) => {
      const muscleGroups = item.muscle_groups ?? [];
      const primaryMuscle = muscleGroups[0] ?? '';
      const secondaryMuscles = muscleGroups.slice(1, 3);

      return (
        <Animated.View
          entering={FadeInDown.duration(300).delay(Math.min(index, 8) * 50)}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition.springify().damping(18).stiffness(180)}
        >
          <Pressable
            onPress={() => handleExercisePress(item)}
            style={{
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.accent.primaryMuted,
              marginBottom: spacing.sm,
              padding: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              shadowColor: colors.accent.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 6,
              elevation: 3,
              overflow: 'hidden',
            }}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${primaryMuscle}, ${item.equipment ?? ''}, ${item.difficulty ?? ''}`}
          >
            {/* Left purple accent border */}
            <View style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              backgroundColor: colors.accent.primary,
              borderTopLeftRadius: borderRadius.lg,
              borderBottomLeftRadius: borderRadius.lg,
            }} />
            <ExerciseThumbnail muscleGroups={muscleGroups} category={item.category ?? undefined} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.text.primary }]} numberOfLines={1}>
                {item.name}
              </Text>
              {muscleGroups.length > 0 && (
                <Text style={[typography.caption, { marginTop: 2 }]} numberOfLines={1}>
                  <Text style={{ color: colors.text.primary, fontWeight: '600' }}>{primaryMuscle}</Text>
                  {secondaryMuscles.length > 0 && (
                    <Text style={{ color: colors.text.secondary }}>{`, ${secondaryMuscles.join(', ')}`}</Text>
                  )}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, alignItems: 'center', flexWrap: 'wrap' }}>
                {item.equipment && <Text style={[typography.tiny, { color: colors.text.muted }]}>{item.equipment}</Text>}
                {item.equipment && item.difficulty && <Text style={[typography.tiny, { color: colors.text.muted }]}>{'\u00B7'}</Text>}
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
                {/* Compound/Isolation badge */}
                {item.is_compound != null && (
                  <View style={{
                    paddingHorizontal: 7, paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: item.is_compound ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)',
                    borderWidth: 1,
                    borderColor: item.is_compound ? 'rgba(34,197,94,0.30)' : 'rgba(59,130,246,0.30)',
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: item.is_compound ? '#22C55E' : '#3B82F6' }}>
                      {item.is_compound ? 'Compound' : 'Isolation'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {/* Quick-add to workout */}
            <Pressable
              onPress={() => handleQuickAddPress(item)}
              hitSlop={8}
              accessibilityLabel={`Add ${item.name} to workout`}
              accessibilityRole="button"
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: colors.dim.primary,
                alignItems: 'center', justifyContent: 'center',
                marginRight: 4,
              }}
            >
              <Ionicons name="add" size={18} color={colors.accent.primary} />
            </Pressable>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </Pressable>
        </Animated.View>
      );
    },
    [colors, typography, spacing, borderRadius, handleExercisePress, handleQuickAddPress],
  );

  const muscleGroupLabel = selectedMuscleGroup
    ? MUSCLE_GROUPS.find((g) => g.value === selectedMuscleGroup)?.label ?? selectedMuscleGroup
    : null;
  const equipmentLabel = selectedEquipment
    ? EQUIPMENT.find((e) => e.value === selectedEquipment)?.label ?? selectedEquipment
    : null;
  const difficultyLabel = selectedDifficulty
    ? DIFFICULTIES.find((d) => d.value === selectedDifficulty)?.label ?? selectedDifficulty
    : null;

  const emptyStateMessage = useMemo(() => {
    const parts: string[] = [];
    if (muscleGroupLabel) parts.push(muscleGroupLabel.toLowerCase());
    if (equipmentLabel) parts.push(equipmentLabel.toLowerCase());
    if (difficultyLabel) parts.push(difficultyLabel.toLowerCase());
    if (parts.length > 0) {
      return `No ${parts.join(' + ')} exercises found.`;
    }
    return 'No exercises match your search.';
  }, [muscleGroupLabel, equipmentLabel, difficultyLabel]);

  // ---------- Render ----------

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
        <Pressable
          onPress={() => { setShowInfoModal(true); hapticLight(); }}
          hitSlop={12}
          accessibilityLabel="Exercise library information"
          accessibilityRole="button"
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: colors.dim.primary,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="information-circle-outline" size={20} color={colors.text.muted} />
        </Pressable>
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
              <Pressable onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.text.muted} />
              </Pressable>
            ) : undefined
          }
          accessibilityLabel="Search exercise library"
        />
      </View>

      {/* Muscle Groups section header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm, marginTop: spacing.xs, marginHorizontal: spacing.lg }}>
        <View style={{ width: 2, height: 14, backgroundColor: colors.accent.primary, borderRadius: 1 }} />
        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', color: colors.text.muted }}>
          Muscle Groups
        </Text>
      </View>

      {/* Category Filter Chips (Muscle Groups) */}
      <View style={[styles.muscleGrid, { marginHorizontal: spacing.lg, marginBottom: spacing.sm }]}>
        {MUSCLE_GROUPS.map((mg) => {
          const count = muscleGroupCounts[mg.value] ?? 0;
          return (
            <View key={mg.value} style={{ alignItems: 'center' }}>
              <MuscleGroupTile
                muscleGroup={mg.value}
                label={mg.label}
                isSelected={selectedMuscleGroup === mg.value}
                onPress={() => handleMuscleGroupPress(mg.value)}
                size={72}
                style={{ opacity: count === 0 && selectedMuscleGroup !== mg.value ? 0.4 : 1 }}
              />
              <Text style={{
                fontSize: 9, fontWeight: '500',
                color: count === 0 ? colors.text.muted : colors.accent.primary,
                marginTop: 2,
              }}>
                {count}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Equipment Filter */}
      <View style={{ paddingTop: spacing.xs }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingRight: spacing.lg }}
        >
          {EQUIPMENT.map((item) => {
            const isActive = item.value === 'all'
              ? selectedEquipment === null
              : item.value === selectedEquipment;
            const count = equipmentCounts[item.value] ?? 0;
            const isEmpty = count === 0 && item.value !== 'all';
            return (
              <Pressable
                key={item.value}
                onPress={() => handleEquipmentPress(item.value)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${item.label}, ${count} exercises`}
                accessibilityState={{ selected: isActive, disabled: isEmpty }}
                hitSlop={{ top: 8, bottom: 8 }}
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
                    minHeight: 32,
                    opacity: isEmpty ? 0.4 : 1,
                    flexDirection: 'row',
                    gap: 4,
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
                <Text
                  style={[
                    typography.tiny,
                    { color: isActive ? colors.text.inverse : colors.text.muted, opacity: 0.7 },
                  ]}
                >
                  {'\u00B7'} {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Difficulty Filter */}
      <View style={{ paddingTop: spacing.xs }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingRight: spacing.lg }}
        >
          {DIFFICULTIES.map((item) => {
            const isActive = item.value === 'all'
              ? selectedDifficulty === null
              : item.value === selectedDifficulty;
            const count = difficultyCounts[item.value] ?? 0;
            const isEmpty = count === 0 && item.value !== 'all';
            const diffColor = item.value !== 'all' ? DIFFICULTY_COLORS[item.value] : null;
            return (
              <Pressable
                key={item.value}
                onPress={() => handleDifficultyPress(item.value)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${item.label}, ${count} exercises`}
                accessibilityState={{ selected: isActive, disabled: isEmpty }}
                hitSlop={{ top: 8, bottom: 8 }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive && diffColor
                      ? diffColor.bg
                      : isActive
                        ? colors.accent.info
                        : colors.background.tertiary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    marginRight: spacing.sm,
                    minHeight: 32,
                    opacity: isEmpty ? 0.4 : 1,
                    flexDirection: 'row',
                    gap: 4,
                    borderWidth: isActive && diffColor ? 1 : 0,
                    borderColor: diffColor?.border ?? 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    typography.tiny,
                    {
                      color: isActive && diffColor
                        ? diffColor.text
                        : isActive
                          ? colors.text.inverse
                          : colors.text.muted,
                    },
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    typography.tiny,
                    {
                      color: isActive && diffColor
                        ? diffColor.text
                        : isActive
                          ? colors.text.inverse
                          : colors.text.muted,
                      opacity: 0.7,
                    },
                  ]}
                >
                  {'\u00B7'} {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Exercise List */}
      {isLoading && exercises.length === 0 ? (
        <ListSkeleton rows={6} style={{ backgroundColor: colors.background.primary }} />
      ) : (
        <FlatList<Exercise>
          data={filteredExercises as Exercise[]}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          getItemLayout={(_data, index) => ({
            length: 88,
            offset: 88 * index,
            index,
          })}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md }}>
              <View style={{ width: 2, height: 14, backgroundColor: colors.accent.primary, borderRadius: 1 }} />
              <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', color: colors.text.muted }}>
                {muscleGroupLabel ? `${muscleGroupLabel} Exercises` : 'All Exercises'}
              </Text>
              <Text style={{ color: colors.text.muted, fontSize: 11, marginLeft: 'auto' }}>
                {filteredExercises.length} exercises
              </Text>
              {/* Sort dropdown */}
              <Pressable
                onPress={() => { setShowSortMenu((p) => !p); hapticLight(); }}
                accessibilityLabel={`Sort by ${SORT_OPTIONS.find((s) => s.value === sortOrder)?.label ?? sortOrder}`}
                accessibilityRole="button"
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
              >
                <Ionicons name="swap-vertical" size={14} color={colors.accent.primary} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.accent.primary }}>
                  {SORT_OPTIONS.find((s) => s.value === sortOrder)?.label ?? 'Sort'}
                </Text>
              </Pressable>
            </View>
          }
          removeClippedSubviews={true}
          windowSize={5}
          maxToRenderPerBatch={8}
          initialNumToRender={8}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: listBottomPadding,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent.primary}
              colors={[colors.accent.primary]}
            />
          }
          ListEmptyComponent={
            <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
              <Ionicons name="barbell-outline" size={48} color={colors.text.muted} style={{ opacity: 0.4 }} />
              <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.md, textAlign: 'center' }]}>
                {emptyStateMessage}
              </Text>
              {alternateEquipment.length > 0 && (
                <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
                  <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
                    Try one of these instead:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
                    {alternateEquipment.slice(0, 4).map((alt) => (
                      <Pressable
                        key={alt.value}
                        onPress={() => {
                          setSelectedEquipment(alt.value);
                          hapticLight();
                        }}
                        accessibilityLabel={`Switch to ${alt.label}, ${alt.count} exercises`}
                        accessibilityRole="button"
                        style={{
                          backgroundColor: colors.background.tertiary,
                          borderRadius: borderRadius.full,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.xs,
                          flexDirection: 'row',
                          gap: 4,
                        }}
                      >
                        <Text style={[typography.tiny, { color: colors.text.secondary }]}>{alt.label}</Text>
                        <Text style={[typography.tiny, { color: colors.accent.primary, fontWeight: '600' }]}>{'\u00B7'} {alt.count}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
              <Pressable
                onPress={handleClearFilters}
                accessibilityLabel="Clear all filters"
                accessibilityRole="button"
                style={{ marginTop: spacing.lg }}
              >
                <Text style={[typography.caption, { color: colors.accent.primary, textDecorationLine: 'underline' }]}>
                  Clear filters to see all {exercises.length} exercises
                </Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Sort Menu Popup */}
      {showSortMenu && (
        <Pressable
          onPress={() => setShowSortMenu(false)}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close sort menu"
        >
          <View style={{
            position: 'absolute',
            right: spacing.lg,
            top: insets.top + 340,
            backgroundColor: colors.background.elevated,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border.default,
            overflow: 'hidden',
            shadowColor: colors.accent.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 10,
          }}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => handleSortChange(opt.value)}
                accessibilityLabel={`Sort by ${opt.label}`}
                accessibilityRole="menuitem"
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  backgroundColor: sortOrder === opt.value ? colors.dim.primary : 'transparent',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                {sortOrder === opt.value && <Ionicons name="checkmark" size={14} color={colors.accent.primary} />}
                <Text style={[typography.caption, {
                  color: sortOrder === opt.value ? colors.accent.primary : colors.text.secondary,
                  fontWeight: sortOrder === opt.value ? '600' : '400',
                }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
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

      {/* Exercise Info Modal */}
      <ExerciseInfoModal visible={showInfoModal} onDismiss={() => setShowInfoModal(false)} />
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
    justifyContent: 'center',
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
