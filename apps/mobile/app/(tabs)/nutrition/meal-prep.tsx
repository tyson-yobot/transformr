// =============================================================================
// TRANSFORMR -- Batch Cook / Meal Prep Planner
// =============================================================================

import React, { useState, useCallback } from 'react';
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
import { formatDuration } from '@utils/formatters';
import { hapticLight, hapticSuccess, hapticMedium } from '@utils/haptics';

interface PrepRecipe {
  id: string;
  name: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  steps: string[];
  containerLabel: string;
  completed: boolean;
}

interface PrepPlan {
  weekStart: string;
  totalPrepTimeMinutes: number;
  recipes: PrepRecipe[];
}

function generateMockPrepPlan(): PrepPlan {
  return {
    weekStart: new Date().toISOString(),
    totalPrepTimeMinutes: 180,
    recipes: [
      {
        id: '1',
        name: 'Grilled Chicken Breast',
        servings: 10,
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        calories: 280,
        protein: 52,
        carbs: 0,
        fat: 6,
        ingredients: ['3 lbs chicken breast', '2 tbsp olive oil', 'Salt & pepper', 'Garlic powder', 'Paprika'],
        steps: [
          'Season chicken breasts with spices',
          'Heat grill or pan to medium-high',
          'Cook 6-7 minutes per side',
          'Let rest 5 minutes, then slice',
          'Divide into 10 containers',
        ],
        containerLabel: 'Protein - Chicken',
        completed: false,
      },
      {
        id: '2',
        name: 'Brown Rice',
        servings: 10,
        prepTimeMinutes: 5,
        cookTimeMinutes: 45,
        calories: 216,
        protein: 5,
        carbs: 45,
        fat: 1.8,
        ingredients: ['3 cups brown rice', '6 cups water', '1 tsp salt'],
        steps: [
          'Rinse rice thoroughly',
          'Combine rice, water, and salt in pot',
          'Bring to boil, reduce to simmer',
          'Cook 40-45 minutes covered',
          'Fluff and divide into containers',
        ],
        containerLabel: 'Carbs - Rice',
        completed: false,
      },
      {
        id: '3',
        name: 'Roasted Vegetables',
        servings: 10,
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        calories: 85,
        protein: 3,
        carbs: 14,
        fat: 3,
        ingredients: ['2 lbs broccoli', '2 lbs sweet potato', '1 lb bell peppers', '3 tbsp olive oil', 'Italian seasoning'],
        steps: [
          'Preheat oven to 425F',
          'Chop all vegetables into even pieces',
          'Toss with olive oil and seasoning',
          'Spread on baking sheets',
          'Roast 25-30 minutes, stirring halfway',
        ],
        containerLabel: 'Veggies - Mixed',
        completed: false,
      },
      {
        id: '4',
        name: 'Overnight Oats',
        servings: 5,
        prepTimeMinutes: 10,
        cookTimeMinutes: 0,
        calories: 350,
        protein: 18,
        carbs: 48,
        fat: 10,
        ingredients: ['2.5 cups rolled oats', '2.5 cups almond milk', '5 scoops protein powder', '2.5 tbsp chia seeds', '1.25 cups mixed berries'],
        steps: [
          'Mix oats, milk, and protein powder',
          'Add chia seeds and stir well',
          'Divide into 5 mason jars',
          'Top each with berries',
          'Refrigerate overnight',
        ],
        containerLabel: 'Breakfast - Oats',
        completed: false,
      },
    ],
  };
}

export default function MealPrepScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [prepPlan, setPrepPlan] = useState<PrepPlan>(generateMockPrepPlan);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const completedCount = prepPlan.recipes.filter((r) => r.completed).length;
  const totalCount = prepPlan.recipes.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const totalServings = prepPlan.recipes.reduce((sum, r) => sum + r.servings, 0);

  const handleToggleRecipe = useCallback((recipeId: string) => {
    hapticLight();
    setExpandedRecipe((prev) => (prev === recipeId ? null : recipeId));
  }, []);

  const handleMarkComplete = useCallback((recipeId: string) => {
    hapticSuccess();
    setPrepPlan((prev) => ({
      ...prev,
      recipes: prev.recipes.map((r) =>
        r.id === recipeId ? { ...r, completed: !r.completed } : r,
      ),
    }));
  }, []);

  const handleGenerateNewPlan = useCallback(async () => {
    setIsGenerating(true);
    hapticMedium();

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setPrepPlan(generateMockPrepPlan());
    setExpandedRecipe(null);
    setIsGenerating(false);
    hapticSuccess();
    Alert.alert('New Plan Ready!', 'Your AI-generated meal prep plan has been created.');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.overviewRow}>
              <ProgressRing
                progress={progress}
                size={80}
                strokeWidth={7}
                color={colors.accent.success}
              >
                <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '700' }]}>
                  {completedCount}/{totalCount}
                </Text>
              </ProgressRing>
              <View style={{ flex: 1, marginLeft: spacing.lg }}>
                <Text style={[typography.h3, { color: colors.text.primary }]}>This Week's Prep</Text>
                <View style={[styles.overviewStats, { marginTop: spacing.sm, gap: spacing.sm }]}>
                  <View style={styles.statRow}>
                    <Ionicons name="time-outline" size={14} color={colors.text.muted} />
                    <Text style={[typography.caption, { color: colors.text.secondary, marginLeft: 4 }]}>
                      Total: {formatDuration(prepPlan.totalPrepTimeMinutes)}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Ionicons name="restaurant-outline" size={14} color={colors.text.muted} />
                    <Text style={[typography.caption, { color: colors.text.secondary, marginLeft: 4 }]}>
                      {totalServings} servings
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Ionicons name="cube-outline" size={14} color={colors.text.muted} />
                    <Text style={[typography.caption, { color: colors.text.secondary, marginLeft: 4 }]}>
                      {totalCount} recipes
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Container Labels */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Container Labels
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: spacing.lg }}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {prepPlan.recipes.map((recipe) => (
              <View
                key={recipe.id}
                style={[
                  styles.labelChip,
                  {
                    backgroundColor: recipe.completed
                      ? `${colors.accent.success}20`
                      : colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                  },
                ]}
              >
                <Text style={[typography.captionBold, { color: recipe.completed ? colors.accent.success : colors.text.primary }]}>
                  {recipe.containerLabel}
                </Text>
                <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 2 }]}>
                  {recipe.servings} servings
                </Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Recipes */}
        <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
          Recipes
        </Text>

        {prepPlan.recipes.map((recipe, index) => {
          const isExpanded = expandedRecipe === recipe.id;

          return (
            <Animated.View key={recipe.id} entering={FadeInDown.duration(300).delay(200 + index * 80)}>
              <Card style={{ marginBottom: spacing.sm, opacity: recipe.completed ? 0.7 : 1 }}>
                {/* Recipe Header */}
                <Pressable onPress={() => handleToggleRecipe(recipe.id)}>
                  <View style={styles.recipeHeader}>
                    <Pressable onPress={() => handleMarkComplete(recipe.id)} hitSlop={8} accessibilityLabel={`Mark ${recipe.name} as ${recipe.completed ? 'incomplete' : 'complete'}`} accessibilityRole="checkbox">
                      <Ionicons
                        name={recipe.completed ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={recipe.completed ? colors.accent.success : colors.text.muted}
                      />
                    </Pressable>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text
                        style={[
                          typography.bodyBold,
                          {
                            color: colors.text.primary,
                            textDecorationLine: recipe.completed ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {recipe.name}
                      </Text>
                      <View style={[styles.recipeMeta, { marginTop: 4, gap: spacing.sm }]}>
                        <Badge label={`${recipe.servings} servings`} size="sm" />
                        <Badge label={formatDuration(recipe.prepTimeMinutes + recipe.cookTimeMinutes)} size="sm" variant="info" />
                        <Text style={[typography.monoCaption, { color: colors.text.muted }]}>
                          {recipe.calories} cal/serving
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.text.muted}
                    />
                  </View>
                </Pressable>

                {/* Expanded Content */}
                {isExpanded && (
                  <View style={{ marginTop: spacing.lg }}>
                    {/* Ingredients */}
                    <Text style={[typography.captionBold, { color: colors.text.primary, marginBottom: spacing.sm }]}>
                      Ingredients
                    </Text>
                    {recipe.ingredients.map((ingredient, i) => (
                      <View key={i} style={[styles.ingredientRow, { paddingVertical: spacing.xs }]}>
                        <Ionicons name="ellipse" size={6} color={colors.text.muted} />
                        <Text style={[typography.caption, { color: colors.text.secondary, marginLeft: spacing.sm }]}>
                          {ingredient}
                        </Text>
                      </View>
                    ))}

                    {/* Steps */}
                    <Text style={[typography.captionBold, { color: colors.text.primary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                      Steps
                    </Text>
                    {recipe.steps.map((step, i) => (
                      <View key={i} style={[styles.stepRow, { paddingVertical: spacing.sm }]}>
                        <View
                          style={[
                            styles.stepNumber,
                            {
                              backgroundColor: colors.accent.primary,
                              borderRadius: borderRadius.full,
                            },
                          ]}
                        >
                          <Text style={[typography.tiny, { color: '#FFFFFF' }]}>{i + 1}</Text>
                        </View>
                        <Text style={[typography.caption, { color: colors.text.secondary, flex: 1, marginLeft: spacing.md }]}>
                          {step}
                        </Text>
                      </View>
                    ))}

                    {/* Per-serving macros */}
                    <View style={[styles.perServingRow, { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.subtle }]}>
                      <Text style={[typography.tiny, { color: colors.text.muted }]}>Per serving:</Text>
                      <Text style={[typography.monoCaption, { color: colors.text.primary }]}>
                        {recipe.calories} cal
                      </Text>
                      <Text style={[typography.monoCaption, { color: '#22C55E' }]}>P: {recipe.protein}g</Text>
                      <Text style={[typography.monoCaption, { color: '#3B82F6' }]}>C: {recipe.carbs}g</Text>
                      <Text style={[typography.monoCaption, { color: '#F59E0B' }]}>F: {recipe.fat}g</Text>
                    </View>
                  </View>
                )}
              </Card>
            </Animated.View>
          );
        })}

        {/* Generate New Plan */}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title={isGenerating ? 'Generating...' : 'Generate New Plan (AI)'}
            onPress={handleGenerateNewPlan}
            loading={isGenerating}
            variant="outline"
            leftIcon={<Ionicons name="sparkles" size={18} color={colors.accent.primary} />}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewStats: {},
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelChip: {},
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perServingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
