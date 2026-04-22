// =============================================================================
// TRANSFORMR -- Budget-Aware Meal Prep Planner (Module 5)
// AI-generated tiered meal prep: Good / Better / Best with cost comparison,
// BudgetBar, and full recipe details.
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
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { FeatureLockOverlay } from '@components/ui/FeatureLockOverlay';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { BudgetBar } from '@components/ui/BudgetBar';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Disclaimer } from '@components/ui/Disclaimer';
import { ProgressRing } from '@components/ui/ProgressRing';
import { formatDuration, formatCurrencyDetailed } from '@utils/formatters';
import { hapticLight, hapticSuccess, hapticMedium } from '@utils/haptics';
import {
  generateBudgetMealPrepPlan,
  getWeeklyGroceryBudget,
  updateWeeklyGroceryBudget,
} from '@services/ai/mealPrep';
import type {
  MealPrepTier,
  BudgetMealPrepResponse,
} from '@app-types/ai';
import type { MealPrepParams } from '@services/ai/mealPrep';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { SCREEN_HELP } from '../../../constants/screenHelp';

const TIER_ICONS: Record<MealPrepTier, { label: string; icon: string }> = {
  good: { label: 'Good', icon: 'wallet-outline' },
  better: { label: 'Better', icon: 'star-half-outline' },
  best: { label: 'Best', icon: 'diamond-outline' },
};

export default function MealPrepScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const gate = useFeatureGate('ai_meal_prep');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.mealPrepScreen} />,
    });
  }, [navigation]);

  const [prepResponse, setPrepResponse] = useState<BudgetMealPrepResponse | null>(null);
  const [selectedTier, setSelectedTier] = useState<MealPrepTier>('good');
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [completedRecipes, setCompletedRecipes] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [weeklyBudget, setWeeklyBudget] = useState(0);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentTierPlan = useMemo(() => {
    if (!prepResponse) return null;
    return prepResponse.tiers.find((t) => t.tier === selectedTier) ?? null;
  }, [prepResponse, selectedTier]);

  const completedCount = useMemo(() => {
    if (!currentTierPlan) return 0;
    return currentTierPlan.meals.filter((m) => completedRecipes.has(m.name)).length;
  }, [currentTierPlan, completedRecipes]);

  const totalCount = currentTierPlan?.meals.length ?? 0;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const totalServings = useMemo(() => {
    if (!currentTierPlan) return 0;
    return currentTierPlan.meals.reduce((sum, m) => sum + m.servings, 0);
  }, [currentTierPlan]);

  const handleLoadBudget = useCallback(async () => {
    setIsLoadingBudget(true);
    try {
      const budget = await getWeeklyGroceryBudget();
      setWeeklyBudget(budget);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load your grocery budget.';
      setError(msg);
    } finally {
      setIsLoadingBudget(false);
    }
  }, []);

  const handleSaveBudget = useCallback(async () => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val < 0) return;
    try {
      await updateWeeklyGroceryBudget(val);
      setWeeklyBudget(val);
      setShowBudgetModal(false);
      hapticSuccess();
    } catch {
      Alert.alert('Error', 'Failed to save budget.');
    }
  }, [budgetInput]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    hapticMedium();

    try {
      if (weeklyBudget === 0) {
        const budget = await getWeeklyGroceryBudget();
        setWeeklyBudget(budget);
      }

      const params: MealPrepParams = {
        budget_override: weeklyBudget > 0 ? weeklyBudget : undefined,
      };

      const result = await generateBudgetMealPrepPlan(params);
      setPrepResponse(result);
      setCompletedRecipes(new Set());
      setExpandedRecipe(null);

      if (result.tiers.length > 0) {
        setSelectedTier(result.tiers[0]?.tier ?? 'good');
      }
      hapticSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate meal prep plan';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setIsGenerating(false);
    }
  }, [weeklyBudget]);

  const handleToggleRecipe = useCallback((recipeName: string) => {
    hapticLight();
    setExpandedRecipe((prev) => (prev === recipeName ? null : recipeName));
  }, []);

  const handleMarkComplete = useCallback((recipeName: string) => {
    hapticSuccess();
    setCompletedRecipes((prev) => {
      const next = new Set(prev);
      if (next.has(recipeName)) {
        next.delete(recipeName);
      } else {
        next.add(recipeName);
      }
      return next;
    });
  }, []);

  const handleSelectTier = useCallback((tier: MealPrepTier) => {
    hapticLight();
    setSelectedTier(tier);
    setExpandedRecipe(null);
  }, []);

  // Load budget on mount
  React.useEffect(() => {
    void handleLoadBudget();
  }, [handleLoadBudget]);

  if (!gate.isAvailable) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <FeatureLockOverlay
          featureKey="ai_meal_prep"
          title="AI Meal Prep"
          description="Get personalized weekly meal prep plans optimized for your macros and preferences."
          onGoBack={() => navigation.goBack()}
        />
      </View>
    );
  }

  // ---------- Empty / Loading / Error States ----------

  if (isGenerating) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ListSkeleton />
      </View>
    );
  }

  if (!prepResponse) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ScrollView
          contentContainerStyle={[styles.centerContent, { padding: spacing.lg }]}
          showsVerticalScrollIndicator={false}
        >
          <Ionicons name="restaurant-outline" size={56} color={colors.text.muted} />
          <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.lg }]}>
            AI Meal Prep Planner
          </Text>
          <Text style={[typography.caption, { color: colors.text.muted, marginTop: spacing.sm, textAlign: 'center' }]}>
            Generate a tiered weekly meal prep plan with Good, Better, and Best options matched to your budget and macros.
          </Text>

          {weeklyBudget > 0 && (
            <Pressable
              onPress={() => {
                setBudgetInput(weeklyBudget.toString());
                setShowBudgetModal(true);
              }}
              style={{ marginTop: spacing.lg, width: '100%' }}
            >
              <Card>
                <View style={styles.budgetRow}>
                  <Ionicons name="wallet-outline" size={20} color={colors.accent.primary} />
                  <Text style={[typography.body, { color: colors.text.primary, marginLeft: spacing.sm }]}>
                    Weekly Grocery Budget
                  </Text>
                  <Text style={[typography.bodyBold, { color: colors.accent.success, marginLeft: 'auto' }]}>
                    {formatCurrencyDetailed(weeklyBudget)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}

          {weeklyBudget === 0 && !isLoadingBudget && (
            <Button
              title="Set Weekly Budget"
              variant="outline"
              size="sm"
              onPress={() => {
                setBudgetInput('');
                setShowBudgetModal(true);
              }}
              style={{ marginTop: spacing.lg }}
            />
          )}

          <Button
            title="Generate Meal Prep Plan"
            onPress={handleGenerate}
            loading={isGenerating}
            leftIcon={<Ionicons name="sparkles" size={18} color="#FFFFFF" />}
            fullWidth
            style={{ marginTop: spacing.xl }}
          />

          {error && (
            <Text style={[typography.caption, { color: colors.accent.danger, marginTop: spacing.md }]}>
              {error}
            </Text>
          )}

          <Disclaimer type="nutrition" style={{ marginTop: spacing.xl }} />

          <Modal visible={showBudgetModal} onDismiss={() => setShowBudgetModal(false)} title="Weekly Grocery Budget">
            <View style={{ padding: spacing.lg, gap: spacing.md }}>
              <Input
                label="Budget ($)"
                placeholder="e.g. 100"
                keyboardType="numeric"
                value={budgetInput}
                onChangeText={setBudgetInput}
              />
              <Button title="Save" onPress={handleSaveBudget} fullWidth />
            </View>
          </Modal>
        </ScrollView>
      </View>
    );
  }

  // ---------- Plan Loaded ----------

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Bar */}
        {weeklyBudget > 0 && currentTierPlan && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Pressable
              onPress={() => {
                setBudgetInput(weeklyBudget.toString());
                setShowBudgetModal(true);
              }}
            >
              <Card style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
                  Weekly Grocery Budget
                </Text>
                <BudgetBar spent={currentTierPlan.estimated_weekly_cost} budget={weeklyBudget} />
              </Card>
            </Pressable>
          </Animated.View>
        )}

        {/* Tier Selector */}
        <Animated.View entering={FadeInDown.duration(300).delay(50)}>
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Choose Your Tier
          </Text>
          <View style={[styles.tierRow, { gap: spacing.sm, marginBottom: spacing.lg }]}>
            {prepResponse.tiers.map((tierPlan) => {
              const tierColor = tierPlan.tier === 'good'
                ? colors.accent.success
                : tierPlan.tier === 'better'
                  ? colors.accent.cyan
                  : colors.accent.warning;
              const config = { ...TIER_ICONS[tierPlan.tier], color: tierColor };
              const isActive = selectedTier === tierPlan.tier;

              return (
                <Pressable
                  key={tierPlan.tier}
                  onPress={() => handleSelectTier(tierPlan.tier)}
                  style={[
                    styles.tierCard,
                    {
                      backgroundColor: isActive ? `${config.color}20` : colors.background.secondary,
                      borderRadius: borderRadius.lg,
                      padding: spacing.md,
                      borderWidth: isActive ? 2 : 1,
                      borderColor: isActive ? config.color : colors.border.subtle,
                    },
                  ]}
                >
                  <Ionicons
                    name={config.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={isActive ? config.color : colors.text.muted}
                  />
                  <Text
                    style={[
                      typography.captionBold,
                      {
                        color: isActive ? config.color : colors.text.primary,
                        marginTop: 4,
                      },
                    ]}
                  >
                    {config.label}
                  </Text>
                  <Text
                    style={[
                      typography.monoCaption,
                      {
                        color: isActive ? config.color : colors.text.muted,
                        marginTop: 2,
                      },
                    ]}
                  >
                    ~{formatCurrencyDetailed(tierPlan.estimated_weekly_cost)}/wk
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Cost Comparison Notes */}
        {prepResponse.cost_comparison_notes.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300).delay(100)}>
            <Card style={{ marginBottom: spacing.lg, backgroundColor: `${colors.accent.cyan}10` }}>
              <View style={styles.costNotesHeader}>
                <Ionicons name="bulb-outline" size={16} color={colors.accent.cyan} />
                <Text style={[typography.captionBold, { color: colors.accent.cyan, marginLeft: spacing.xs }]}>
                  Cost Comparison
                </Text>
              </View>
              {prepResponse.cost_comparison_notes.map((note, i) => (
                <Text
                  key={i}
                  style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}
                >
                  {note}
                </Text>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Overview Card */}
        {currentTierPlan && (
          <Animated.View entering={FadeInDown.duration(300).delay(150)}>
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
                  <Text style={[typography.h3, { color: colors.text.primary }]}>
                    {currentTierPlan.tier_label}
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]}>
                    {currentTierPlan.description}
                  </Text>
                  <View style={[styles.overviewStats, { marginTop: spacing.sm, gap: spacing.sm }]}>
                    <View style={styles.statRow}>
                      <Ionicons name="time-outline" size={14} color={colors.text.muted} />
                      <Text style={[typography.caption, { color: colors.text.secondary, marginLeft: 4 }]}>
                        {currentTierPlan.prep_day_schedule.total_time_hours}h prep
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Ionicons name="restaurant-outline" size={14} color={colors.text.muted} />
                      <Text style={[typography.caption, { color: colors.text.secondary, marginLeft: 4 }]}>
                        {totalServings} servings
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Ionicons name="cash-outline" size={14} color={colors.text.muted} />
                      <Text style={[typography.caption, { color: colors.text.secondary, marginLeft: 4 }]}>
                        ~{formatCurrencyDetailed(currentTierPlan.estimated_weekly_cost)}/wk
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Weekly macro average */}
              <View style={[styles.macroRow, { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.subtle }]}>
                <View style={styles.macroItem}>
                  <Text style={[typography.monoCaption, { color: colors.text.muted }]}>Cal</Text>
                  <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                    {currentTierPlan.weekly_macro_average.calories}
                  </Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[typography.monoCaption, { color: colors.accent.success }]}>Protein</Text>
                  <Text style={[typography.bodyBold, { color: colors.accent.success }]}>
                    {currentTierPlan.weekly_macro_average.protein_g}g
                  </Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[typography.monoCaption, { color: colors.accent.info }]}>Carbs</Text>
                  <Text style={[typography.bodyBold, { color: colors.accent.info }]}>
                    {currentTierPlan.weekly_macro_average.carbs_g}g
                  </Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[typography.monoCaption, { color: colors.accent.warning }]}>Fat</Text>
                  <Text style={[typography.bodyBold, { color: colors.accent.warning }]}>
                    {currentTierPlan.weekly_macro_average.fat_g}g
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Container Labels */}
        {currentTierPlan && (
          <Animated.View entering={FadeInDown.duration(300).delay(200)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
              Container Labels
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: spacing.lg }}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {currentTierPlan.meals.map((meal) => {
                const isDone = completedRecipes.has(meal.name);
                return (
                  <View
                    key={meal.name}
                    style={[
                      styles.labelChip,
                      {
                        backgroundColor: isDone ? `${colors.accent.success}20` : colors.background.secondary,
                        borderRadius: borderRadius.md,
                        padding: spacing.md,
                      },
                    ]}
                  >
                    <Text style={[typography.captionBold, { color: isDone ? colors.accent.success : colors.text.primary }]}>
                      {meal.container_label}
                    </Text>
                    <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 2 }]}>
                      {meal.servings} servings
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Recipes */}
        {currentTierPlan && (
          <>
            <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
              Recipes
            </Text>

            {currentTierPlan.meals.map((meal, index) => {
              const isExpanded = expandedRecipe === meal.name;
              const isDone = completedRecipes.has(meal.name);
              const ingredientCost = meal.ingredients.reduce((s, ig) => s + ig.estimated_cost, 0);

              return (
                <Animated.View key={meal.name} entering={FadeInDown.duration(300).delay(250 + index * 60)}>
                  <Card style={{ marginBottom: spacing.sm, opacity: isDone ? 0.7 : 1 }}>
                    <Pressable onPress={() => handleToggleRecipe(meal.name)}>
                      <View style={styles.recipeHeader}>
                        <Pressable
                          onPress={() => handleMarkComplete(meal.name)}
                          hitSlop={8}
                          accessibilityLabel={`Mark ${meal.name} as ${isDone ? 'incomplete' : 'complete'}`}
                          accessibilityRole="checkbox"
                        >
                          <Ionicons
                            name={isDone ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={isDone ? colors.accent.success : colors.text.muted}
                          />
                        </Pressable>
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                          <Text
                            style={[
                              typography.bodyBold,
                              {
                                color: colors.text.primary,
                                textDecorationLine: isDone ? 'line-through' : 'none',
                              },
                            ]}
                          >
                            {meal.name}
                          </Text>
                          <View style={[styles.recipeMeta, { marginTop: 4, gap: spacing.sm }]}>
                            <Badge label={`${meal.servings} servings`} size="sm" />
                            <Badge
                              label={formatDuration(meal.prep_time_minutes + meal.cook_time_minutes)}
                              size="sm"
                              variant="info"
                            />
                            <Text style={[typography.monoCaption, { color: colors.text.muted }]}>
                              {meal.per_serving_macros.calories} cal/srv
                            </Text>
                            <Text style={[typography.monoCaption, { color: colors.accent.success }]}>
                              ~{formatCurrencyDetailed(ingredientCost)}
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

                    {isExpanded && (
                      <View style={{ marginTop: spacing.lg }}>
                        {/* Ingredients with costs */}
                        <Text style={[typography.captionBold, { color: colors.text.primary, marginBottom: spacing.sm }]}>
                          Ingredients
                        </Text>
                        {meal.ingredients.map((ingredient, i) => (
                          <View key={i} style={[styles.ingredientRow, { paddingVertical: spacing.xs }]}>
                            <Ionicons name="ellipse" size={6} color={colors.text.muted} />
                            <Text style={[typography.caption, { color: colors.text.secondary, flex: 1, marginLeft: spacing.sm }]}>
                              {ingredient.name} — {ingredient.quantity}
                            </Text>
                            <Text style={[typography.monoCaption, { color: colors.text.muted }]}>
                              {formatCurrencyDetailed(ingredient.estimated_cost)}
                            </Text>
                          </View>
                        ))}

                        {/* Steps */}
                        <Text style={[typography.captionBold, { color: colors.text.primary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                          Steps
                        </Text>
                        {meal.instructions.map((step, i) => (
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
                              <Text style={[typography.tiny, { color: colors.text.inverse }]}>{i + 1}</Text>
                            </View>
                            <Text style={[typography.caption, { color: colors.text.secondary, flex: 1, marginLeft: spacing.md }]}>
                              {step}
                            </Text>
                          </View>
                        ))}

                        {/* Storage & reheat */}
                        <View style={[styles.storageRow, { marginTop: spacing.md, gap: spacing.md }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[typography.tiny, { color: colors.text.muted }]}>Storage</Text>
                            <Text style={[typography.caption, { color: colors.text.secondary }]}>{meal.storage}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[typography.tiny, { color: colors.text.muted }]}>Reheat</Text>
                            <Text style={[typography.caption, { color: colors.text.secondary }]}>{meal.reheat}</Text>
                          </View>
                        </View>

                        {/* Per-serving macros */}
                        <View style={[styles.perServingRow, { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.subtle }]}>
                          <Text style={[typography.tiny, { color: colors.text.muted }]}>Per serving:</Text>
                          <Text style={[typography.monoCaption, { color: colors.text.primary }]}>
                            {meal.per_serving_macros.calories} cal
                          </Text>
                          <Text style={[typography.monoCaption, { color: colors.accent.success }]}>
                            P: {meal.per_serving_macros.protein_g}g
                          </Text>
                          <Text style={[typography.monoCaption, { color: colors.accent.info }]}>
                            C: {meal.per_serving_macros.carbs_g}g
                          </Text>
                          <Text style={[typography.monoCaption, { color: colors.accent.warning }]}>
                            F: {meal.per_serving_macros.fat_g}g
                          </Text>
                        </View>
                      </View>
                    )}
                  </Card>
                </Animated.View>
              );
            })}
          </>
        )}

        {/* Generate New Plan */}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title="Generate New Plan"
            onPress={handleGenerate}
            loading={isGenerating}
            variant="outline"
            leftIcon={<Ionicons name="sparkles" size={18} color={colors.accent.primary} />}
            fullWidth
          />
        </View>

        <Disclaimer type="nutrition" style={{ marginTop: spacing.lg }} />
      </ScrollView>

      {/* Budget Modal */}
      <Modal visible={showBudgetModal} onDismiss={() => setShowBudgetModal(false)} title="Weekly Grocery Budget">
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Input
            label="Budget ($)"
            placeholder="e.g. 100"
            keyboardType="numeric"
            value={budgetInput}
            onChangeText={setBudgetInput}
          />
          <Button title="Save" onPress={handleSaveBudget} fullWidth />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierRow: {
    flexDirection: 'row',
  },
  tierCard: {
    flex: 1,
    alignItems: 'center',
  },
  costNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewStats: {},
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  labelChip: { borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.15)' },
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
  storageRow: {
    flexDirection: 'row',
  },
  perServingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
