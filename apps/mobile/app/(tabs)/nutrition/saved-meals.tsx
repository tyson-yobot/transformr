// =============================================================================
// TRANSFORMR -- Saved Meals Library
// =============================================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
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
import { useNutritionStore } from '@stores/nutritionStore';
import { formatCalories, formatMacro } from '@utils/formatters';
import { MACRO_COLORS, MEAL_TYPES } from '@utils/constants';
import { hapticLight, hapticSuccess, hapticMedium } from '@utils/haptics';
import { Skeleton } from '@components/ui/Skeleton';
import type { SavedMeal } from '../../../types/database';

type MealType = typeof MEAL_TYPES[number];

type FilterType = 'all' | MealType;

export default function SavedMealsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { logFood } = useNutritionStore();

  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealType, setNewMealType] = useState<MealType>('lunch');

  // Mock data load
  useEffect(() => {
    const mockMeals: SavedMeal[] = [
      {
        id: '1',
        name: 'Chicken & Rice Bowl',
        description: 'Grilled chicken, brown rice, broccoli',
        meal_type: 'lunch',
        total_calories: 520,
        total_protein: 48,
        total_carbs: 52,
        total_fat: 12,
        prep_time_minutes: 25,
      },
      {
        id: '2',
        name: 'Protein Smoothie',
        description: 'Whey, banana, peanut butter, oats, almond milk',
        meal_type: 'shake',
        total_calories: 450,
        total_protein: 40,
        total_carbs: 42,
        total_fat: 14,
        prep_time_minutes: 5,
      },
      {
        id: '3',
        name: 'Egg White Omelette',
        description: 'Egg whites, spinach, peppers, feta',
        meal_type: 'breakfast',
        total_calories: 280,
        total_protein: 32,
        total_carbs: 8,
        total_fat: 14,
        prep_time_minutes: 10,
      },
      {
        id: '4',
        name: 'Salmon & Sweet Potato',
        description: 'Baked salmon, sweet potato, asparagus',
        meal_type: 'dinner',
        total_calories: 620,
        total_protein: 45,
        total_carbs: 48,
        total_fat: 26,
        prep_time_minutes: 35,
      },
    ];
    setSavedMeals(mockMeals);
    setIsLoading(false);
  }, []);

  const filteredMeals = useMemo(() => {
    let meals = savedMeals;

    if (activeFilter !== 'all') {
      meals = meals.filter((m) => m.meal_type === activeFilter);
    }

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      meals = meals.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          (m.description ?? '').toLowerCase().includes(query),
      );
    }

    return meals;
  }, [savedMeals, activeFilter, searchQuery]);

  const handleQuickLog = useCallback(async (meal: SavedMeal) => {
    hapticSuccess();
    await logFood({
      saved_meal_id: meal.id,
      meal_type: meal.meal_type ?? 'snack',
      quantity: 1,
      calories: meal.total_calories ?? 0,
      protein: meal.total_protein ?? 0,
      carbs: meal.total_carbs ?? 0,
      fat: meal.total_fat ?? 0,
      source: 'saved_meal',
    });
    Alert.alert('Logged!', `${meal.name} has been added to your log.`);
  }, [logFood]);

  const handleCreateMeal = useCallback(() => {
    if (newMealName.trim().length === 0) return;
    hapticSuccess();

    const newMeal: SavedMeal = {
      id: Date.now().toString(),
      name: newMealName.trim(),
      meal_type: newMealType,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
    };

    setSavedMeals((prev) => [newMeal, ...prev]);
    setCreateModalVisible(false);
    setNewMealName('');
  }, [newMealName, newMealType]);

  const handleDeleteMeal = useCallback((mealId: string) => {
    hapticMedium();
    Alert.alert('Delete Meal', 'Are you sure you want to delete this saved meal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setSavedMeals((prev) => prev.filter((m) => m.id !== mealId));
        },
      },
    ]);
  }, []);

  const FILTER_OPTIONS: Array<{ value: FilterType; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
    { value: 'shake', label: 'Shake' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <Input
          placeholder="Search saved meals..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={18} color={colors.text.muted} />}
          containerStyle={{ marginBottom: spacing.md }}
        />

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.lg }}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {FILTER_OPTIONS.map((filter) => (
            <Pressable
              key={filter.value}
              onPress={() => { hapticLight(); setActiveFilter(filter.value); }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === filter.value ? colors.accent.primary : colors.background.secondary,
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: activeFilter === filter.value ? '#FFFFFF' : colors.text.secondary },
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Meals List */}
        {isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton variant="card" height={120} />
            <Skeleton variant="card" height={120} />
            <Skeleton variant="card" height={120} />
          </View>
        ) : filteredMeals.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            {filteredMeals.map((meal, index) => (
              <Animated.View key={meal.id} entering={FadeInDown.duration(300).delay(index * 50)}>
                <Card style={{ marginBottom: spacing.xs }}>
                  <View style={styles.mealRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                        {meal.name}
                      </Text>
                      {meal.description && (
                        <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]} numberOfLines={2}>
                          {meal.description}
                        </Text>
                      )}
                      <View style={[styles.mealMacros, { marginTop: spacing.sm, gap: spacing.sm }]}>
                        <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '700' }]}>
                          {formatCalories(meal.total_calories ?? 0)}
                        </Text>
                        <Text style={[typography.tiny, { color: MACRO_COLORS.protein }]}>
                          P: {formatMacro(meal.total_protein ?? 0)}
                        </Text>
                        <Text style={[typography.tiny, { color: MACRO_COLORS.carbs }]}>
                          C: {formatMacro(meal.total_carbs ?? 0)}
                        </Text>
                        <Text style={[typography.tiny, { color: MACRO_COLORS.fat }]}>
                          F: {formatMacro(meal.total_fat ?? 0)}
                        </Text>
                      </View>
                      <View style={[styles.mealTags, { marginTop: spacing.sm, gap: spacing.xs }]}>
                        {meal.meal_type && <Badge label={meal.meal_type} size="sm" variant="info" />}
                        {meal.prep_time_minutes && (
                          <Badge label={`${meal.prep_time_minutes} min`} size="sm" />
                        )}
                      </View>
                    </View>
                    <View style={[styles.mealActions, { gap: spacing.sm }]}>
                      <Pressable
                        onPress={() => handleQuickLog(meal)}
                        accessibilityLabel={`Quick log ${meal.name}`}
                        accessibilityRole="button"
                        style={[styles.actionBtn, { backgroundColor: `${colors.accent.success}20`, borderRadius: borderRadius.md }]}
                      >
                        <Ionicons name="add-circle" size={20} color={colors.accent.success} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteMeal(meal.id)}
                        accessibilityLabel={`Delete ${meal.name}`}
                        accessibilityRole="button"
                        style={[styles.actionBtn, { backgroundColor: `${colors.accent.danger}20`, borderRadius: borderRadius.md }]}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.accent.danger} />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color={colors.text.muted} />
            <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md }]}>
              No saved meals found
            </Text>
            <Button
              title="Create Your First Meal"
              variant="outline"
              size="sm"
              onPress={() => setCreateModalVisible(true)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}
      </ScrollView>

      {/* Create FAB */}
      <Pressable
        onPress={() => { hapticLight(); setCreateModalVisible(true); }}
        accessibilityLabel="Create new saved meal"
        accessibilityRole="button"
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent.primary,
            borderRadius: borderRadius.full,
          },
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Create Modal */}
      <Modal
        visible={createModalVisible}
        onDismiss={() => setCreateModalVisible(false)}
        title="Create Saved Meal"
      >
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Input
            label="Meal Name"
            placeholder="e.g. Chicken & Rice Bowl"
            value={newMealName}
            onChangeText={setNewMealName}
          />
          <Text style={[typography.body, { color: colors.text.secondary }]}>Meal Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {(['breakfast', 'lunch', 'dinner', 'snack', 'shake'] as const).map((mt) => (
              <Pressable
                key={mt}
                onPress={() => setNewMealType(mt)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: newMealType === mt ? colors.accent.primary : colors.background.tertiary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: newMealType === mt ? '#FFFFFF' : colors.text.secondary }]}>
                  {mt.charAt(0).toUpperCase() + mt.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Button
            title="Create Meal"
            onPress={handleCreateMeal}
            disabled={newMealName.trim().length === 0}
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  filterChip: {},
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mealMacros: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTags: {
    flexDirection: 'row',
  },
  mealActions: {
    marginLeft: 12,
    alignItems: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
