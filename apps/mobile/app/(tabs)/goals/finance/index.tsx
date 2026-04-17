// =============================================================================
// TRANSFORMR -- Personal Finance Dashboard
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../../constants/screenHelp';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { GatePromptCard } from '@components/ui/GatePromptCard';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Skeleton } from '@components/ui/Skeleton';
import { useFinanceStore } from '@stores/financeStore';
import { formatCurrency, formatCurrencyDetailed, formatDate } from '@utils/formatters';
import { hapticLight } from '@utils/haptics';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { EmptyState } from '@components/ui/EmptyState';

export default function FinanceDashboard() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const gate = useFeatureGate('finance_tracking');
  const { accounts, transactions, netWorthHistory, isLoading, error, fetchAccounts } =
    useFinanceStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.financeHome} />,
    });
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAccounts();
    setRefreshing(false);
  }, [fetchAccounts]);

  const netWorth = useMemo(() => {
    if (netWorthHistory.length > 0) return netWorthHistory[0]?.net_worth ?? 0;
    return accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  }, [netWorthHistory, accounts]);

  const totalAssets = useMemo(() => {
    if (netWorthHistory.length > 0) return netWorthHistory[0]?.total_assets ?? 0;
    return accounts
      .filter((a) => (a.balance ?? 0) >= 0)
      .reduce((sum, a) => sum + (a.balance ?? 0), 0);
  }, [netWorthHistory, accounts]);

  const totalLiabilities = useMemo(() => {
    if (netWorthHistory.length > 0) return netWorthHistory[0]?.total_liabilities ?? 0;
    return Math.abs(
      accounts
        .filter((a) => (a.balance ?? 0) < 0)
        .reduce((sum, a) => sum + (a.balance ?? 0), 0),
    );
  }, [netWorthHistory, accounts]);

  const currentMonth = new Date().toISOString().substring(0, 7);

  const monthlyIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.transaction_date?.startsWith(currentMonth) && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions, currentMonth],
  );

  const monthlyExpenses = useMemo(
    () =>
      Math.abs(
        transactions
          .filter((t) => t.transaction_date?.startsWith(currentMonth) && t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0),
      ),
    [transactions, currentMonth],
  );

  const recentTransactions = useMemo(() => transactions.slice(0, 8), [transactions]);

  if (!gate.isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <GatePromptCard featureKey="finance_tracking" height={200} />
      </SafeAreaView>
    );
  }

  if (isLoading && accounts.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={80} />
          <Skeleton variant="card" height={80} />
          <Skeleton variant="card" height={200} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />
        }
      >
        <AIInsightCard screenKey="goals/finance/index" style={{ marginBottom: spacing.md }} />

        {error && (
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={[typography.body, { color: colors.accent.danger, textAlign: 'center' }]}>{error}</Text>
          </Card>
        )}

        {/* Net Worth */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated">
            <Text style={[typography.caption, { color: colors.text.secondary }]}>Net Worth</Text>
            <Text style={[typography.stat, { color: netWorth >= 0 ? colors.accent.success : colors.accent.danger }]}>
              {formatCurrency(netWorth)}
            </Text>
            <View style={[styles.netWorthBreakdown, { marginTop: spacing.md, gap: spacing.xl }]}>
              <View>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>Assets</Text>
                <Text style={[typography.bodyBold, { color: colors.accent.success }]}>
                  {formatCurrency(totalAssets)}
                </Text>
              </View>
              <View>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>Liabilities</Text>
                <Text style={[typography.bodyBold, { color: colors.accent.danger }]}>
                  {formatCurrency(totalLiabilities)}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Monthly Income vs Expenses */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={[styles.metricsRow, { marginTop: spacing.lg, gap: spacing.md }]}>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>Income</Text>
              <Text style={[typography.statSmall, { color: colors.accent.success }]}>
                {formatCurrency(monthlyIncome)}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>This Month</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>Expenses</Text>
              <Text style={[typography.statSmall, { color: colors.accent.danger }]}>
                {formatCurrency(monthlyExpenses)}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>This Month</Text>
            </Card>
          </View>
        </Animated.View>

        {/* Accounts */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
            Accounts
          </Text>
          {accounts.map((account) => (
            <View
              key={account.id}
              style={[styles.accountRow, {
                backgroundColor: colors.background.secondary,
                borderRadius: 12,
                padding: spacing.md,
                marginBottom: spacing.sm,
              }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>{account.name}</Text>
                {account.type && (
                  <Text style={[typography.tiny, { color: colors.text.muted, textTransform: 'capitalize' }]}>
                    {account.type.replace('_', ' ')}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  typography.monoBody,
                  { color: (account.balance ?? 0) >= 0 ? colors.accent.success : colors.accent.danger },
                ]}
              >
                {formatCurrencyDetailed(account.balance ?? 0)}
              </Text>
            </View>
          ))}
          {accounts.length === 0 && (
            <EmptyState
              icon="\uD83C\uDFE6"
              title="No accounts yet"
              subtitle="Connect your accounts to get a clear picture of your financial health in one place."
              style={{ paddingVertical: 24 }}
            />
          )}
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
            Recent Transactions
          </Text>
          {recentTransactions.map((tx) => (
            <View
              key={tx.id}
              style={[styles.txRow, {
                backgroundColor: colors.background.secondary,
                borderRadius: 12,
                padding: spacing.md,
                marginBottom: spacing.sm,
              }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.body, { color: colors.text.primary }]} numberOfLines={1}>
                  {tx.description ?? tx.category ?? 'Transaction'}
                </Text>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>
                  {formatDate(tx.transaction_date)}
                </Text>
              </View>
              <Text
                style={[
                  typography.monoBody,
                  { color: tx.amount >= 0 ? colors.accent.success : colors.accent.danger },
                ]}
              >
                {tx.amount >= 0 ? '+' : ''}{formatCurrencyDetailed(tx.amount)}
              </Text>
            </View>
          ))}
          {recentTransactions.length === 0 && (
            <EmptyState
              icon="\uD83E\uDDFE"
              title="No transactions yet"
              subtitle="Track every purchase and payment to understand where your money goes and where it can grow."
              style={{ paddingVertical: 24 }}
            />
          )}
        </Animated.View>

        {/* Navigation Buttons */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Button
              title="Transactions"
              onPress={() => { hapticLight(); router.push('/(tabs)/goals/finance/transactions'); }}
              accessibilityLabel="View transactions"
              fullWidth
            />
            <Button
              title="Budgets"
              onPress={() => { hapticLight(); router.push('/(tabs)/goals/finance/budgets'); }}
              accessibilityLabel="View budgets"
              variant="secondary"
              fullWidth
            />
            <Button
              title="Net Worth Tracker"
              onPress={() => { hapticLight(); router.push('/(tabs)/goals/finance/net-worth'); }}
              accessibilityLabel="View net worth tracker"
              variant="outline"
              fullWidth
            />
          </View>
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  netWorthBreakdown: { flexDirection: 'row' },
  metricsRow: { flexDirection: 'row' },
  accountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.15)' },
  txRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.15)' },
});
