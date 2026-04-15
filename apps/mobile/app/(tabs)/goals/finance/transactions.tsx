// =============================================================================
// TRANSFORMR -- Transactions Screen
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Chip } from '@components/ui/Chip';
import { Modal } from '@components/ui/Modal';
import { Skeleton } from '@components/ui/Skeleton';
import { useFinanceStore } from '@stores/financeStore';
import { formatCurrencyDetailed, formatDate } from '@utils/formatters';
import { hapticSuccess } from '@utils/haptics';
import type { FinanceTransaction } from '@app-types/database';

type TxCategory = NonNullable<FinanceTransaction['category']>;

const CATEGORY_OPTIONS: { key: TxCategory; label: string }[] = [
  { key: 'income', label: 'Income' },
  { key: 'food', label: 'Food' },
  { key: 'housing', label: 'Housing' },
  { key: 'transportation', label: 'Transport' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'health', label: 'Health' },
  { key: 'education', label: 'Education' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'savings', label: 'Savings' },
  { key: 'investment', label: 'Investment' },
  { key: 'business_income', label: 'Business' },
  { key: 'other', label: 'Other' },
];

export default function TransactionsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { accounts, transactions, isLoading, fetchAccounts, logTransaction } =
    useFinanceStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<TxCategory | 'all'>('all');
  const [filterAccountId, setFilterAccountId] = useState<string | 'all'>('all');

  // Form state
  const [amount, setAmount] = useState('');
  const [isExpense, setIsExpense] = useState(true);
  const [category, setCategory] = useState<TxCategory>('other');
  const [description, setDescription] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().substring(0, 10));

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    const firstAccount = accounts[0];
    if (firstAccount && !selectedAccountId) {
      setSelectedAccountId(firstAccount.id);
    }
  }, [accounts, selectedAccountId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAccounts();
    setRefreshing(false);
  }, [fetchAccounts]);

  const handleAddTransaction = useCallback(async () => {
    if (!amount.trim() || !selectedAccountId) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    await logTransaction({
      account_id: selectedAccountId,
      amount: isExpense ? -parsed : parsed,
      category,
      description: description.trim() || undefined,
      transaction_date: txDate,
    });
    await hapticSuccess();
    setShowAddModal(false);
    setAmount('');
    setDescription('');
  }, [amount, isExpense, category, description, selectedAccountId, txDate, logTransaction]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (filterCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === filterCategory);
    }
    if (filterAccountId !== 'all') {
      filtered = filtered.filter((t) => t.account_id === filterAccountId);
    }
    return filtered;
  }, [transactions, filterCategory, filterAccountId]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, FinanceTransaction[]>();
    for (const tx of filteredTransactions) {
      const dateKey = tx.transaction_date?.substring(0, 10) ?? 'unknown';
      const existing = groups.get(dateKey) ?? [];
      existing.push(tx);
      groups.set(dateKey, existing);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  if (isLoading && transactions.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton variant="card" height={60} />
          <Skeleton variant="card" height={60} />
          <Skeleton variant="card" height={60} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />
        }
      >
        {/* Filters */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.md }}
          >
            <Chip label="All" selected={filterCategory === 'all'} onPress={() => setFilterCategory('all')} />
            {CATEGORY_OPTIONS.map((cat) => (
              <Chip
                key={cat.key}
                label={cat.label}
                selected={filterCategory === cat.key}
                onPress={() => setFilterCategory(filterCategory === cat.key ? 'all' : cat.key)}
              />
            ))}
          </ScrollView>

          {accounts.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.lg }}
            >
              <Chip label="All Accounts" selected={filterAccountId === 'all'} onPress={() => setFilterAccountId('all')} />
              {accounts.map((acc) => (
                <Chip
                  key={acc.id}
                  label={acc.name}
                  selected={filterAccountId === acc.id}
                  onPress={() => setFilterAccountId(filterAccountId === acc.id ? 'all' : acc.id)}
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Grouped Transactions */}
        {groupedTransactions.map(([dateKey, txs], groupIdx) => (
          <Animated.View key={dateKey} entering={FadeInDown.delay(150 + groupIdx * 50)}>
            <Text style={[typography.captionBold, { color: colors.text.muted, marginTop: spacing.md, marginBottom: spacing.sm }]}>
              {formatDate(dateKey)}
            </Text>
            {txs.map((tx) => (
              <View
                key={tx.id}
                style={[styles.txRow, {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.text.primary }]} numberOfLines={1}>
                    {tx.description ?? 'Transaction'}
                  </Text>
                  {tx.category && (
                    <Text style={[typography.tiny, { color: colors.text.muted, textTransform: 'capitalize' }]}>
                      {tx.category.replace('_', ' ')}
                    </Text>
                  )}
                </View>
                <Text
                  style={[typography.monoBody, {
                    color: tx.amount >= 0 ? colors.accent.success : colors.accent.danger,
                  }]}
                >
                  {tx.amount >= 0 ? '+' : ''}{formatCurrencyDetailed(tx.amount)}
                </Text>
              </View>
            ))}
          </Animated.View>
        ))}

        {filteredTransactions.length === 0 && (
          <Card>
            <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
              No transactions found.
            </Text>
          </Card>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fab, { backgroundColor: colors.accent.primary, borderRadius: 28, shadowColor: colors.accent.primary }]}>
        <Button title="+ Add" onPress={() => setShowAddModal(true)} accessibilityLabel="Add new transaction" />
      </View>

      {/* Add Transaction Modal */}
      <Modal visible={showAddModal} onDismiss={() => setShowAddModal(false)} title="Add Transaction">
        <View style={[styles.toggleRow, { gap: spacing.sm, marginBottom: spacing.md }]}>
          <Chip label="Expense" selected={isExpense} onPress={() => setIsExpense(true)} />
          <Chip label="Income" selected={!isExpense} onPress={() => setIsExpense(false)} />
        </View>

        <Input label="Amount ($)" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />

        <Text style={[typography.captionBold, { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          Category
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {CATEGORY_OPTIONS.map((cat) => (
            <Chip key={cat.key} label={cat.label} selected={category === cat.key} onPress={() => setCategory(cat.key)} />
          ))}
        </ScrollView>

        {accounts.length > 0 && (
          <>
            <Text style={[typography.captionBold, { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
              Account
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {accounts.map((acc) => (
                <Chip key={acc.id} label={acc.name} selected={selectedAccountId === acc.id} onPress={() => setSelectedAccountId(acc.id)} />
              ))}
            </ScrollView>
          </>
        )}

        <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="What was this for?" containerStyle={{ marginTop: spacing.md }} />
        <Input label="Date" value={txDate} onChangeText={setTxDate} placeholder="YYYY-MM-DD" containerStyle={{ marginTop: spacing.md }} />

        <Button
          title="Add Transaction"
          onPress={handleAddTransaction}
          fullWidth
          loading={isLoading}
          disabled={!amount.trim()}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  toggleRow: { flexDirection: 'row' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
});
