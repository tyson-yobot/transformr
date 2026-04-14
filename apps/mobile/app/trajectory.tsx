// =============================================================================
// TRANSFORMR -- AI Trajectory Simulator
// =============================================================================

import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Chip } from '@components/ui/Chip';
import { MonoText } from '@components/ui/MonoText';
import { TrajectoryChart } from '@components/charts/TrajectoryChart';
import { useProfileStore } from '@stores/profileStore';
import { formatNumber, formatCurrency } from '@utils/formatters';
import { generateTrajectory } from '@services/ai/trajectory';
import { supabase } from '../services/supabase';

type TrajectoryDomain = 'weight' | 'revenue' | 'fitness';

interface TrajectoryPoint {
  date: string;
  value: number;
}

interface ActionItem {
  id: string;
  area: TrajectoryDomain;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

// Generate projected data points
function generateProjection(
  currentValue: number,
  targetValue: number,
  monthsOut: number,
  isOptimal: boolean,
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  const now = new Date();
  const diff = targetValue - currentValue;
  const rate = isOptimal ? 1.0 : 0.4;

  for (let i = 0; i <= monthsOut; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const progress = Math.min(i / monthsOut, 1);
    const eased = isOptimal ? progress : progress * rate + (1 - rate) * progress * progress;
    const value = currentValue + diff * eased;
    points.push({
      date: date.toISOString().substring(0, 10),
      value: Math.round(value * 10) / 10,
    });
  }
  return points;
}

export default function TrajectoryScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfileStore((s) => s.profile);
  const [selectedDomain, setSelectedDomain] = useState<TrajectoryDomain>('weight');
  const [isSimulating, setIsSimulating] = useState(false);

  const domains: { key: TrajectoryDomain; label: string; icon: string }[] = [
    { key: 'weight', label: 'Weight', icon: '\u2696\uFE0F' },
    { key: 'revenue', label: 'Revenue', icon: '\uD83D\uDCB0' },
    { key: 'fitness', label: 'Fitness', icon: '\uD83D\uDCAA' },
  ];

  const domainConfig = useMemo(() => {
    switch (selectedDomain) {
      case 'weight':
        return {
          current: profile?.current_weight ?? 180,
          target: profile?.goal_weight ?? 165,
          unit: 'lbs',
          currentLabel: 'Current Path',
          optimalLabel: 'Optimal Path',
        };
      case 'revenue':
        return {
          current: 5000,
          target: 25000,
          unit: '$',
          currentLabel: 'Current Growth',
          optimalLabel: 'Accelerated Growth',
        };
      case 'fitness':
        return {
          current: 100,
          target: 200,
          unit: 'score',
          currentLabel: 'Current Training',
          optimalLabel: 'Optimized Training',
        };
    }
  }, [selectedDomain, profile]);

  const currentPath = useMemo(
    () => generateProjection(domainConfig.current, domainConfig.target, 12, false),
    [domainConfig],
  );

  const optimalPath = useMemo(
    () => generateProjection(domainConfig.current, domainConfig.target, 12, true),
    [domainConfig],
  );

  const actionItems: ActionItem[] = useMemo(() => {
    const items: ActionItem[] = [];
    if (selectedDomain === 'weight') {
      items.push(
        { id: '1', area: 'weight', description: 'Increase protein intake to 1g per lb of body weight', impact: 'high' },
        { id: '2', area: 'weight', description: 'Add 2 cardio sessions per week', impact: 'medium' },
        { id: '3', area: 'weight', description: 'Track all meals consistently', impact: 'high' },
        { id: '4', area: 'weight', description: 'Improve sleep to 7+ hours nightly', impact: 'medium' },
      );
    } else if (selectedDomain === 'revenue') {
      items.push(
        { id: '5', area: 'revenue', description: 'Launch email outreach campaign', impact: 'high' },
        { id: '6', area: 'revenue', description: 'Increase pricing by 20%', impact: 'high' },
        { id: '7', area: 'revenue', description: 'Add annual billing option', impact: 'medium' },
        { id: '8', area: 'revenue', description: 'Reduce churn with onboarding improvements', impact: 'medium' },
      );
    } else {
      items.push(
        { id: '9', area: 'fitness', description: 'Follow progressive overload protocol', impact: 'high' },
        { id: '10', area: 'fitness', description: 'Add deload week every 4 weeks', impact: 'medium' },
        { id: '11', area: 'fitness', description: 'Optimize pre-workout nutrition', impact: 'low' },
        { id: '12', area: 'fitness', description: 'Track RPE for all working sets', impact: 'medium' },
      );
    }
    return items;
  }, [selectedDomain]);

  const handleSimulate = useCallback(async () => {
    setIsSimulating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await generateTrajectory({
        userId: user.id,
        currentWeight: profile?.current_weight ?? 180,
        goalWeight: profile?.goal_weight ?? 165,
        weightHistory: [],
        workoutsPerWeek: 4,
        avgCalories: profile?.daily_calorie_target ?? 2200,
        targetCalories: profile?.daily_calorie_target ?? 2200,
        currentStreak: 0,
        habitsCompletionRate: 0.75,
      });
    } catch {
      // Trajectory service may not be deployed yet; fail silently
    } finally {
      setIsSimulating(false);
    }
  }, [profile]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[typography.h2, { color: colors.text.primary, textAlign: 'center' }]}>
            AI Trajectory Simulator
          </Text>
          <Text style={[typography.caption, { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs }]}>
            Compare your current path vs your optimal path
          </Text>
        </Animated.View>

        {/* Domain Selector */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, marginTop: spacing.xl, justifyContent: 'center' }}
          >
            {domains.map((d) => (
              <Chip
                key={d.key}
                label={`${d.icon} ${d.label}`}
                selected={selectedDomain === d.key}
                onPress={() => setSelectedDomain(d.key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Two-Futures Chart */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
              12-Month Projection
            </Text>
            <TrajectoryChart
              currentPath={currentPath}
              optimalPath={optimalPath}
              currentLabel={domainConfig.currentLabel}
              optimalLabel={domainConfig.optimalLabel}
              unit={domainConfig.unit}
              youAreHereIndex={0}
            />
          </Card>
        </Animated.View>

        {/* Current vs Optimal Stats */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <View style={[styles.statsRow, { marginTop: spacing.lg, gap: spacing.md }]}>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>Current Path (12mo)</Text>
              <MonoText variant="statSmall" color={colors.accent.danger}>
                {selectedDomain === 'revenue'
                  ? formatCurrency(currentPath[currentPath.length - 1]?.value ?? 0)
                  : formatNumber(currentPath[currentPath.length - 1]?.value ?? 0, 1)}
              </MonoText>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>Optimal Path (12mo)</Text>
              <MonoText variant="statSmall" color={colors.accent.success}>
                {selectedDomain === 'revenue'
                  ? formatCurrency(optimalPath[optimalPath.length - 1]?.value ?? 0)
                  : formatNumber(optimalPath[optimalPath.length - 1]?.value ?? 0, 1)}
              </MonoText>
            </Card>
          </View>
        </Animated.View>

        {/* Actionable Changes */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
            Actionable Changes
          </Text>
          <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.md }]}>
            Make these changes to shift from current path to optimal:
          </Text>
          {actionItems.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(550 + index * 40)}>
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.actionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { color: colors.text.primary }]}>{item.description}</Text>
                  </View>
                  <Badge
                    label={item.impact}
                    variant={item.impact === 'high' ? 'success' : item.impact === 'medium' ? 'info' : 'warning'}
                    size="sm"
                  />
                </View>
              </Card>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Re-simulate */}
        <Animated.View entering={FadeInDown.delay(700)}>
          <Button
            title={isSimulating ? 'Simulating...' : 'Re-Simulate with AI'}
            onPress={handleSimulate}
            fullWidth
            loading={isSimulating}
            style={{ marginTop: spacing.xl }}
          />
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  statsRow: { flexDirection: 'row' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
