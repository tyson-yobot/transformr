// =============================================================================
// TRANSFORMR -- Budgets Screen
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Input } from '@components/ui/Input';
import { Chip } from '@components/ui/Chip';
import { Modal } from '@components/ui/Modal';
import { Skeleton } from '@components/ui/Skeleton';
import { EmptyState } from '@components/ui/EmptyState';
import { useFinanceStore } from '@stores/financeStore';
import { formatCurrency } from '@utils/formatters';
import { hapticSuccess } from '@utils/haptics';
import { supabase } from '@services/supabase';
import type { Budget } from '@app-types/database';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';

const BUDGET_CATEGORIES = [
  'food', 'housing', 'transportation', 'entertainment', 'health',
  'education', 'shopping', 'subscriptions', 'savings', 'other',
];

export default function BudgetsScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const budgets = useFinanceStore((s) => s.budgets);
  const isLoading = useFinanceStore((s) => s.isLoading);
  const error = useFinanceStore((s) => s.error);
  const fetchBudgets = useFinanceStore((s) => s.fetchBudgets);

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [formCategory, setFormCategory] = useState('food');
  const [formLimit, setFormLimit] = useState('');

  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const monthLabel = useMemo(() => {
    const parts = currentMonth.split('-');
    const year = parts[0] ?? '2024';
    const month = parts[1] ?? '01';
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBudgets();
    setRefreshing(false);
  }, [fetchBudgets]);

  const totalBudget = useMemo(
    () => budgets.reduce((sum, b) => sum + b.monthly_limit, 0),
    [budgets],
  );

  const totalSpent = useMemo(
    () => budgets.reduce((sum, b) => sum + (b.current_spent ?? 0), 0),
    [budgets],
  );

  const resetForm = useCallback(() => {
    setFormCategory('food');
    setFormLimit('');
    setEditingBudget(null);
  }, []);

  const openEdit = useCallback((budget: Budget) => {
    setEditingBudget(budget);
    setFormCategory(budget.category);
    setFormLimit(budget.monthly_limit.toString());
    setShowAddModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formLimit.trim()) return;
    const limitValue = parseFloat(formLimit);
    if (isNaN(limitValue) || limitValue <= 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingBudget) {
        await supabase
          .from('budgets')
          .update({ monthly_limit: limitValue, category: formCategory })
          .eq('id', editingBudget.id);
      } else {
        await supabase.from('budgets').insert({
          user_id: user.id,
          category: formCategory,
          monthly_limit: limitValue,
          current_spent: 0,
          month: currentMonth,
        });
      }

      await hapticSuccess();
      setShowAddModal(false);
      resetForm();
      await fetchBudgets();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save budget');
    }
  }, [formCategory, formLimit, editingBudget, currentMonth, fetchBudgets, resetForm]);

  if (isLoading && budgets.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton variant="card" height={100} />
          <Skeleton variant="card" height={80} />
          <Skeleton variant="card" height={80} />
        </View>
      </View>
    );
  }

  if (error && budgets.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, padding: spacing.lg }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <EmptyState
          ionIcon="alert-circle-outline"
          title="Something went wrong"
          subtitle={error}
          actionLabel="Retry"
          onAction={() => { fetchBudgets(); }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />
        }
      >
        {/* Month Header */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated">
            <Text style={[typography.h3, { color: colors.text.primary, textAlign: 'center' }]}>
              {monthLabel}
            </Text>
            <View style={[styles.summaryRow, { marginTop: spacing.md, gap: spacing.xl }]}>
              <View style={{ alignItems: 'center' }}>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>Budget</Text>
                <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                  {formatCurrency(totalBudget)}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>Spent</Text>
                <Text style={[typography.statSmall, { color: totalSpent > totalBudget ? colors.accent.danger : colors.accent.success }]}>
                  {formatCurrency(totalSpent)}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>Remaining</Text>
                <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                  {formatCurrency(Math.max(totalBudget - totalSpent, 0))}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Budget Categories */}
        <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
          Categories
        </Text>

        {budgets.map((budget, index) => {
          const spent = budget.current_spent ?? 0;
          const progress = budget.monthly_limit > 0 ? Math.min(spent / budget.monthly_limit, 1) : 0;
          const overBudget = spent > budget.monthly_limit;

          return (
            <Animated.View key={budget.id} entering={FadeInDown.delay(200 + index * 50)}>
              <Card style={{ marginBottom: spacing.md }} onPress={() => openEdit(budget)}>
                <View style={styles.budgetHeader}>
                  <Text style={[typography.bodyBold, { color: colors.text.primary, textTransform: 'capitalize' }]}>
                    {budget.category.replace('_', ' ')}
                  </Text>
                  <Text style={[typography.monoBody, { color: overBudget ? colors.accent.danger : colors.text.secondary }]}>
                    {formatCurrency(spent)} / {formatCurrency(budget.monthly_limit)}
                  </Text>
                </View>
                <ProgressBar
                  progress={progress}
                  color={overBudget ? colors.accent.danger : undefined}
                  style={{ marginTop: spacing.sm }}
                />
                {overBudget && (
                  <Text style={[typography.tiny, { color: colors.accent.danger, marginTop: spacing.xs }]}>
                    Over budget by <Text style={typography.monoBody}>{formatCurrency(spent - budget.monthly_limit)}</Text>
                  </Text>
                )}
              </Card>
            </Animated.View>
          );
        })}

        {budgets.length === 0 && (
          <EmptyState
            ionIcon="pie-chart-outline"
            title="No budgets yet"
            subtitle="No budgets set for this month. Create one to start tracking your spending!"
            actionLabel="Add Budget"
            onAction={() => { resetForm(); setShowAddModal(true); }}
          />
        )}

        <Button
          title="Add Budget Category"
          onPress={() => { resetForm(); setShowAddModal(true); }}
          variant="outline"
          fullWidth
          style={{ marginTop: spacing.lg }}
        />

        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal
        visible={showAddModal}
        onDismiss={() => { setShowAddModal(false); resetForm(); }}
        title={editingBudget ? 'Edit Budget' : 'Add Budget'}
      >
        <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
          Category
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {BUDGET_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
              selected={formCategory === cat}
              onPress={() => setFormCategory(cat)}
            />
          ))}
        </ScrollView>

        <Input
          label="Monthly Limit ($)"
          value={formLimit}
          onChangeText={setFormLimit}
          placeholder="500"
          keyboardType="decimal-pad"
          containerStyle={{ marginTop: spacing.lg }}
        />

        <Button
          title={editingBudget ? 'Update Budget' : 'Create Budget'}
          onPress={handleSave}
          fullWidth
          disabled={!formLimit.trim()}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
