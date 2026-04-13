// =============================================================================
// TRANSFORMR -- Net Worth Tracker Screen
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
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { Sparkline } from '@components/charts/Sparkline';
import { useFinanceStore } from '@stores/financeStore';
import { formatCurrency, formatDate } from '@utils/formatters';

export default function NetWorthScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { accounts, netWorthHistory, isLoading, fetchAccounts } = useFinanceStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAccounts();
    setRefreshing(false);
  }, [fetchAccounts]);

  const latestSnapshot = netWorthHistory[0] ?? null;
  const previousSnapshot = netWorthHistory[1] ?? null;

  const netWorth = latestSnapshot?.net_worth ?? accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const totalAssets = latestSnapshot?.total_assets ?? accounts.filter((a) => (a.balance ?? 0) >= 0).reduce((s, a) => s + (a.balance ?? 0), 0);
  const totalLiabilities = latestSnapshot?.total_liabilities ?? Math.abs(accounts.filter((a) => (a.balance ?? 0) < 0).reduce((s, a) => s + (a.balance ?? 0), 0));

  const netWorthChange = useMemo(() => {
    if (!latestSnapshot || !previousSnapshot) return null;
    const current = latestSnapshot.net_worth ?? 0;
    const previous = previousSnapshot.net_worth ?? 0;
    return current - previous;
  }, [latestSnapshot, previousSnapshot]);

  const chartData = useMemo(
    () => [...netWorthHistory].reverse().map((s) => s.net_worth ?? 0),
    [netWorthHistory],
  );

  const assetAccounts = useMemo(
    () => accounts.filter((a) => (a.balance ?? 0) >= 0).sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0)),
    [accounts],
  );

  const liabilityAccounts = useMemo(
    () => accounts.filter((a) => (a.balance ?? 0) < 0).sort((a, b) => (a.balance ?? 0) - (b.balance ?? 0)),
    [accounts],
  );

  if (isLoading && netWorthHistory.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton variant="card" height={140} />
          <Skeleton variant="card" height={200} />
          <Skeleton variant="card" height={120} />
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
        {/* Net Worth Hero */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated">
            <Text style={[typography.caption, { color: colors.text.secondary }]}>Net Worth</Text>
            <Text style={[typography.stat, { color: netWorth >= 0 ? colors.accent.success : colors.accent.danger }]}>
              {formatCurrency(netWorth)}
            </Text>
            {netWorthChange !== null && (
              <Badge
                label={`${netWorthChange >= 0 ? '+' : ''}${formatCurrency(netWorthChange)} vs last`}
                variant={netWorthChange >= 0 ? 'success' : 'danger'}
                size="sm"
                style={{ marginTop: spacing.sm }}
              />
            )}
          </Card>
        </Animated.View>

        {/* Chart */}
        {chartData.length > 1 && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Net Worth Over Time
            </Text>
            <Card>
              <Sparkline data={chartData} height={160} color="#6366F1" />
            </Card>
          </Animated.View>
        )}

        {/* Asset / Liability Breakdown */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={[styles.breakdownRow, { marginTop: spacing.xl, gap: spacing.md }]}>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>Assets</Text>
              <Text style={[typography.statSmall, { color: colors.accent.success }]}>
                {formatCurrency(totalAssets)}
              </Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>Liabilities</Text>
              <Text style={[typography.statSmall, { color: colors.accent.danger }]}>
                {formatCurrency(totalLiabilities)}
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* Asset Accounts */}
        {assetAccounts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Assets
            </Text>
            {assetAccounts.map((account) => (
              <View
                key={account.id}
                style={[styles.accountRow, {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
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
                <Text style={[typography.monoBody, { color: colors.accent.success }]}>
                  {formatCurrency(account.balance ?? 0)}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Liability Accounts */}
        {liabilityAccounts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Liabilities
            </Text>
            {liabilityAccounts.map((account) => (
              <View
                key={account.id}
                style={[styles.accountRow, {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
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
                <Text style={[typography.monoBody, { color: colors.accent.danger }]}>
                  {formatCurrency(Math.abs(account.balance ?? 0))}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Snapshot History */}
        {netWorthHistory.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Snapshot History
            </Text>
            {netWorthHistory.slice(0, 12).map((snapshot) => (
              <View
                key={snapshot.id}
                style={[styles.snapshotRow, {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }]}
              >
                <Text style={[typography.body, { color: colors.text.primary }]}>
                  {snapshot.snapshot_date ? formatDate(snapshot.snapshot_date) : 'N/A'}
                </Text>
                <Text
                  style={[typography.monoBody, {
                    color: (snapshot.net_worth ?? 0) >= 0 ? colors.accent.success : colors.accent.danger,
                  }]}
                >
                  {formatCurrency(snapshot.net_worth ?? 0)}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  breakdownRow: { flexDirection: 'row' },
  accountRow: { flexDirection: 'row', alignItems: 'center' },
  snapshotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
