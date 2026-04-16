// =============================================================================
// TRANSFORMR -- Nutrition Analytics
// =============================================================================

import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import { Skeleton } from '@components/ui/Skeleton';
import { useProfileStore } from '@stores/profileStore';
import { formatPercentage } from '@utils/formatters';
import { supabase } from '../../../services/supabase';
import { MACRO_COLORS, DEFAULT_WATER_TARGET_OZ } from '@utils/constants';
import { hapticLight } from '@utils/haptics';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';

type TimeRange = '7d' | '14d' | '30d' | '90d';

interface DailySnapshot {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water_oz: number;
}

interface TopFood {
  name: string;
  timesLogged: number;
  avgCalories: number;
}

interface MealDistribution {
  mealType: string;
  percentage: number;
  avgCalories: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

function MiniBarChart({
  data,
  maxValue,
  color,
  targetValue,
  height = 80,
}: {
  data: number[];
  maxValue: number;
  color: string;
  targetValue?: number;
  height?: number;
}) {
  const { colors, borderRadius } = useTheme();
  const barWidth = Math.max(2, (SCREEN_WIDTH - 80) / data.length - 2);

  return (
    <View style={[miniBarStyles.container, { height }]}>
      {targetValue !== undefined && (
        <View
          style={[
            miniBarStyles.targetLine,
            {
              bottom: (targetValue / maxValue) * height,
              borderColor: colors.text.muted,
            },
          ]}
        />
      )}
      <View style={miniBarStyles.barsRow}>
        {data.map((value, i) => {
          const barHeight = Math.max(2, (value / maxValue) * height);
          return (
            <View
              key={i}
              style={{
                width: barWidth,
                height: barHeight,
                backgroundColor: color,
                borderRadius: borderRadius.sm,
                opacity: 0.8,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const miniBarStyles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'flex-end',
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
});

export default function NutritionAnalyticsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const navigation = useNavigation();
  const { profile } = useProfileStore();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.analyticsScreen} />,
    });
  }, [navigation]);

  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailySnapshot[]>([]);
  const [mealTypeCounts, setMealTypeCounts] = useState<Record<string, { count: number; totalCalories: number }>>({});

  const targets = useMemo(() => ({
    calories: profile?.daily_calorie_target ?? 2200,
    protein: profile?.daily_protein_target ?? 180,
    carbs: profile?.daily_carb_target ?? 250,
    fat: profile?.daily_fat_target ?? 70,
    water: profile?.daily_water_target_oz ?? DEFAULT_WATER_TARGET_OZ,
  }), [profile]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : timeRange === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);

        const { data: logs } = await supabase
          .from('nutrition_logs')
          .select('logged_at, calories, protein, carbs, fat, meal_type, food_id')
          .eq('user_id', user.id)
          .gte('logged_at', startDate.toISOString())
          .order('logged_at');

        // Build daily snapshots from the range — fill gaps with 0
        const logMap = new Map<string, DailySnapshot>();
        const mealTypeMap: Record<string, { count: number; totalCalories: number }> = {};

        for (const log of (logs ?? []) as { logged_at: string; calories: number; protein: number; carbs: number; fat: number; meal_type?: string }[]) {
          const dateStr = (log.logged_at ?? '').split('T')[0] ?? '';
          if (!dateStr) continue;
          const existing = logMap.get(dateStr) ?? { date: dateStr, calories: 0, protein: 0, carbs: 0, fat: 0, water_oz: 0 };
          logMap.set(dateStr, {
            date: dateStr,
            calories: existing.calories + (log.calories ?? 0),
            protein: existing.protein + (log.protein ?? 0),
            carbs: existing.carbs + (log.carbs ?? 0),
            fat: existing.fat + (log.fat ?? 0),
            water_oz: 0,
          });

          if (log.meal_type) {
            const mt = mealTypeMap[log.meal_type] ?? { count: 0, totalCalories: 0 };
            mealTypeMap[log.meal_type] = { count: mt.count + 1, totalCalories: mt.totalCalories + (log.calories ?? 0) };
          }
        }

        setMealTypeCounts(mealTypeMap);

        const snapshots: DailySnapshot[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0] ?? '';
          snapshots.push(logMap.get(dateStr) ?? { date: dateStr, calories: 0, protein: 0, carbs: 0, fat: 0, water_oz: 0 });
        }

        setDailyData(snapshots);
      } catch (err: unknown) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load nutrition data');
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, [timeRange]);

  const averages = useMemo(() => {
    if (dailyData.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0, water_oz: 0 };
    const sum = dailyData.reduce(
      (acc, d) => ({
        calories: acc.calories + d.calories,
        protein: acc.protein + d.protein,
        carbs: acc.carbs + d.carbs,
        fat: acc.fat + d.fat,
        water_oz: acc.water_oz + d.water_oz,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, water_oz: 0 },
    );
    const len = dailyData.length;
    return {
      calories: Math.round(sum.calories / len),
      protein: Math.round(sum.protein / len),
      carbs: Math.round(sum.carbs / len),
      fat: Math.round(sum.fat / len),
      water_oz: Math.round(sum.water_oz / len),
    };
  }, [dailyData]);

  const adherencePercent = useMemo(() => {
    if (dailyData.length === 0) return 0;
    const onTarget = dailyData.filter(
      (d) =>
        d.calories >= targets.calories * 0.85 &&
        d.calories <= targets.calories * 1.15,
    ).length;
    return onTarget / dailyData.length;
  }, [dailyData, targets.calories]);

  const proteinConsistency = useMemo(() => {
    if (dailyData.length === 0) return 0;
    const daysHitProtein = dailyData.filter(
      (d) => d.protein >= targets.protein * 0.9,
    ).length;
    return daysHitProtein / dailyData.length;
  }, [dailyData, targets.protein]);

  const calorieTrend = useMemo(() => dailyData.map((d) => d.calories), [dailyData]);
  const proteinTrend = useMemo(() => dailyData.map((d) => d.protein), [dailyData]);
  const maxCalories = useMemo(() => Math.max(...calorieTrend, targets.calories), [calorieTrend, targets.calories]);
  const maxProtein = useMemo(() => Math.max(...proteinTrend, targets.protein), [proteinTrend, targets.protein]);

  // Top foods — placeholder since food names require a join; shown as empty when no data
  const topFoods: TopFood[] = useMemo(() => [], []);

  // Meal distribution derived from real logged meal_type data
  const mealDistribution: MealDistribution[] = useMemo(() => {
    const total = Object.values(mealTypeCounts).reduce((sum, v) => sum + v.count, 0);
    if (total === 0) return [];
    return Object.entries(mealTypeCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([mealType, { count, totalCalories }]) => ({
        mealType: mealType.charAt(0).toUpperCase() + mealType.slice(1),
        percentage: Math.round((count / total) * 100),
        avgCalories: count > 0 ? Math.round(totalCalories / count) : 0,
      }));
  }, [mealTypeCounts]);


  // Weekly comparison
  const weeklyComparison = useMemo(() => {
    if (dailyData.length < 14) return null;
    const thisWeek = dailyData.slice(-7);
    const lastWeek = dailyData.slice(-14, -7);

    const avg = (arr: DailySnapshot[], key: keyof Omit<DailySnapshot, 'date'>) =>
      Math.round(arr.reduce((sum, d) => sum + d[key], 0) / arr.length);

    return {
      thisWeek: { calories: avg(thisWeek, 'calories'), protein: avg(thisWeek, 'protein') },
      lastWeek: { calories: avg(lastWeek, 'calories'), protein: avg(lastWeek, 'protein') },
      calorieDiff: avg(thisWeek, 'calories') - avg(lastWeek, 'calories'),
      proteinDiff: avg(thisWeek, 'protein') - avg(lastWeek, 'protein'),
    };
  }, [dailyData]);

  const TIME_RANGES: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7D' },
    { value: '14d', label: '14D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={[styles.loadingState, { gap: spacing.lg }]}>
            <Skeleton variant="card" height={160} />
            <Skeleton variant="card" height={140} />
            <Skeleton variant="card" height={100} />
          </View>
        ) : (
          <>
            {loadError && (
              <Card style={{ marginBottom: spacing.md, borderWidth: 1, borderColor: colors.accent.danger }}>
                <Text style={[typography.body, { color: colors.accent.danger }]}>{loadError}</Text>
              </Card>
            )}
            <AIInsightCard screenKey="nutrition/analytics" style={{ marginBottom: spacing.md }} />

            {/* Time Range */}
            <View style={[styles.rangeRow, { marginBottom: spacing.lg, gap: spacing.sm }]}>
              {TIME_RANGES.map((range) => (
                <Pressable
                  key={range.value}
                  accessibilityLabel={`Show ${range.label} time range`}
                  accessibilityRole="button"
                  onPress={() => { hapticLight(); setTimeRange(range.value); }}
                  style={[
                    styles.rangeChip,
                    {
                      backgroundColor: timeRange === range.value ? colors.accent.primary : colors.background.secondary,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.captionBold,
                      { color: timeRange === range.value ? '#FFFFFF' : colors.text.secondary },
                    ]}
                  >
                    {range.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Average vs Target */}
            <Animated.View entering={FadeInDown.duration(300)}>
              <Card style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                  Average vs Target
                </Text>
                <View style={styles.avgGrid}>
                  <View style={styles.avgItem}>
                    <ProgressRing
                      progress={Math.min(1, averages.calories / targets.calories)}
                      size={72}
                      strokeWidth={6}
                      color={
                        Math.abs(averages.calories - targets.calories) < targets.calories * 0.1
                          ? colors.accent.success
                          : colors.accent.warning
                      }
                    >
                      <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                        {Math.round(averages.calories)}
                      </Text>
                    </ProgressRing>
                    <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 4 }]}>
                      Calories
                    </Text>
                    <Text style={[typography.monoCaption, { color: colors.text.muted, fontSize: 10 }]}>
                      / {targets.calories}
                    </Text>
                  </View>
                  <View style={styles.avgItem}>
                    <ProgressRing
                      progress={Math.min(1, averages.protein / targets.protein)}
                      size={72}
                      strokeWidth={6}
                      color={MACRO_COLORS.protein}
                    >
                      <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                        {averages.protein}g
                      </Text>
                    </ProgressRing>
                    <Text style={[typography.tiny, { color: MACRO_COLORS.protein, marginTop: 4 }]}>
                      Protein
                    </Text>
                    <Text style={[typography.monoCaption, { color: colors.text.muted, fontSize: 10 }]}>
                      / {targets.protein}g
                    </Text>
                  </View>
                  <View style={styles.avgItem}>
                    <ProgressRing
                      progress={Math.min(1, averages.carbs / targets.carbs)}
                      size={72}
                      strokeWidth={6}
                      color={MACRO_COLORS.carbs}
                    >
                      <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                        {averages.carbs}g
                      </Text>
                    </ProgressRing>
                    <Text style={[typography.tiny, { color: MACRO_COLORS.carbs, marginTop: 4 }]}>
                      Carbs
                    </Text>
                    <Text style={[typography.monoCaption, { color: colors.text.muted, fontSize: 10 }]}>
                      / {targets.carbs}g
                    </Text>
                  </View>
                  <View style={styles.avgItem}>
                    <ProgressRing
                      progress={Math.min(1, averages.fat / targets.fat)}
                      size={72}
                      strokeWidth={6}
                      color={MACRO_COLORS.fat}
                    >
                      <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                        {averages.fat}g
                      </Text>
                    </ProgressRing>
                    <Text style={[typography.tiny, { color: MACRO_COLORS.fat, marginTop: 4 }]}>
                      Fat
                    </Text>
                    <Text style={[typography.monoCaption, { color: colors.text.muted, fontSize: 10 }]}>
                      / {targets.fat}g
                    </Text>
                  </View>
                </View>
              </Card>
            </Animated.View>

            {/* Calorie Trend Chart */}
            <Animated.View entering={FadeInDown.duration(300).delay(80)}>
              <Card style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                  Calorie Trend
                </Text>
                <MiniBarChart
                  data={calorieTrend}
                  maxValue={maxCalories}
                  color={colors.accent.primary}
                  targetValue={targets.calories}
                  height={100}
                />
                <View style={[styles.legendRow, { marginTop: spacing.sm }]}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.accent.primary }]} />
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>Daily</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDash, { borderColor: colors.text.muted }]} />
                    <Text style={[typography.monoCaption, { color: colors.text.muted, fontSize: 10 }]}>Target ({targets.calories})</Text>
                  </View>
                </View>
              </Card>
            </Animated.View>

            {/* Protein Consistency Score */}
            <Animated.View entering={FadeInDown.duration(300).delay(160)}>
              <Card style={{ marginBottom: spacing.lg }}>
                <View style={styles.consistencyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: colors.text.primary }]}>
                      Protein Consistency
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.muted, marginTop: 4 }]}>
                      Days hitting 90%+ of protein target
                    </Text>
                  </View>
                  <ProgressRing
                    progress={proteinConsistency}
                    size={80}
                    strokeWidth={7}
                    color={proteinConsistency >= 0.8 ? colors.accent.success : proteinConsistency >= 0.5 ? colors.accent.warning : colors.accent.danger}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '600' }]}>
                      {formatPercentage(proteinConsistency * 100)}
                    </Text>
                  </ProgressRing>
                </View>
                <MiniBarChart
                  data={proteinTrend}
                  maxValue={maxProtein}
                  color={MACRO_COLORS.protein}
                  targetValue={targets.protein}
                  height={60}
                />
              </Card>
            </Animated.View>

            {/* Calorie Adherence */}
            <Animated.View entering={FadeInDown.duration(300).delay(240)}>
              <Card style={{ marginBottom: spacing.lg }}>
                <View style={styles.adherenceRow}>
                  <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                    Calorie Adherence
                  </Text>
                  <Badge
                    label={formatPercentage(adherencePercent * 100)}
                    variant={adherencePercent >= 0.7 ? 'success' : adherencePercent >= 0.5 ? 'warning' : 'danger'}
                  />
                </View>
                <View style={[styles.adherenceBar, { marginTop: spacing.sm }]}>
                  <View
                    style={[
                      styles.adherenceTrack,
                      { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.full },
                    ]}
                  >
                    <View
                      style={{
                        height: 8,
                        width: `${Math.min(100, adherencePercent * 100)}%`,
                        backgroundColor: adherencePercent >= 0.7 ? colors.accent.success : colors.accent.warning,
                        borderRadius: borderRadius.full,
                      }}
                    />
                  </View>
                </View>
                <Text style={[typography.tiny, { color: colors.text.muted, marginTop: spacing.xs }]}>
                  Days within +/-15% of calorie target
                </Text>
              </Card>
            </Animated.View>

            {/* Calorie Distribution by Meal */}
            <Animated.View entering={FadeInDown.duration(300).delay(320)}>
              <Card style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                  Calories by Meal Type
                </Text>
                {mealDistribution.map((meal) => {
                  const barColors = [colors.accent.primary, colors.accent.info, colors.accent.success, colors.accent.warning];
                  const colorIndex = mealDistribution.indexOf(meal);

                  return (
                    <View key={meal.mealType} style={[styles.distRow, { marginBottom: spacing.md }]}>
                      <View style={styles.distLabel}>
                        <Text style={[typography.caption, { color: colors.text.primary, width: 80 }]}>
                          {meal.mealType}
                        </Text>
                        <Text style={[typography.monoCaption, { color: colors.text.muted, fontSize: 10 }]}>
                          {meal.avgCalories} cal
                        </Text>
                      </View>
                      <View style={[styles.distBarTrack, { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.full, flex: 1, marginLeft: spacing.md }]}>
                        <View
                          style={{
                            height: 12,
                            width: `${meal.percentage}%`,
                            backgroundColor: barColors[colorIndex] ?? colors.accent.primary,
                            borderRadius: borderRadius.full,
                          }}
                        />
                      </View>
                      <Text style={[typography.monoCaption, { color: colors.text.secondary, width: 40, textAlign: 'right', fontWeight: '600' }]}>
                        {meal.percentage}%
                      </Text>
                    </View>
                  );
                })}
              </Card>
            </Animated.View>

            {/* Most Logged Foods */}
            <Animated.View entering={FadeInDown.duration(300).delay(400)}>
              <Card style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                  Most Logged Foods
                </Text>
                {topFoods.map((food, index) => (
                  <View
                    key={food.name}
                    style={[
                      styles.topFoodRow,
                      {
                        paddingVertical: spacing.sm,
                        borderBottomWidth: index < topFoods.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border.subtle,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.rankBadge,
                        {
                          backgroundColor: index < 3 ? `${colors.accent.primary}20` : colors.background.tertiary,
                          borderRadius: borderRadius.full,
                        },
                      ]}
                    >
                      <Text style={[typography.captionBold, { color: index < 3 ? colors.accent.primary : colors.text.muted }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={[typography.body, { color: colors.text.primary }]}>
                        {food.name}
                      </Text>
                      <Text style={[typography.monoCaption, { color: colors.text.muted, fontSize: 10 }]}>
                        ~{food.avgCalories} cal avg
                      </Text>
                    </View>
                    <Badge label={`${food.timesLogged}x`} size="sm" variant="info" />
                  </View>
                ))}
              </Card>
            </Animated.View>

            {/* Weekly/Monthly Comparison */}
            {weeklyComparison && (
              <Animated.View entering={FadeInDown.duration(300).delay(480)}>
                <Card style={{ marginBottom: spacing.lg }}>
                  <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                    This Week vs Last Week
                  </Text>
                  <View style={styles.comparisonGrid}>
                    <View style={styles.comparisonCol}>
                      <Text style={[typography.tiny, { color: colors.text.muted }]}>Metric</Text>
                      <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.sm }]}>Avg Calories</Text>
                      <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.sm }]}>Avg Protein</Text>
                    </View>
                    <View style={styles.comparisonCol}>
                      <Text style={[typography.tiny, { color: colors.text.muted }]}>Last Week</Text>
                      <Text style={[typography.monoCaption, { color: colors.text.primary, marginTop: spacing.sm, fontWeight: '600' }]}>
                        {weeklyComparison.lastWeek.calories}
                      </Text>
                      <Text style={[typography.monoCaption, { color: colors.text.primary, marginTop: spacing.sm, fontWeight: '600' }]}>
                        {weeklyComparison.lastWeek.protein}g
                      </Text>
                    </View>
                    <View style={styles.comparisonCol}>
                      <Text style={[typography.tiny, { color: colors.text.muted }]}>This Week</Text>
                      <Text style={[typography.monoCaption, { color: colors.text.primary, marginTop: spacing.sm, fontWeight: '600' }]}>
                        {weeklyComparison.thisWeek.calories}
                      </Text>
                      <Text style={[typography.monoCaption, { color: colors.text.primary, marginTop: spacing.sm, fontWeight: '600' }]}>
                        {weeklyComparison.thisWeek.protein}g
                      </Text>
                    </View>
                    <View style={styles.comparisonCol}>
                      <Text style={[typography.tiny, { color: colors.text.muted }]}>Change</Text>
                      <Text
                        style={[
                          typography.monoCaption,
                          {
                            color: weeklyComparison.calorieDiff > 0 ? colors.accent.warning : colors.accent.success,
                            marginTop: spacing.sm,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {weeklyComparison.calorieDiff > 0 ? '+' : ''}{weeklyComparison.calorieDiff}
                      </Text>
                      <Text
                        style={[
                          typography.monoCaption,
                          {
                            color: weeklyComparison.proteinDiff >= 0 ? colors.accent.success : colors.accent.danger,
                            marginTop: spacing.sm,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {weeklyComparison.proteinDiff > 0 ? '+' : ''}{weeklyComparison.proteinDiff}g
                      </Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            )}

            {/* Water Average */}
            <Animated.View entering={FadeInDown.duration(300).delay(560)}>
              <Card>
                <View style={styles.waterRow}>
                  <Ionicons name="water" size={24} color={colors.accent.info} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.monoBody, { color: colors.text.primary, fontWeight: '600' }]}>
                      Avg Water: {averages.water_oz} oz/day
                    </Text>
                    <Text style={[typography.monoCaption, { color: colors.text.muted, fontSize: 10 }]}>
                      Target: {targets.water} oz/day
                    </Text>
                  </View>
                  <ProgressRing
                    progress={Math.min(1, averages.water_oz / targets.water)}
                    size={48}
                    strokeWidth={4}
                    color={colors.accent.info}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 10 }]}>
                      {formatPercentage((averages.water_oz / targets.water) * 100)}
                    </Text>
                  </ProgressRing>
                </View>
              </Card>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  loadingState: { alignItems: 'center', paddingVertical: 60 },
  rangeRow: { flexDirection: 'row', justifyContent: 'center' },
  rangeChip: {},
  avgGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  avgItem: { alignItems: 'center' },
  consistencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  adherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adherenceBar: {},
  adherenceTrack: { height: 8, overflow: 'hidden' },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distLabel: {},
  distBarTrack: { height: 12, overflow: 'hidden' },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDash: {
    width: 12,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  topFoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonCol: {
    alignItems: 'center',
  },
  waterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
