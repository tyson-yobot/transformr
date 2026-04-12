// =============================================================================
// TRANSFORMR -- Budget-Aware Grocery List (Module 5)
// AI-generated grocery list with per-item costs, running total, budget bar,
// and swap suggestion cards for over-budget items.
// =============================================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { BudgetBar } from '@components/ui/BudgetBar';
import { ProgressRing } from '@components/ui/ProgressRing';
import { Disclaimer } from '@components/ui/Disclaimer';
import { Skeleton } from '@components/ui/Skeleton';
import { formatCurrencyDetailed } from '@utils/formatters';
import { hapticLight, hapticSuccess, hapticMedium } from '@utils/haptics';
import { generateBudgetGroceryList } from '@services/ai/groceryList';
import { getWeeklyGroceryBudget } from '@services/ai/mealPrep';
import type {
  BudgetGroceryListResponse,
  GroceryAisle,
  GroceryItem as GroceryItemType,
  BudgetSwapSuggestion,
} from '@app-types/ai';

interface CheckedState {
  [itemKey: string]: boolean;
}

function itemKey(aisleName: string, itemName: string): string {
  return `${aisleName}::${itemName}`;
}

export default function GroceryListScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [groceryData, setGroceryData] = useState<BudgetGroceryListResponse | null>(null);
  const [checked, setChecked] = useState<CheckedState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeklyBudget, setWeeklyBudget] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [collapsedAisles, setCollapsedAisles] = useState<Set<string>>(new Set());
  const [showSwaps, setShowSwaps] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived data
  const allItems = useMemo(() => {
    if (!groceryData) return [];
    const items: { aisle: string; item: GroceryItemType }[] = [];
    for (const aisle of groceryData.aisles) {
      for (const item of aisle.items) {
        items.push({ aisle: aisle.name, item });
      }
    }
    return items;
  }, [groceryData]);

  const totalItems = allItems.length;
  const checkedCount = allItems.filter((ai) => checked[itemKey(ai.aisle, ai.item.name)]).length;
  const progressPercent = totalItems > 0 ? checkedCount / totalItems : 0;

  const remainingEstimated = useMemo(() => {
    return allItems
      .filter((ai) => !checked[itemKey(ai.aisle, ai.item.name)])
      .reduce((sum, ai) => sum + ai.item.estimated_cost, 0);
  }, [allItems, checked]);

  useEffect(() => {
    void loadBudget();
  }, []);

  async function loadBudget() {
    try {
      const budget = await getWeeklyGroceryBudget();
      setWeeklyBudget(budget);
    } catch {
      // Budget not set
    }
  }

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    hapticMedium();

    try {
      const result = await generateBudgetGroceryList({
        meal_plan: { meals: [] },
        budget_override: weeklyBudget > 0 ? weeklyBudget : undefined,
      });
      setGroceryData(result);
      setChecked({});
      setCollapsedAisles(new Set());
      hapticSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate grocery list';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setIsGenerating(false);
    }
  }, [weeklyBudget]);

  const handleToggleItem = useCallback((aisle: string, name: string) => {
    hapticLight();
    const key = itemKey(aisle, name);
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleToggleAisle = useCallback((aisle: string) => {
    hapticLight();
    setCollapsedAisles((prev) => {
      const next = new Set(prev);
      if (next.has(aisle)) {
        next.delete(aisle);
      } else {
        next.add(aisle);
      }
      return next;
    });
  }, []);

  const handleClearChecked = useCallback(() => {
    if (checkedCount === 0) return;
    hapticMedium();
    Alert.alert('Clear Checked', `Remove ${checkedCount} checked items from view?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          hapticSuccess();
          if (!groceryData) return;
          const newAisles = groceryData.aisles
            .map((aisle) => ({
              ...aisle,
              items: aisle.items.filter((item) => !checked[itemKey(aisle.name, item.name)]),
              aisle_subtotal: aisle.items
                .filter((item) => !checked[itemKey(aisle.name, item.name)])
                .reduce((s, item) => s + item.estimated_cost, 0),
            }))
            .filter((aisle) => aisle.items.length > 0);

          const newTotal = newAisles.reduce((s, a) => s + a.aisle_subtotal, 0);
          setGroceryData({
            ...groceryData,
            aisles: newAisles,
            estimated_total: newTotal,
          });
          setChecked({});
        },
      },
    ]);
  }, [checkedCount, groceryData, checked]);

  const handleShareList = useCallback(async () => {
    if (!groceryData) return;
    hapticLight();

    const uncheckedByAisle = groceryData.aisles
      .map((aisle) => {
        const unchecked = aisle.items.filter((item) => !checked[itemKey(aisle.name, item.name)]);
        if (unchecked.length === 0) return null;
        return `${aisle.name}:\n${unchecked.map((i) => `  - ${i.name} (${i.quantity}) ~${formatCurrencyDetailed(i.estimated_cost)}`).join('\n')}`;
      })
      .filter(Boolean)
      .join('\n\n');

    const message = `TRANSFORMR Grocery List\n\n${uncheckedByAisle}\n\nEst. Remaining: ${formatCurrencyDetailed(remainingEstimated)}`;

    try {
      await Share.share({ message });
    } catch {
      // Share cancelled
    }
  }, [groceryData, checked, remainingEstimated]);

  // ---------- Empty state ----------

  if (!groceryData && !isGenerating) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ScrollView
          contentContainerStyle={[styles.centerContent, { padding: spacing.lg }]}
          showsVerticalScrollIndicator={false}
        >
          <Ionicons name="cart-outline" size={56} color={colors.text.muted} />
          <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.lg }]}>
            AI Grocery List
          </Text>
          <Text style={[typography.caption, { color: colors.text.muted, marginTop: spacing.sm, textAlign: 'center' }]}>
            Generate a budget-aware grocery list from your meal plan with per-item cost estimates and smart swap suggestions.
          </Text>

          <Button
            title="Generate Grocery List"
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
        </ScrollView>
      </View>
    );
  }

  // ---------- Loading ----------

  if (isGenerating) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.accent.cyan} />
        <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.lg }]}>
          Building your grocery list...
        </Text>
        <Text style={[typography.caption, { color: colors.text.muted, marginTop: spacing.sm }]}>
          Estimating costs and organizing by aisle
        </Text>
      </View>
    );
  }

  if (!groceryData) return null;

  // ---------- List Loaded ----------

  const budgetStatusColor =
    groceryData.budget_status === 'under_budget'
      ? colors.accent.success
      : groceryData.budget_status === 'on_budget'
        ? colors.accent.gold
        : colors.accent.danger;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.summaryRow}>
              <ProgressRing
                progress={progressPercent}
                size={64}
                strokeWidth={5}
                color={colors.accent.success}
              >
                <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '700' }]}>
                  {checkedCount}/{totalItems}
                </Text>
              </ProgressRing>
              <View style={{ flex: 1, marginLeft: spacing.lg }}>
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  Shopping Progress
                </Text>
                <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]}>
                  Est. total: {formatCurrencyDetailed(groceryData.estimated_total)}
                </Text>
                <Text style={[typography.caption, { color: colors.text.muted }]}>
                  Remaining: {formatCurrencyDetailed(remainingEstimated)}
                </Text>
                <View style={[styles.budgetStatusRow, { marginTop: 4 }]}>
                  <View style={[styles.budgetDot, { backgroundColor: budgetStatusColor }]} />
                  <Text style={[typography.tiny, { color: budgetStatusColor, marginLeft: 4 }]}>
                    {groceryData.budget_status === 'under_budget' && 'Under Budget'}
                    {groceryData.budget_status === 'on_budget' && 'On Budget'}
                    {groceryData.budget_status === 'over_budget' && 'Over Budget'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Budget Bar */}
            {weeklyBudget > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <BudgetBar spent={groceryData.estimated_total} budget={weeklyBudget} />
              </View>
            )}

            <View style={[styles.actionButtons, { marginTop: spacing.md, gap: spacing.sm }]}>
              <Button
                title="Share"
                variant="outline"
                size="sm"
                leftIcon={<Ionicons name="share-outline" size={16} color={colors.text.primary} />}
                onPress={handleShareList}
              />
              {checkedCount > 0 && (
                <Button
                  title="Clear Checked"
                  variant="ghost"
                  size="sm"
                  onPress={handleClearChecked}
                  textStyle={{ color: colors.accent.danger }}
                />
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Budget Swap Suggestions */}
        {groceryData.budget_swap_suggestions.length > 0 && showSwaps && (
          <Animated.View entering={FadeInDown.duration(300).delay(50)}>
            <View style={[styles.swapHeader, { marginBottom: spacing.md }]}>
              <Ionicons name="swap-horizontal" size={18} color={colors.accent.cyan} />
              <Text style={[typography.bodyBold, { color: colors.text.primary, flex: 1, marginLeft: spacing.sm }]}>
                Budget-Saving Swaps
              </Text>
              <Pressable onPress={() => setShowSwaps(false)}>
                <Ionicons name="close" size={18} color={colors.text.muted} />
              </Pressable>
            </View>
            {groceryData.budget_swap_suggestions.map((swap, i) => (
              <Card
                key={i}
                style={{
                  marginBottom: spacing.sm,
                  backgroundColor: `${colors.accent.cyan}08`,
                  borderWidth: 1,
                  borderColor: `${colors.accent.cyan}30`,
                }}
              >
                <View style={styles.swapRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.caption, { color: colors.text.muted }]}>Replace</Text>
                    <Text style={[typography.bodyBold, { color: colors.accent.danger }]}>
                      {swap.original}
                    </Text>
                    <Ionicons name="arrow-down" size={14} color={colors.text.muted} style={{ marginVertical: 2 }} />
                    <Text style={[typography.caption, { color: colors.text.muted }]}>With</Text>
                    <Text style={[typography.bodyBold, { color: colors.accent.success }]}>
                      {swap.alternative}
                    </Text>
                    <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 4 }]}>
                      {swap.nutrition_impact}
                    </Text>
                  </View>
                  <View style={styles.savingsBox}>
                    <Text style={[typography.tiny, { color: colors.accent.success }]}>Save</Text>
                    <Text style={[typography.h3, { color: colors.accent.success }]}>
                      {formatCurrencyDetailed(swap.savings)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </Animated.View>
        )}

        {/* Auto-generated label */}
        <View style={[styles.autoLabel, { marginBottom: spacing.md, marginTop: spacing.sm }]}>
          <Ionicons name="sparkles" size={14} color={colors.accent.primary} />
          <Text style={[typography.tiny, { color: colors.accent.primary, marginLeft: 4 }]}>
            AI-generated with budget-aware pricing
          </Text>
        </View>

        {/* Aisle Sections */}
        {groceryData.aisles.map((aisle, aisleIndex) => {
          const isCollapsed = collapsedAisles.has(aisle.name);
          const aisleChecked = aisle.items.filter(
            (item) => checked[itemKey(aisle.name, item.name)],
          ).length;

          return (
            <Animated.View key={aisle.name} entering={FadeInDown.duration(300).delay(100 + aisleIndex * 50)}>
              <Pressable
                onPress={() => handleToggleAisle(aisle.name)}
                accessibilityLabel={`${aisle.name} section, ${aisleChecked} of ${aisle.items.length} checked`}
                accessibilityRole="button"
                style={[styles.aisleHeader, { marginBottom: spacing.sm, marginTop: aisleIndex > 0 ? spacing.md : 0 }]}
              >
                <Ionicons
                  name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={16}
                  color={colors.text.muted}
                />
                <Text style={[typography.bodyBold, { color: colors.text.primary, flex: 1, marginLeft: spacing.sm }]}>
                  {aisle.name}
                </Text>
                <Text style={[typography.monoCaption, { color: colors.text.muted, marginRight: spacing.sm }]}>
                  {formatCurrencyDetailed(aisle.aisle_subtotal)}
                </Text>
                <Badge
                  label={`${aisleChecked}/${aisle.items.length}`}
                  size="sm"
                  variant={aisleChecked === aisle.items.length ? 'success' : 'default'}
                />
              </Pressable>

              {!isCollapsed &&
                aisle.items.map((item) => {
                  const key = itemKey(aisle.name, item.name);
                  const isChecked = checked[key] ?? false;

                  return (
                    <Pressable
                      key={key}
                      onPress={() => handleToggleItem(aisle.name, item.name)}
                      style={[
                        styles.itemRow,
                        {
                          backgroundColor: colors.background.secondary,
                          borderRadius: borderRadius.md,
                          padding: spacing.md,
                          marginBottom: spacing.xs,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isChecked ? colors.accent.success : colors.text.muted}
                      />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text
                          style={[
                            typography.body,
                            {
                              color: colors.text.primary,
                              textDecorationLine: isChecked ? 'line-through' : 'none',
                              opacity: isChecked ? 0.5 : 1,
                            },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <View style={[styles.itemMeta, { gap: spacing.sm, marginTop: 2 }]}>
                          <Text style={[typography.tiny, { color: colors.text.muted }]}>
                            {item.quantity}
                          </Text>
                          {item.notes && (
                            <Text style={[typography.tiny, { color: colors.accent.cyan }]} numberOfLines={1}>
                              {item.notes}
                            </Text>
                          )}
                        </View>
                        {item.meals_used_in.length > 0 && (
                          <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 2 }]} numberOfLines={1}>
                            Used in: {item.meals_used_in.join(', ')}
                          </Text>
                        )}
                      </View>
                      <Text style={[typography.monoCaption, { color: colors.text.secondary }]}>
                        {formatCurrencyDetailed(item.estimated_cost)}
                      </Text>
                    </Pressable>
                  );
                })}
            </Animated.View>
          );
        })}

        {/* Shopping Tips */}
        {groceryData.shopping_tips.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300).delay(300)}>
            <Card style={{ marginTop: spacing.lg, backgroundColor: `${colors.accent.primary}10` }}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb-outline" size={16} color={colors.accent.primary} />
                <Text style={[typography.captionBold, { color: colors.accent.primary, marginLeft: spacing.xs }]}>
                  Shopping Tips
                </Text>
              </View>
              {groceryData.shopping_tips.map((tip, i) => (
                <Text key={i} style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
                  {tip}
                </Text>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Already Have */}
        {groceryData.items_already_have.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300).delay(350)}>
            <Card style={{ marginTop: spacing.md }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
                Skipped — Already in Pantry
              </Text>
              <Text style={[typography.caption, { color: colors.text.muted }]}>
                {groceryData.items_already_have.join(', ')}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Regenerate */}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title="Regenerate List"
            onPress={handleGenerate}
            loading={isGenerating}
            variant="outline"
            leftIcon={<Ionicons name="sparkles" size={18} color={colors.accent.primary} />}
            fullWidth
          />
        </View>

        <Disclaimer type="nutrition" style={{ marginTop: spacing.lg }} />
      </ScrollView>

      {/* Add FAB */}
      <Pressable
        onPress={() => {
          hapticLight();
          setShowAddModal(true);
        }}
        accessibilityLabel="Add grocery item"
        accessibilityRole="button"
        style={[styles.fab, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.full }]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        title="Add Grocery Item"
      >
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Input
            label="Item Name"
            placeholder="e.g. Chicken Breast"
            value={newItemName}
            onChangeText={setNewItemName}
          />
          <Input
            label="Quantity"
            placeholder="e.g. 2 lbs"
            value={newItemQty}
            onChangeText={setNewItemQty}
          />
          <Button
            title="Add Item"
            onPress={() => {
              if (newItemName.trim().length === 0) return;
              hapticSuccess();
              if (!groceryData) return;
              const targetAisle =
                groceryData.aisles.length > 0
                  ? groceryData.aisles[groceryData.aisles.length - 1]
                  : null;

              if (targetAisle) {
                const newItem: GroceryItemType = {
                  name: newItemName.trim(),
                  quantity: newItemQty.trim() || '1',
                  estimated_cost: 0,
                  notes: null,
                  meals_used_in: [],
                };
                const updatedAisles = groceryData.aisles.map((a) =>
                  a.name === targetAisle.name
                    ? { ...a, items: [...a.items, newItem] }
                    : a,
                );
                setGroceryData({ ...groceryData, aisles: updatedAisles });
              } else {
                const newAisle: GroceryAisle = {
                  name: 'Other',
                  items: [
                    {
                      name: newItemName.trim(),
                      quantity: newItemQty.trim() || '1',
                      estimated_cost: 0,
                      notes: null,
                      meals_used_in: [],
                    },
                  ],
                  aisle_subtotal: 0,
                };
                setGroceryData({ ...groceryData, aisles: [...groceryData.aisles, newAisle] });
              }

              setShowAddModal(false);
              setNewItemName('');
              setNewItemQty('');
            }}
            disabled={newItemName.trim().length === 0}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  swapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsBox: {
    alignItems: 'center',
    marginLeft: 12,
  },
  autoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aisleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
