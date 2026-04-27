// =============================================================================
// TRANSFORMR — Health ROI Report Screen
//
// Displays computed health ROI metrics and an AI-generated narrative.
// User can switch between 30 / 60 / 90 day windows.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Icon3D } from '@components/ui/Icon3D';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { supabase } from '@services/supabase';
import { computeHealthROIReport, type HealthROIReport } from '@services/ai/healthRoi';
import { hapticLight } from '@utils/haptics';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';

type Window = 30 | 60 | 90;

function MetricRow({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={[styles.metricRow, { marginBottom: spacing.sm }]}>
      <View style={styles.metricLabel}>
        <Text style={[typography.body, { color: colors.text.secondary }]}>{label}</Text>
      </View>
      <View style={styles.metricBar}>
        <View
          style={[
            styles.metricFill,
            { width: `${Math.min(100, value)}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[typography.captionBold, { color: colors.text.primary, minWidth: 52, textAlign: 'right' }]}>
        {value}
        {unit}
      </Text>
    </View>
  );
}

export default function HealthROIScreen() {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const healthRoiGate = useFeatureGate('ai_health_roi');

  const [window, setWindow] = useState<Window>(30);
  const [report, setReport] = useState<HealthROIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async (win: Window) => {
    setError(null);
    if (!healthRoiGate.isAvailable) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    try {
      const result = await computeHealthROIReport(user.id, win);
      setReport(result);
    } catch {
      setError('Unable to generate report. Try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [healthRoiGate.isAvailable]);

  useEffect(() => {
    setLoading(true);
    void loadReport(window);
  }, [window, loadReport]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadReport(window);
  }, [window, loadReport]);

  const handleShare = useCallback(async () => {
    if (!report) return;
    hapticLight();
    const { metrics: m } = report;
    const text = [
      `🏆 My ${window}-Day Health ROI — TRANSFORMR`,
      `Consistency: ${m.consistencyScore}%`,
      `Workouts: ${m.workoutCount} (${m.activeDays} active days)`,
      `Nutrition Adherence: ${m.nutritionAdherence}%`,
      `Sleep Quality: ${m.sleepQuality}/100`,
      `Habit Completion: ${m.habitCompletion}%`,
      '',
      report.aiNarrative,
    ].join('\n');
    await Share.share({ message: text });
  }, [report, window]);

  const WINDOW_OPTIONS: Window[] = [30, 60, 90];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background.primary} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[typography.h2, { color: colors.text.primary, flex: 1, marginLeft: spacing.sm }]}>
          Health ROI
        </Text>
        {report && (
          <Pressable
            onPress={handleShare}
            accessibilityLabel="Share report"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-outline" size={22} color={colors.accent.primary} />
          </Pressable>
        )}
      </View>

      {/* Window selector */}
      <View
        style={[
          styles.windowRow,
          {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            gap: spacing.sm,
          },
        ]}
      >
        {WINDOW_OPTIONS.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => { hapticLight(); setWindow(opt); }}
            style={[
              styles.windowBtn,
              {
                backgroundColor: window === opt ? colors.accent.primary : colors.background.tertiary,
                borderRadius: borderRadius.full,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.md,
              },
            ]}
            accessibilityLabel={`${opt} day window`}
            accessibilityRole="button"
          >
            <Text
              style={[
                typography.captionBold,
                { color: window === opt ? '#FFFFFF' : colors.text.secondary },
              ]}
            >
              {opt}d
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card style={{ padding: spacing.lg, alignItems: 'center' }}>
              <Text style={[typography.body, { color: colors.text.secondary }]}>
                Calculating your health ROI…
              </Text>
            </Card>
          </Animated.View>
        )}

        {error && !loading && (
          <Card style={{ padding: spacing.lg, backgroundColor: `${colors.accent.danger}15` }}>
            <Text style={[typography.body, { color: colors.accent.danger }]}>{error}</Text>
            <Button title="Retry" variant="primary" onPress={handleRefresh} style={{ marginTop: spacing.md }} />
          </Card>
        )}

        {report && !loading && (
          <Animated.View entering={FadeInDown.duration(400)}>
            {/* Summary stats */}
            <Card variant="elevated" style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
              <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                {window}-Day Overview
              </Text>
              <View style={[styles.summaryRow, { marginBottom: spacing.md }]}>
                <View style={styles.summaryItem}>
                  <Text style={[typography.stat, { color: colors.accent.primary }]}>
                    {report.metrics.workoutCount}
                  </Text>
                  <Text style={[typography.tiny, { color: colors.text.muted }]}>Workouts</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[typography.stat, { color: colors.accent.success }]}>
                    {report.metrics.activeDays}
                  </Text>
                  <Text style={[typography.tiny, { color: colors.text.muted }]}>Active Days</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[typography.stat, { color: colors.accent.warning }]}>
                    {report.metrics.consistencyScore}%
                  </Text>
                  <Text style={[typography.tiny, { color: colors.text.muted }]}>Consistency</Text>
                </View>
              </View>

              <MetricRow
                label="Nutrition Adherence"
                value={report.metrics.nutritionAdherence}
                unit="%"
                color={colors.accent.success}
              />
              <MetricRow
                label="Sleep Quality"
                value={report.metrics.sleepQuality}
                unit="/100"
                color={colors.accent.primary}
              />
              <MetricRow
                label="Habit Completion"
                value={report.metrics.habitCompletion}
                unit="%"
                color={colors.accent.warning}
              />

              <View
                style={[
                  styles.calorieStat,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderRadius: borderRadius.sm,
                    padding: spacing.sm,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Icon3D name="fire" size={16} />
                <Text style={[typography.captionBold, { color: colors.text.primary, marginLeft: spacing.xs }]}>
                  ~{report.metrics.estimatedCaloriesBurned.toLocaleString()} kcal burned
                </Text>
                <Text style={[typography.caption, { color: colors.text.muted, marginLeft: spacing.xs }]}>
                  in {window} days
                </Text>
              </View>
            </Card>

            {/* AI Narrative */}
            <Card variant="elevated" style={{ padding: spacing.lg }}>
              <View style={[styles.aiHeader, { marginBottom: spacing.md }]}>
                <Icon3D name="sparkles" size={18} />
                <Text style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}>
                  AI Analysis
                </Text>
              </View>
              <Text style={[typography.body, { color: colors.text.secondary, lineHeight: 22 }]}>
                {report.aiNarrative}
              </Text>
            </Card>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  windowRow:   { flexDirection: 'row' },
  windowBtn:   {},
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  metricRow:   { flexDirection: 'row', alignItems: 'center' },
  metricLabel: { width: 130 },
  metricBar:   { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  metricFill:  { height: '100%', borderRadius: 3 },
  calorieStat: { flexDirection: 'row', alignItems: 'center' },
  aiHeader:    { flexDirection: 'row', alignItems: 'center' },
});
