// =============================================================================
// TRANSFORMR -- Business Dashboard
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressBar } from '@components/ui/ProgressBar';
import { RevenueChart } from '@components/charts/RevenueChart';
import { useBusinessStore } from '@stores/businessStore';
import {
  formatCurrency,
  formatCompactNumber,
  formatNumber,
} from '@utils/formatters';
import { hapticLight } from '@utils/haptics';

export default function BusinessDashboard() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { businesses, revenueData, isLoading, fetchBusinesses, getMonthlyMetrics } =
    useBusinessStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedBusinessIndex, setSelectedBusinessIndex] = useState(0);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBusinesses();
    setRefreshing(false);
  }, [fetchBusinesses]);

  const selectedBusiness = businesses[selectedBusinessIndex] ?? null;

  const monthlyMetrics = useMemo(() => getMonthlyMetrics(), [getMonthlyMetrics]);

  const mrr = selectedBusiness?.monthly_revenue ?? 0;
  const arr = mrr * 12;
  const customerCount = selectedBusiness?.customer_count ?? 0;

  const mrrTrend = useMemo(() => {
    if (monthlyMetrics.length < 2) return 0;
    const current = monthlyMetrics[0]?.total_revenue ?? 0;
    const previous = monthlyMetrics[1]?.total_revenue ?? 0;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }, [monthlyMetrics]);

  const chartData = useMemo(
    () => {
      const reversed = monthlyMetrics.slice(0, 12).reverse();
      let cumulative = 0;
      return reversed.map((m) => {
        cumulative += m.total_revenue;
        return {
          month: m.month,
          revenue: m.total_revenue,
          cumulative,
        };
      });
    },
    [monthlyMetrics],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* Business Selector */}
        {businesses.length > 1 && (
          <Animated.View entering={FadeInDown.delay(50)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.lg }}
            >
              {businesses.map((biz, idx) => (
                <Pressable
                  key={biz.id}
                  onPress={() => { hapticLight(); setSelectedBusinessIndex(idx); }}
                  accessibilityLabel={`Select business ${biz.name}`}
                  style={[
                    styles.bizTab,
                    {
                      backgroundColor:
                        idx === selectedBusinessIndex
                          ? colors.accent.primary
                          : colors.background.secondary,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.captionBold,
                      {
                        color:
                          idx === selectedBusinessIndex
                            ? '#FFFFFF'
                            : colors.text.secondary,
                      },
                    ]}
                  >
                    {biz.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* MRR / ARR */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated">
            <View style={styles.mrrSection}>
              <View>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  MRR
                </Text>
                <Text style={[typography.stat, { color: colors.accent.success }]}>
                  {formatCurrency(mrr)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  ARR
                </Text>
                <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                  {formatCurrency(arr)}
                </Text>
              </View>
            </View>
            {mrrTrend !== 0 && (
              <Badge
                label={`${mrrTrend > 0 ? '+' : ''}${mrrTrend.toFixed(1)}% MoM`}
                variant={mrrTrend > 0 ? 'success' : 'danger'}
                size="sm"
                style={{ marginTop: spacing.sm }}
              />
            )}
          </Card>
        </Animated.View>

        {/* Key Metrics */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={[styles.metricsRow, { marginTop: spacing.lg, gap: spacing.md }]}>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
                Customers
              </Text>
              <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                {formatNumber(customerCount)}
              </Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
                This Month
              </Text>
              <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                {formatCurrency(monthlyMetrics[0]?.total_revenue ?? 0)}
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* Revenue Chart */}
        {chartData.length > 1 && (
          <Animated.View entering={FadeInDown.delay(300)}>
            <Text
              style={[
                typography.h3,
                {
                  color: colors.text.primary,
                  marginTop: spacing.xl,
                  marginBottom: spacing.md,
                },
              ]}
            >
              Revenue Trend
            </Text>
            <Card>
              <RevenueChart data={chartData} />
            </Card>
          </Animated.View>
        )}

        {/* Navigation Buttons */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Button
              title="Log Revenue"
              onPress={() => { hapticLight(); router.push('/(tabs)/goals/business/revenue'); }}
              accessibilityLabel="Log revenue"
              fullWidth
            />
            <Button
              title="Customers"
              onPress={() => { hapticLight(); router.push('/(tabs)/goals/business/customers'); }}
              accessibilityLabel="View customers"
              variant="secondary"
              fullWidth
            />
            <Button
              title="Milestones"
              onPress={() => { hapticLight(); router.push('/(tabs)/goals/business/milestones'); }}
              accessibilityLabel="View milestones"
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
  bizTab: { alignItems: 'center' },
  mrrSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricsRow: { flexDirection: 'row' },
});
