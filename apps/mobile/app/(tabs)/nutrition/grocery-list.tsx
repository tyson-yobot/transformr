// =============================================================================
// TRANSFORMR -- Smart Grocery List
// =============================================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { ProgressRing } from '@components/ui/ProgressRing';
import { formatCurrencyDetailed } from '@utils/formatters';
import { hapticLight, hapticSuccess, hapticMedium } from '@utils/haptics';

const AISLES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Grains & Bread',
  'Canned & Dry',
  'Frozen',
  'Snacks',
  'Beverages',
  'Supplements',
  'Other',
] as const;

type Aisle = typeof AISLES[number];

interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  aisle: Aisle;
  estimatedPrice: number;
  isChecked: boolean;
  fromMealPlan: boolean;
}

export default function GroceryListScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemAisle, setNewItemAisle] = useState<Aisle>('Other');
  const [collapsedAisles, setCollapsedAisles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const mockItems: GroceryItem[] = [
      { id: '1', name: 'Chicken Breast', quantity: '4 lbs', aisle: 'Meat & Seafood', estimatedPrice: 12.99, isChecked: false, fromMealPlan: true },
      { id: '2', name: 'Brown Rice', quantity: '2 lbs', aisle: 'Grains & Bread', estimatedPrice: 3.49, isChecked: true, fromMealPlan: true },
      { id: '3', name: 'Broccoli', quantity: '3 heads', aisle: 'Produce', estimatedPrice: 4.50, isChecked: false, fromMealPlan: true },
      { id: '4', name: 'Sweet Potatoes', quantity: '4 medium', aisle: 'Produce', estimatedPrice: 3.99, isChecked: false, fromMealPlan: true },
      { id: '5', name: 'Greek Yogurt', quantity: '32 oz', aisle: 'Dairy & Eggs', estimatedPrice: 5.99, isChecked: false, fromMealPlan: true },
      { id: '6', name: 'Eggs', quantity: '1 dozen', aisle: 'Dairy & Eggs', estimatedPrice: 4.29, isChecked: false, fromMealPlan: false },
      { id: '7', name: 'Frozen Berries', quantity: '2 bags', aisle: 'Frozen', estimatedPrice: 7.98, isChecked: false, fromMealPlan: true },
      { id: '8', name: 'Almond Milk', quantity: '1/2 gallon', aisle: 'Beverages', estimatedPrice: 3.99, isChecked: true, fromMealPlan: true },
      { id: '9', name: 'Whey Protein', quantity: '1 tub', aisle: 'Supplements', estimatedPrice: 29.99, isChecked: false, fromMealPlan: false },
      { id: '10', name: 'Olive Oil', quantity: '1 bottle', aisle: 'Canned & Dry', estimatedPrice: 8.99, isChecked: false, fromMealPlan: true },
    ];
    setItems(mockItems);
    setIsLoading(false);
  }, []);

  const groupedItems = useMemo(() => {
    const groups: Record<string, GroceryItem[]> = {};
    for (const aisle of AISLES) {
      const aisleItems = items.filter((item) => item.aisle === aisle);
      if (aisleItems.length > 0) {
        groups[aisle] = aisleItems;
      }
    }
    return groups;
  }, [items]);

  const checkedCount = items.filter((i) => i.isChecked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? checkedCount / totalCount : 0;
  const totalEstimated = items.reduce((sum, i) => sum + i.estimatedPrice, 0);
  const remainingEstimated = items.filter((i) => !i.isChecked).reduce((sum, i) => sum + i.estimatedPrice, 0);

  const handleToggleItem = useCallback((itemId: string) => {
    hapticLight();
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isChecked: !i.isChecked } : i)),
    );
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    hapticLight();
    Alert.alert('Remove Item', 'Remove this item from your grocery list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setItems((prev) => prev.filter((i) => i.id !== itemId)),
      },
    ]);
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

  const handleAddItem = useCallback(() => {
    if (newItemName.trim().length === 0) return;
    hapticSuccess();
    const newItem: GroceryItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      quantity: newItemQty.trim() || '1',
      aisle: newItemAisle,
      estimatedPrice: 0,
      isChecked: false,
      fromMealPlan: false,
    };
    setItems((prev) => [...prev, newItem]);
    setShowAddModal(false);
    setNewItemName('');
    setNewItemQty('');
  }, [newItemName, newItemQty, newItemAisle]);

  const handleClearChecked = useCallback(() => {
    const checkedItems = items.filter((i) => i.isChecked);
    if (checkedItems.length === 0) return;
    hapticMedium();
    Alert.alert('Clear Checked', `Remove ${checkedItems.length} checked items?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          hapticSuccess();
          setItems((prev) => prev.filter((i) => !i.isChecked));
        },
      },
    ]);
  }, [items]);

  const handleShareList = useCallback(async () => {
    hapticLight();
    const uncheckedByAisle = Object.entries(groupedItems)
      .map(([aisle, aisleItems]) => {
        const unchecked = aisleItems.filter((i) => !i.isChecked);
        if (unchecked.length === 0) return null;
        return `${aisle}:\n${unchecked.map((i) => `  - ${i.name} (${i.quantity})`).join('\n')}`;
      })
      .filter(Boolean)
      .join('\n\n');

    const message = `TRANSFORMR Grocery List\n\n${uncheckedByAisle}\n\nEst. Total: ${formatCurrencyDetailed(remainingEstimated)}`;

    try {
      await Share.share({ message });
    } catch {
      // Share cancelled
    }
  }, [groupedItems, remainingEstimated]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
          </View>
        ) : (
          <>
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
                    <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                      {checkedCount}/{totalCount}
                    </Text>
                  </ProgressRing>
                  <View style={{ flex: 1, marginLeft: spacing.lg }}>
                    <Text style={[typography.h3, { color: colors.text.primary }]}>
                      Shopping Progress
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]}>
                      Est. total: {formatCurrencyDetailed(totalEstimated)}
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.muted }]}>
                      Remaining: {formatCurrencyDetailed(remainingEstimated)}
                    </Text>
                  </View>
                </View>

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

            {/* Auto-generated label */}
            <View style={[styles.autoLabel, { marginBottom: spacing.md }]}>
              <Ionicons name="sparkles" size={14} color={colors.accent.primary} />
              <Text style={[typography.tiny, { color: colors.accent.primary, marginLeft: 4 }]}>
                Auto-generated from your meal plan
              </Text>
            </View>

            {/* Aisle Sections */}
            {Object.entries(groupedItems).map(([aisle, aisleItems], aisleIndex) => {
              const isCollapsed = collapsedAisles.has(aisle);
              const aisleChecked = aisleItems.filter((i) => i.isChecked).length;

              return (
                <Animated.View key={aisle} entering={FadeInDown.duration(300).delay(aisleIndex * 60)}>
                  <Pressable
                    onPress={() => handleToggleAisle(aisle)}
                    style={[styles.aisleHeader, { marginBottom: spacing.sm, marginTop: aisleIndex > 0 ? spacing.md : 0 }]}
                  >
                    <Ionicons
                      name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                      size={16}
                      color={colors.text.muted}
                    />
                    <Text style={[typography.bodyBold, { color: colors.text.primary, flex: 1, marginLeft: spacing.sm }]}>
                      {aisle}
                    </Text>
                    <Badge
                      label={`${aisleChecked}/${aisleItems.length}`}
                      size="sm"
                      variant={aisleChecked === aisleItems.length ? 'success' : 'default'}
                    />
                  </Pressable>

                  {!isCollapsed &&
                    aisleItems.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => handleToggleItem(item.id)}
                        onLongPress={() => handleDeleteItem(item.id)}
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
                          name={item.isChecked ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={item.isChecked ? colors.accent.success : colors.text.muted}
                        />
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                          <Text
                            style={[
                              typography.body,
                              {
                                color: colors.text.primary,
                                textDecorationLine: item.isChecked ? 'line-through' : 'none',
                                opacity: item.isChecked ? 0.5 : 1,
                              },
                            ]}
                          >
                            {item.name}
                          </Text>
                          <View style={[styles.itemMeta, { gap: spacing.sm, marginTop: 2 }]}>
                            <Text style={[typography.tiny, { color: colors.text.muted }]}>{item.quantity}</Text>
                            {item.estimatedPrice > 0 && (
                              <Text style={[typography.tiny, { color: colors.text.muted }]}>
                                ~{formatCurrencyDetailed(item.estimatedPrice)}
                              </Text>
                            )}
                            {item.fromMealPlan && (
                              <Badge label="Meal Plan" size="sm" variant="info" />
                            )}
                          </View>
                        </View>
                        <Pressable onPress={() => handleDeleteItem(item.id)} hitSlop={8}>
                          <Ionicons name="close-circle-outline" size={20} color={colors.text.muted} />
                        </Pressable>
                      </Pressable>
                    ))}
                </Animated.View>
              );
            })}

            {items.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={48} color={colors.text.muted} />
                <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md }]}>
                  Your grocery list is empty
                </Text>
                <Text style={[typography.caption, { color: colors.text.muted, marginTop: spacing.xs }]}>
                  Create a meal plan to auto-generate your list
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add FAB */}
      <Pressable
        onPress={() => { hapticLight(); setShowAddModal(true); }}
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
          <Text style={[typography.caption, { color: colors.text.secondary }]}>Aisle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {AISLES.map((aisle) => (
              <Pressable
                key={aisle}
                onPress={() => setNewItemAisle(aisle)}
                style={[
                  styles.aisleChip,
                  {
                    backgroundColor: newItemAisle === aisle ? colors.accent.primary : colors.background.tertiary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.tiny, { color: newItemAisle === aisle ? '#FFFFFF' : colors.text.secondary }]}>
                  {aisle}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Button
            title="Add Item"
            onPress={handleAddItem}
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
  loadingState: { alignItems: 'center', paddingVertical: 60 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  autoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aisleHeader: { flexDirection: 'row', alignItems: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemMeta: { flexDirection: 'row', alignItems: 'center' },
  aisleChip: {},
  emptyState: { alignItems: 'center', paddingVertical: 60 },
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
