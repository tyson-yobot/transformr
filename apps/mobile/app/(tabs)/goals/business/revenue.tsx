// =============================================================================
// TRANSFORMR -- Revenue Logging
// =============================================================================

import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Chip } from '@components/ui/Chip';
import { useBusinessStore } from '@stores/businessStore';
import { formatCurrency, formatCurrencyDetailed, formatDate } from '@utils/formatters';
import { hapticSuccess } from '@utils/haptics';
import type { RevenueLog } from '@app-types/database';

type RevenueType = NonNullable<RevenueLog['type']>;

const REVENUE_TYPES: { key: RevenueType; label: string }[] = [
  { key: 'subscription', label: 'Subscription' },
  { key: 'one_time', label: 'One-Time' },
  { key: 'consulting', label: 'Consulting' },
  { key: 'affiliate', label: 'Affiliate' },
  { key: 'other', label: 'Other' },
];

export default function RevenueScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { businesses, revenueData, isLoading, logRevenue, getMonthlyMetrics } =
    useBusinessStore();

  const [amount, setAmount] = useState('');
  const [revenueType, setRevenueType] = useState<RevenueType>('subscription');
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().substring(0, 10),
  );

  const selectedBusiness = businesses[0] ?? null;

  const handleLogRevenue = useCallback(async () => {
    if (!amount.trim() || !selectedBusiness) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    await logRevenue({
      business_id: selectedBusiness.id,
      amount: parsed,
      type: revenueType,
      customer_name: customerName.trim() || undefined,
      description: description.trim() || undefined,
      transaction_date: transactionDate,
    });
    await hapticSuccess();
    setAmount('');
    setCustomerName('');
    setDescription('');
  }, [amount, revenueType, customerName, description, transactionDate, selectedBusiness, logRevenue]);

  const monthlyMetrics = useMemo(() => getMonthlyMetrics(), [getMonthlyMetrics]);

  const currentMonthTotal = monthlyMetrics[0]?.total_revenue ?? 0;

  const recentRevenue = useMemo(
    () => revenueData.slice(0, 20),
    [revenueData],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Monthly Total */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated">
            <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
              This Month
            </Text>
            <Text style={[typography.stat, { color: colors.accent.success }]}>
              {formatCurrency(currentMonthTotal)}
            </Text>
          </Card>
        </Animated.View>

        {/* Log Form */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md },
            ]}
          >
            Log Revenue
          </Text>
          <Card>
            <Input
              label="Amount ($)"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <Text
              style={[
                typography.captionBold,
                { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
              ]}
            >
              Revenue Type
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {REVENUE_TYPES.map((rt) => (
                <Chip
                  key={rt.key}
                  label={rt.label}
                  selected={revenueType === rt.key}
                  onPress={() => setRevenueType(rt.key)}
                />
              ))}
            </ScrollView>

            <Input
              label="Customer Name (optional)"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer name"
              containerStyle={{ marginTop: spacing.md }}
            />
            <Input
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              containerStyle={{ marginTop: spacing.md }}
            />
            <Input
              label="Date"
              value={transactionDate}
              onChangeText={setTransactionDate}
              placeholder="YYYY-MM-DD"
              containerStyle={{ marginTop: spacing.md }}
            />

            <Button
              title="Log Revenue"
              onPress={handleLogRevenue}
              fullWidth
              loading={isLoading}
              disabled={!amount.trim()}
              style={{ marginTop: spacing.xl }}
            />
          </Card>
        </Animated.View>

        {/* Recent Revenue Log */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md },
            ]}
          >
            Recent Revenue
          </Text>
          {recentRevenue.map((entry, index) => (
            <Animated.View key={entry.id} entering={FadeInDown.delay(350 + index * 30)}>
              <View
                style={[
                  styles.logItem,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.monoBody, { color: colors.text.primary }]}>
                    {formatCurrencyDetailed(entry.amount)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    {entry.customer_name ?? entry.description ?? entry.type ?? 'Revenue'}
                    {' \u2022 '}{formatDate(entry.transaction_date)}
                  </Text>
                </View>
                {entry.type && (
                  <Badge
                    label={entry.type.replace('_', ' ')}
                    size="sm"
                  />
                )}
              </View>
            </Animated.View>
          ))}

          {recentRevenue.length === 0 && (
            <Card>
              <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
                No revenue logged yet.
              </Text>
            </Card>
          )}
        </Animated.View>

        {/* Monthly Totals */}
        {monthlyMetrics.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md },
              ]}
            >
              Monthly Totals
            </Text>
            {monthlyMetrics.slice(0, 6).map((metric) => (
              <View
                key={metric.month}
                style={[
                  styles.monthRow,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                  {metric.month}
                </Text>
                <Text style={[typography.monoBody, { color: colors.accent.success }]}>
                  {formatCurrency(metric.total_revenue)}
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
  logItem: { flexDirection: 'row', alignItems: 'center' },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
