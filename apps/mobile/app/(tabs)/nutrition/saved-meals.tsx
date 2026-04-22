// =============================================================================
// TRANSFORMR -- Saved Meals Library
// =============================================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
import { supabase } from '../../../services/supabase';
import type { SavedMeal } from '@app-types/database';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { SCREEN_HELP } from '../../../constants/screenHelp';

type MealType = typeof MEAL_TYPES[number];

type FilterType = 'all' | MealType;

export default function SavedMealsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const logFood = useNutritionStore((s) => s.logFood);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.savedMealsScreen} />,
    });
  }, [navigation]);

  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealType, setNewMealType] = useState<MealType>('lunch');

  useEffect(() => {
    const fetchSavedMeals = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('saved_meals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (data) setSavedMeals(data as SavedMeal[]);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchSavedMeals();
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

  const handleCreateMeal = useCallback(async () => {
    if (newMealName.trim().length === 0) return;
    hapticSuccess();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('saved_meals')
      .insert({
        user_id: user.id,
        name: newMealName.trim(),
        meal_type: newMealType,
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      setSavedMeals((prev) => [data as SavedMeal, ...prev]);
    }
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
        onPress: async () => {
          await supabase.from('saved_meals').delete().eq('id', mealId);
          setSavedMeals((prev) => prev.filter((m) => m.id !== mealId));
        },
      },
    ]);
  }, []);

  const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
    { value: 'shake', label: 'Shake' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{  padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
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
          contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}
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
                  { color: activeFilter === filter.value ? colors.text.inverse : colors.text.secondary },
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
                        <View style={[styles.macroPill, { backgroundColor: `${MACRO_COLORS.protein}20` }]}>
                          <Text style={[typography.tiny, { color: MACRO_COLORS.protein, fontWeight: '600' }]}>
                            P {formatMacro(meal.total_protein ?? 0)}
                          </Text>
                        </View>
                        <View style={[styles.macroPill, { backgroundColor: `${MACRO_COLORS.carbs}20` }]}>
                          <Text style={[typography.tiny, { color: MACRO_COLORS.carbs, fontWeight: '600' }]}>
                            C {formatMacro(meal.total_carbs ?? 0)}
                          </Text>
                        </View>
                        <View style={[styles.macroPill, { backgroundColor: `${MACRO_COLORS.fat}20` }]}>
                          <Text style={[typography.tiny, { color: MACRO_COLORS.fat, fontWeight: '600' }]}>
                            F {formatMacro(meal.total_fat ?? 0)}
                          </Text>
                        </View>
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
                <Text style={[typography.caption, { color: newMealType === mt ? colors.text.inverse : colors.text.secondary }]}>
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
    flexWrap: 'wrap',
  },
  macroPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    shadowColor: '#000', /* brand-ok */
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
