// =============================================================================
// TRANSFORMR -- Weekly Meal Plans
// =============================================================================

import { useState, useCallback, useMemo } from 'react';
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
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import { useProfileStore } from '@stores/profileStore';
import { formatCalories, formatMacro } from '@utils/formatters';
import { MACRO_COLORS } from '@utils/constants';
import { hapticLight, hapticMedium, hapticSuccess } from '@utils/haptics';

interface PlannedMeal {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DayPlan {
  day: string;
  dayShort: string;
  meals: PlannedMeal[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function generateMockPlan(): DayPlan[] {
  const mealTemplates: Omit<PlannedMeal, 'id'>[] = [
    { name: 'Egg White Omelette', mealType: 'breakfast', calories: 280, protein: 32, carbs: 8, fat: 14 },
    { name: 'Oatmeal & Berries', mealType: 'breakfast', calories: 350, protein: 12, carbs: 58, fat: 8 },
    { name: 'Chicken & Rice', mealType: 'lunch', calories: 520, protein: 48, carbs: 52, fat: 12 },
    { name: 'Turkey Wrap', mealType: 'lunch', calories: 440, protein: 38, carbs: 42, fat: 14 },
    { name: 'Salmon & Veggies', mealType: 'dinner', calories: 580, protein: 45, carbs: 28, fat: 30 },
    { name: 'Steak & Sweet Potato', mealType: 'dinner', calories: 650, protein: 52, carbs: 42, fat: 24 },
    { name: 'Greek Yogurt & Nuts', mealType: 'snack', calories: 250, protein: 20, carbs: 18, fat: 12 },
    { name: 'Protein Shake', mealType: 'snack', calories: 200, protein: 30, carbs: 10, fat: 4 },
  ];

  return DAYS_OF_WEEK.map((day, i) => ({
    day,
    dayShort: DAYS_SHORT[i] ?? day.slice(0, 3),
    meals: [
      { ...mealTemplates[i % 2 === 0 ? 0 : 1]!, id: `${i}-b` },
      { ...mealTemplates[i % 2 === 0 ? 2 : 3]!, id: `${i}-l` },
      { ...mealTemplates[i % 2 === 0 ? 4 : 5]!, id: `${i}-d` },
      { ...mealTemplates[i % 2 === 0 ? 6 : 7]!, id: `${i}-s` },
    ],
  }));
}

export default function MealPlansScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { profile } = useProfileStore();

  const [weekPlan, setWeekPlan] = useState<DayPlan[]>(generateMockPlan);
  const [selectedDay, setSelectedDay] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const targets = useMemo(() => ({
    calories: profile?.daily_calorie_target ?? 2200,
    protein: profile?.daily_protein_target ?? 180,
    carbs: profile?.daily_carb_target ?? 250,
    fat: profile?.daily_fat_target ?? 70,
  }), [profile]);

  const currentDayPlan = weekPlan[selectedDay];

  const dayTotals = useMemo(() => {
    if (!currentDayPlan) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return currentDayPlan.meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [currentDayPlan]);

  const handleGenerateAIPlan = useCallback(async () => {
    setIsGenerating(true);
    hapticMedium();

    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setWeekPlan(generateMockPlan());
    setIsGenerating(false);
    hapticSuccess();
    Alert.alert('Plan Generated!', 'Your AI-powered meal plan for the week is ready.');
  }, []);

  const handleRemoveMeal = useCallback((dayIndex: number, mealId: string) => {
    hapticLight();
    setWeekPlan((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? { ...day, meals: day.meals.filter((m) => m.id !== mealId) }
          : day,
      ),
    );
  }, []);

  const handleSwapMeal = useCallback((_dayIndex: number, _mealId: string) => {
    hapticLight();
    Alert.alert('Swap Meal', 'This would open the food search to replace this meal.');
  }, []);

  const MEAL_TYPE_EMOJI: Record<string, string> = {
    breakfast: '\u{1F373}',
    lunch: '\u{1F96A}',
    dinner: '\u{1F35D}',
    snack: '\u{1F34E}',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Generate Button */}
        <Button
          title={isGenerating ? 'Generating...' : 'Generate AI Plan'}
          onPress={handleGenerateAIPlan}
          loading={isGenerating}
          leftIcon={<Ionicons name="sparkles" size={18} color="#FFFFFF" />}
          fullWidth
          style={{ marginBottom: spacing.lg }}
        />

        {/* Day Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.lg }}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {weekPlan.map((day, index) => {
            const dayTotal = day.meals.reduce((sum, m) => sum + m.calories, 0);
            const isSelected = index === selectedDay;

            return (
              <Pressable
                key={day.day}
                accessibilityLabel={`Select ${day.day}`}
                accessibilityRole="tab"
                onPress={() => { hapticLight(); setSelectedDay(index); }}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: isSelected ? colors.accent.primary : colors.background.secondary,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    minWidth: 68,
                  },
                ]}
              >
                <Text style={[typography.captionBold, { color: isSelected ? '#FFFFFF' : colors.text.primary }]}>
                  {day.dayShort}
                </Text>
                <Text style={[typography.monoCaption, { color: isSelected ? 'rgba(255,255,255,0.7)' : colors.text.muted, marginTop: 4, fontSize: 10 }]}>
                  {Math.round(dayTotal)} cal
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Day Total vs Target */}
        {currentDayPlan && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                {currentDayPlan.day}
              </Text>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonItem}>
                  <ProgressRing
                    progress={Math.min(1, dayTotals.calories / targets.calories)}
                    size={72}
                    strokeWidth={6}
                    color={
                      dayTotals.calories > targets.calories * 1.1
                        ? colors.accent.danger
                        : dayTotals.calories > targets.calories * 0.9
                        ? colors.accent.success
                        : colors.accent.warning
                    }
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                      {Math.round(dayTotals.calories)}
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.monoCaption, { color: colors.text.muted, marginTop: 4, fontSize: 10 }]}>
                    / {targets.calories} cal
                  </Text>
                </View>
                <View style={[styles.comparisonMacros, { gap: spacing.md }]}>
                  <View style={styles.comparisonMacroItem}>
                    <Text style={[typography.tiny, { color: MACRO_COLORS.protein }]}>Protein</Text>
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '600' }]}>
                      {formatMacro(dayTotals.protein)}
                    </Text>
                    <Text style={[typography.monoCaption, { color: colors.text.muted, fontSize: 10 }]}>
                      / {formatMacro(targets.protein)}
                    </Text>
                  </View>
                  <View style={styles.comparisonMacroItem}>
                    <Text style={[typography.tiny, { color: MACRO_COLORS.carbs }]}>Carbs</Text>
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '600' }]}>
                      {formatMacro(dayTotals.carbs)}
                    </Text>
                    <Text style={[typography.monoCaption, { color: colors.text.muted, fontSize: 10 }]}>
                      / {formatMacro(targets.carbs)}
                    </Text>
                  </View>
                  <View style={styles.comparisonMacroItem}>
                    <Text style={[typography.tiny, { color: MACRO_COLORS.fat }]}>Fat</Text>
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '600' }]}>
                      {formatMacro(dayTotals.fat)}
                    </Text>
                    <Text style={[typography.monoCaption, { color: colors.text.muted, fontSize: 10 }]}>
                      / {formatMacro(targets.fat)}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Meals for selected day */}
        {currentDayPlan?.meals.map((meal, index) => (
          <Animated.View key={meal.id} entering={FadeInDown.duration(300).delay(index * 80)}>
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={styles.mealRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.mealHeader}>
                    <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                      {MEAL_TYPE_EMOJI[meal.mealType] ?? ''} {meal.name}
                    </Text>
                    <Badge label={meal.mealType} size="sm" variant="info" />
                  </View>
                  <View style={[styles.mealMacros, { marginTop: spacing.sm, gap: spacing.md }]}>
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '600' }]}>
                      {formatCalories(meal.calories)}
                    </Text>
                    <Text style={[typography.monoCaption, { color: MACRO_COLORS.protein, fontSize: 10 }]}>
                      P: {formatMacro(meal.protein)}
                    </Text>
                    <Text style={[typography.monoCaption, { color: MACRO_COLORS.carbs, fontSize: 10 }]}>
                      C: {formatMacro(meal.carbs)}
                    </Text>
                    <Text style={[typography.monoCaption, { color: MACRO_COLORS.fat, fontSize: 10 }]}>
                      F: {formatMacro(meal.fat)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.mealActions, { gap: spacing.xs }]}>
                  <Pressable
                    onPress={() => handleSwapMeal(selectedDay, meal.id)}
                    accessibilityLabel={`Swap ${meal.name}`}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Ionicons name="swap-horizontal" size={18} color={colors.accent.info} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemoveMeal(selectedDay, meal.id)}
                    accessibilityLabel={`Remove ${meal.name}`}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={colors.accent.danger} />
                  </Pressable>
                </View>
              </View>
            </Card>
          </Animated.View>
        ))}

        {currentDayPlan && currentDayPlan.meals.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.text.muted} />
            <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md }]}>
              No meals planned for this day
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  dayChip: {
    alignItems: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonMacros: {
    flex: 1,
  },
  comparisonMacroItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  mealMacros: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealActions: {
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
});
