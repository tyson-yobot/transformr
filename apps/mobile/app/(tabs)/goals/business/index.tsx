// =============================================================================
// TRANSFORMR -- Business Dashboard
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { RevenueChart } from '@components/charts/RevenueChart';
import { useBusinessStore } from '@stores/businessStore';
import {
  formatCurrency,
  formatNumber,
} from '@utils/formatters';
import { hapticLight } from '@utils/haptics';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { FeatureLockOverlay } from '@components/ui/FeatureLockOverlay';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { HelpIcon } from '@components/ui/HelpIcon';
import { EmptyState } from '@components/ui/EmptyState';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { Coachmark } from '@components/ui/Coachmark';
import { SCREEN_HELP } from '../../../../constants/screenHelp';
import { HELP } from '../../../../constants/helpContent';
import { COACHMARK_KEYS, COACHMARK_CONTENT } from '../../../../constants/coachmarkSteps';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';

export default function BusinessDashboard() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { isAvailable: hasBusinessTracking } = useFeatureGate('business_tracking');
  const businesses = useBusinessStore((s) => s.businesses);
  const fetchBusinesses = useBusinessStore((s) => s.fetchBusinesses);
  const getMonthlyMetrics = useBusinessStore((s) => s.getMonthlyMetrics);
  const { toast, show: showToast, hide: hideToast } = useActionToast();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedBusinessIndex, setSelectedBusinessIndex] = useState(0);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.businessDashboard} />,
    });
  }, [navigation]);

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

  const coachmarkSteps = useMemo(
    () => COACHMARK_CONTENT.business.map((c) => ({
      targetX: 20,
      targetY: 200,
      targetWidth: 120,
      targetHeight: 40,
      title: c.title,
      body: c.body,
      position: c.position,
    })),
    [],
  );

  if (!hasBusinessTracking) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <FeatureLockOverlay
          featureKey="business_tracking"
          title="Business Tracker"
          description="Monitor revenue, customers, and milestones alongside your training data."
          onGoBack={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <ActionToast
        message={toast.message}
        subtext={toast.subtext}
        visible={toast.visible}
        onHide={hideToast}
        type={toast.type}
      />
      <Coachmark screenKey={COACHMARK_KEYS.business} steps={coachmarkSteps} />
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        <AIInsightCard screenKey="goals/business/index" style={{ marginBottom: spacing.md }} />

        {businesses.length === 0 ? (
          <EmptyState
            ionIcon="trending-up-outline"
            title="Track every dollar"
            subtitle="Add your business to start tracking MRR, ARR, and revenue trends with AI-powered insights."
            actionLabel="Add Revenue Entry"
            onAction={() => { hapticLight(); router.push('/(tabs)/goals/business/revenue'); }}
          />
        ) : (
        <>

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
                            ? colors.text.inverse
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
          <Card variant="elevated" style={styles.revenueCard}>
            <View style={styles.mrrSection}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    MRR
                  </Text>
                  <HelpIcon content={HELP.mrr} size={14} />
                </View>
                <Text style={[typography.stat, styles.revenueNumber]}>
                  {formatCurrency(mrr)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    ARR
                  </Text>
                  <HelpIcon content={HELP.revenueLog} size={14} />
                </View>
                <Text style={[typography.statSmall, styles.revenueNumberSmall]}>
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
            <Card style={[{ flex: 1 }, styles.metricCard]}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
                Customers
              </Text>
              <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                {formatNumber(customerCount)}
              </Text>
            </Card>
            <Card style={[{ flex: 1 }, styles.metricCard]}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
                This Month
              </Text>
              <Text style={[typography.statSmall, styles.revenueNumberSmall]}>
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
            <Card style={styles.chartCard}>
              <RevenueChart data={chartData} />
            </Card>
          </Animated.View>
        )}

        {/* Navigation Buttons */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Button
              title="Log Revenue"
              onPress={() => {
                hapticLight();
                showToast('Revenue logged', { subtext: `+${formatCurrency(mrr > 0 ? mrr : 0)}` });
                router.push('/(tabs)/goals/business/revenue');
              }}
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
        </>
        )}
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
  // Gold revenue number styling — brand color for financial figures
  revenueNumber: {
    color: '#EAB308',
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  revenueNumberSmall: {
    color: '#EAB308',
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  // Purple glow shadow on the primary revenue card
  revenueCard: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  // Purple glow shadow on metric tiles
  metricCard: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  // Purple glow shadow on the revenue chart card
  chartCard: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
});
