// =============================================================================
// TRANSFORMR -- Add Food Screen
// =============================================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ProgressRing } from '@components/ui/ProgressRing';
import { Skeleton } from '@components/ui/Skeleton';
import { useNutritionStore } from '@stores/nutritionStore';
import { useProfileStore } from '@stores/profileStore';
import { MEAL_TYPES, MACRO_COLORS } from '@utils/constants';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import type { Food } from '../../../types/database';

type MealType = typeof MEAL_TYPES[number];

const MEAL_TYPE_OPTIONS: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '\u{1F373}' },
  { value: 'lunch', label: 'Lunch', emoji: '\u{1F96A}' },
  { value: 'dinner', label: 'Dinner', emoji: '\u{1F35D}' },
  { value: 'snack', label: 'Snack', emoji: '\u{1F34E}' },
  { value: 'shake', label: 'Shake', emoji: '\u{1F964}' },
  { value: 'pre_workout', label: 'Pre-WO', emoji: '\u{26A1}' },
  { value: 'post_workout', label: 'Post-WO', emoji: '\u{1F4AA}' },
];

export default function AddFoodScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: string; editId?: string }>();

  const { searchResults, isLoading, searchFoods, logFood } = useNutritionStore();
  const { profile } = useProfileStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [mealType, setMealType] = useState<MealType>(
    (params.meal as MealType) ?? 'snack',
  );
  const [quantity, setQuantity] = useState(1);
  const [isLogging, setIsLogging] = useState(false);

  // Manual entry fields
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  useEffect(() => {
    // Load recent/popular foods on mount
    searchFoods('');
  }, [searchFoods]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      searchFoods(query);
    }
  }, [searchFoods]);

  const scaledMacros = useMemo(() => {
    if (!selectedFood) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return {
      calories: selectedFood.calories * quantity,
      protein: selectedFood.protein * quantity,
      carbs: selectedFood.carbs * quantity,
      fat: selectedFood.fat * quantity,
    };
  }, [selectedFood, quantity]);

  const handleSelectFood = useCallback((food: Food) => {
    hapticLight();
    setSelectedFood(food);
    setQuantity(1);
    setManualMode(false);
  }, []);

  const handleQuantityChange = useCallback((delta: number) => {
    hapticLight();
    setQuantity((prev) => Math.max(0.25, Math.round((prev + delta) * 4) / 4));
  }, []);

  const handleAddToLog = useCallback(async () => {
    setIsLogging(true);
    hapticSuccess();

    if (manualMode) {
      await logFood({
        meal_type: mealType,
        quantity: 1,
        calories: Number(manualCalories) || 0,
        protein: Number(manualProtein) || 0,
        carbs: Number(manualCarbs) || 0,
        fat: Number(manualFat) || 0,
        source: 'manual',
      });
    } else if (selectedFood) {
      await logFood({
        food_id: selectedFood.id,
        meal_type: mealType,
        quantity,
        calories: scaledMacros.calories,
        protein: scaledMacros.protein,
        carbs: scaledMacros.carbs,
        fat: scaledMacros.fat,
        source: 'manual',
      });
    }

    setIsLogging(false);
    router.back();
  }, [manualMode, selectedFood, mealType, quantity, scaledMacros, manualCalories, manualProtein, manualCarbs, manualFat, logFood, router]);

  const canLog = manualMode
    ? manualName.length > 0 && Number(manualCalories) > 0
    : selectedFood !== null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Input
            placeholder="Search foods..."
            value={searchQuery}
            onChangeText={handleSearch}
            leftIcon={<Ionicons name="search" size={18} color={colors.text.muted} />}
            rightIcon={
              searchQuery.length > 0 ? (
                <Pressable onPress={() => { setSearchQuery(''); searchFoods(''); }}>
                  <Ionicons name="close-circle" size={18} color={colors.text.muted} />
                </Pressable>
              ) : undefined
            }
            containerStyle={{ marginBottom: spacing.md }}
          />
        </Animated.View>

        {/* Meal Type Selector */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: spacing.lg }}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {MEAL_TYPE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => { hapticLight(); setMealType(option.value); }}
                style={[
                  styles.mealChip,
                  {
                    backgroundColor: mealType === option.value
                      ? colors.accent.primary
                      : colors.background.secondary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: mealType === option.value ? '#FFFFFF' : colors.text.secondary,
                    },
                  ]}
                >
                  {option.emoji} {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Toggle Manual Mode */}
        <Pressable
          onPress={() => {
            hapticLight();
            setManualMode((prev) => !prev);
            setSelectedFood(null);
          }}
          style={{ marginBottom: spacing.lg }}
        >
          <Text style={[typography.caption, { color: colors.accent.primary }]}>
            {manualMode ? 'Search for food instead' : "Can't find it? Enter manually"}
          </Text>
        </Pressable>

        {manualMode ? (
          /* Manual Entry Form */
          <Animated.View entering={FadeIn.duration(300)}>
            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                Manual Entry
              </Text>
              <Input
                label="Food Name"
                placeholder="e.g. Grilled chicken breast"
                value={manualName}
                onChangeText={setManualName}
                containerStyle={{ marginBottom: spacing.md }}
              />
              <View style={[styles.macroInputRow, { gap: spacing.sm }]}>
                <View style={styles.macroInputItem}>
                  <Input
                    label="Calories"
                    placeholder="0"
                    keyboardType="numeric"
                    value={manualCalories}
                    onChangeText={setManualCalories}
                  />
                </View>
                <View style={styles.macroInputItem}>
                  <Input
                    label="Protein (g)"
                    placeholder="0"
                    keyboardType="numeric"
                    value={manualProtein}
                    onChangeText={setManualProtein}
                  />
                </View>
              </View>
              <View style={[styles.macroInputRow, { gap: spacing.sm, marginTop: spacing.sm }]}>
                <View style={styles.macroInputItem}>
                  <Input
                    label="Carbs (g)"
                    placeholder="0"
                    keyboardType="numeric"
                    value={manualCarbs}
                    onChangeText={setManualCarbs}
                  />
                </View>
                <View style={styles.macroInputItem}>
                  <Input
                    label="Fat (g)"
                    placeholder="0"
                    keyboardType="numeric"
                    value={manualFat}
                    onChangeText={setManualFat}
                  />
                </View>
              </View>
            </Card>
          </Animated.View>
        ) : selectedFood ? (
          /* Selected Food Detail */
          <Animated.View entering={FadeIn.duration(300)}>
            <Card style={{ marginBottom: spacing.lg }}>
              <View style={styles.selectedFoodHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: colors.text.primary }]}>
                    {selectedFood.name}
                  </Text>
                  {selectedFood.brand && (
                    <Text style={[typography.caption, { color: colors.text.muted }]}>
                      {selectedFood.brand}
                    </Text>
                  )}
                  <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 4 }]}>
                    {selectedFood.serving_size}{selectedFood.serving_unit} per serving
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedFood(null)}>
                  <Ionicons name="close-circle" size={24} color={colors.text.muted} />
                </Pressable>
              </View>

              {/* Quantity Adjuster */}
              <View style={[styles.quantityRow, { marginTop: spacing.lg }]}>
                <Text style={[typography.body, { color: colors.text.secondary }]}>Servings</Text>
                <View style={styles.quantityControls}>
                  <Pressable
                    onPress={() => handleQuantityChange(-0.25)}
                    accessibilityLabel="Decrease serving quantity"
                    accessibilityRole="button"
                    style={[styles.quantityBtn, { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.md }]}
                  >
                    <Ionicons name="remove" size={20} color={colors.text.primary} />
                  </Pressable>
                  <Text style={[typography.statSmall, { color: colors.text.primary, minWidth: 60, textAlign: 'center' }]}>
                    {quantity}
                  </Text>
                  <Pressable
                    onPress={() => handleQuantityChange(0.25)}
                    accessibilityLabel="Increase serving quantity"
                    accessibilityRole="button"
                    style={[styles.quantityBtn, { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.md }]}
                  >
                    <Ionicons name="add" size={20} color={colors.text.primary} />
                  </Pressable>
                </View>
              </View>

              {/* Macro Preview */}
              <View style={[styles.macroPreview, { marginTop: spacing.lg, gap: spacing.md }]}>
                <View style={styles.macroPreviewItem}>
                  <ProgressRing
                    progress={Math.min(1, scaledMacros.calories / (profile?.daily_calorie_target ?? 2200))}
                    size={60}
                    strokeWidth={5}
                    color={colors.accent.primary}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                      {Math.round(scaledMacros.calories)}
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 4 }]}>Cal</Text>
                </View>
                <View style={styles.macroPreviewItem}>
                  <ProgressRing
                    progress={Math.min(1, scaledMacros.protein / (profile?.daily_protein_target ?? 180))}
                    size={60}
                    strokeWidth={5}
                    color={MACRO_COLORS.protein}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                      {Math.round(scaledMacros.protein)}g
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.protein, marginTop: 4 }]}>Protein</Text>
                </View>
                <View style={styles.macroPreviewItem}>
                  <ProgressRing
                    progress={Math.min(1, scaledMacros.carbs / (profile?.daily_carb_target ?? 250))}
                    size={60}
                    strokeWidth={5}
                    color={MACRO_COLORS.carbs}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                      {Math.round(scaledMacros.carbs)}g
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.carbs, marginTop: 4 }]}>Carbs</Text>
                </View>
                <View style={styles.macroPreviewItem}>
                  <ProgressRing
                    progress={Math.min(1, scaledMacros.fat / (profile?.daily_fat_target ?? 70))}
                    size={60}
                    strokeWidth={5}
                    color={MACRO_COLORS.fat}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                      {Math.round(scaledMacros.fat)}g
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.fat, marginTop: 4 }]}>Fat</Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        ) : (
          /* Search Results / Recent Foods */
          <Animated.View entering={FadeInDown.duration(300).delay(200)}>
            {isLoading ? (
              <View style={[styles.loadingContainer, { gap: spacing.md }]}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="card" height={72} style={{ marginBottom: spacing.xs }} />
                ))}
              </View>
            ) : (
              <>
                <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                  {searchQuery.length >= 2 ? 'Results' : 'Recent Foods'}
                </Text>

                {searchResults.length > 0 ? (
                  <View style={{ gap: spacing.sm }}>
                    {searchResults.map((food) => (
                      <Pressable
                        key={food.id}
                        accessibilityLabel={`Select ${food.name}, ${Math.round(food.calories)} calories`}
                        accessibilityRole="button"
                        onPress={() => handleSelectFood(food)}
                        style={[
                          styles.foodResult,
                          {
                            backgroundColor: colors.background.secondary,
                            borderRadius: borderRadius.lg,
                            padding: spacing.lg,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                            {food.name}
                          </Text>
                          {food.brand && (
                            <Text style={[typography.caption, { color: colors.text.muted }]}>
                              {food.brand}
                            </Text>
                          )}
                          <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 4 }]}>
                            {food.serving_size}{food.serving_unit}
                          </Text>
                        </View>
                        <View style={styles.foodResultMacros}>
                          <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '600' }]}>
                            {Math.round(food.calories)} cal
                          </Text>
                          <View style={[styles.foodResultMacroRow, { marginTop: 4 }]}>
                            <Text style={[typography.monoCaption, { color: MACRO_COLORS.protein, fontSize: 10 }]}>
                              P{Math.round(food.protein)}g
                            </Text>
                            <Text style={[typography.monoCaption, { color: MACRO_COLORS.carbs, fontSize: 10, marginLeft: 6 }]}>
                              C{Math.round(food.carbs)}g
                            </Text>
                            <Text style={[typography.monoCaption, { color: MACRO_COLORS.fat, fontSize: 10, marginLeft: 6 }]}>
                              F{Math.round(food.fat)}g
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.text.muted} style={{ marginLeft: spacing.sm }} />
                      </Pressable>
                    ))}
                  </View>
                ) : searchQuery.length >= 2 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color={colors.text.muted} />
                    <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md, textAlign: 'center' }]}>
                      No foods found for "{searchQuery}"
                    </Text>
                    <Button
                      title="Enter Manually"
                      variant="outline"
                      size="sm"
                      onPress={() => { setManualMode(true); setManualName(searchQuery); }}
                      style={{ marginTop: spacing.md }}
                    />
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="nutrition-outline" size={48} color={colors.text.muted} />
                    <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md }]}>
                      Start typing to search foods
                    </Text>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Add to Log Button */}
      {canLog && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.background.primary,
              borderTopColor: colors.border.subtle,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            },
          ]}
        >
          <Button
            title={isLogging ? 'Adding...' : 'Add to Log'}
            onPress={handleAddToLog}
            loading={isLogging}
            fullWidth
            size="lg"
          />
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  mealChip: {},
  selectedFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroPreviewItem: {
    alignItems: 'center',
  },
  macroInputRow: {
    flexDirection: 'row',
  },
  macroInputItem: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  foodResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodResultMacros: {
    alignItems: 'flex-end',
  },
  foodResultMacroRow: {
    flexDirection: 'row',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  bottomBar: {
    borderTopWidth: 1,
  },
});
