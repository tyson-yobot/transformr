// =============================================================================
// TRANSFORMR -- Monthly Retrospective Letter
// Displays AI-generated retrospective letters reviewing the user's full month
// of data. Supports navigation across past months.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Chip } from '@components/ui/Chip';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { EmptyState } from '@components/ui/EmptyState';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { StatTile } from '@components/ui/StatTile';
import { supabase } from '@services/supabase';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KeyStats {
  workouts: number;
  avg_mood: number;
  habits_completion_rate: number;
  weight_change: number;
  avg_sleep_hours: number;
  total_volume: number;
  prs_set: number;
}

interface MonthlyRetrospective {
  id: string;
  month: string;
  letter: string | null;
  headline: string | null;
  key_stats: KeyStats | null;
  wins: string[] | null;
  growth_areas: string[] | null;
  next_month_focus: string | null;
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrentMonth(): string {
  return new Date().toISOString().substring(0, 7);
}

function buildMonthOptions(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().substring(0, 7));
  }
  return months;
}

function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-');
  const d = new Date(Number(year), Number(monthNum) - 1, 1);
  return d.toLocaleString('default', { month: 'short', year: '2-digit' });
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonCard({ height = 80 }: { height?: number }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        height,
        borderRadius: 12,
        backgroundColor: colors.background.secondary,
        marginBottom: spacing.md,
        opacity: 0.7,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function RetrospectiveScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { toast, show: showToast, hide: hideToast } = useActionToast();

  const retroGate = useFeatureGate('ai_retrospective');

  const monthOptions = buildMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[1] ?? getCurrentMonth());
  const [retro, setRetro] = useState<MonthlyRetrospective | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ScreenHelpButton
          content={{
            title: 'Monthly Retrospective',
            body: 'Monthly retrospectives give you a full AI-written letter reviewing your month — workouts, mood, habits, sleep, and goals. Generate yours at the end of each month.',
          }}
        />
      ),
    });
  }, [navigation]);

  const loadRetro = useCallback(async (month: string) => {
    setIsLoading(true);
    setRetro(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('monthly_retrospectives')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .single();

    setRetro(data as MonthlyRetrospective | null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadRetro(selectedMonth);
  }, [selectedMonth, loadRetro]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRetro(selectedMonth);
    setRefreshing(false);
  }, [selectedMonth, loadRetro]);

  const handleGenerate = useCallback(async () => {
    if (!retroGate.isAvailable) return;
    setIsGenerating(true);
    hapticLight();

    try {
      const { data, error } = await supabase.functions.invoke('ai-monthly-retrospective', {
        body: { month: selectedMonth, type: 'full' },
      });

      if (error) throw error;

      setRetro(data as MonthlyRetrospective);
      hapticSuccess();
      showToast('Letter generated', { subtext: `Your ${formatMonthLabel(selectedMonth)} retrospective is ready` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      showToast(message, { type: 'info' });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedMonth, showToast, retroGate.isAvailable]);

  const keyStats = retro?.key_stats ?? null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ActionToast
        message={toast.message}
        subtext={toast.subtext}
        visible={toast.visible}
        onHide={hideToast}
        type={toast.type}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        <AIInsightCard screenKey="goals/retrospective" style={{ marginBottom: spacing.md }} />

        {/* Month Selector */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text
            style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.sm }]}
          >
            Select Month
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: spacing.lg }}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {monthOptions.map((month) => (
              <Chip
                key={month}
                label={formatMonthLabel(month)}
                selected={selectedMonth === month}
                onPress={() => { hapticLight(); setSelectedMonth(month); }}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Loading Skeleton */}
        {isLoading && (
          <Animated.View entering={FadeInDown.delay(150)}>
            <Text
              style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.md, textAlign: 'center' }]}
            >
              Analyzing your {formatMonthLabel(selectedMonth)} journey...
            </Text>
            <SkeletonCard height={40} />
            <SkeletonCard height={120} />
            <SkeletonCard height={200} />
            <SkeletonCard height={80} />
          </Animated.View>
        )}

        {/* Empty State */}
        {!isLoading && !retro && (
          <Animated.View entering={FadeInDown.delay(150)}>
            <EmptyState
              ionIcon="document-text-outline"
              title={`No retrospective for ${formatMonthLabel(selectedMonth)}`}
              subtitle="Generate your AI-written letter reviewing your full month of data — workouts, mood, habits, sleep, weight, and goals."
              actionLabel="Generate Retrospective Letter"
              onAction={handleGenerate}
            />
          </Animated.View>
        )}

        {/* Headline */}
        {retro?.headline && !isLoading && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <Card
              variant="elevated"
              style={{
                borderLeftWidth: 3,
                borderLeftColor: colors.accent.primary,
                marginBottom: spacing.md,
              }}
            >
              <Badge label={formatMonthLabel(selectedMonth)} variant="info" size="sm" />
              <Text
                style={[typography.h3, { color: colors.text.primary, marginTop: spacing.sm }]}
              >
                {retro.headline}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Key Stats Row */}
        {keyStats && !isLoading && (
          <Animated.View entering={FadeInDown.delay(300)}>
            <Card style={{ marginBottom: spacing.md }}>
              <Text
                style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.sm }]}
              >
                Key Stats
              </Text>
              <View style={styles.statsRow}>
                <StatTile
                  label="Workouts"
                  value={keyStats.workouts}
                  style={{ flex: 1 }}
                />
                <StatTile
                  label="Avg Mood"
                  value={Number(keyStats.avg_mood.toFixed(1))}
                  unit="/10"
                  style={{ flex: 1 }}
                />
                <StatTile
                  label="Habits"
                  value={Math.round(keyStats.habits_completion_rate * 100)}
                  unit="%"
                  style={{ flex: 1 }}
                />
                <StatTile
                  label="Weight"
                  value={Math.abs(keyStats.weight_change)}
                  unit={keyStats.weight_change >= 0 ? '+lbs' : '-lbs'}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Letter */}
        {retro?.letter && !isLoading && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Card style={{ marginBottom: spacing.md }}>
              <View style={[styles.letterHeader, { marginBottom: spacing.md }]}>
                <Ionicons name="mail-outline" size={18} color={colors.accent.primary} />
                <Text
                  style={[typography.bodyBold, { color: colors.accent.primary, marginLeft: spacing.xs }]}
                >
                  Your Monthly Letter
                </Text>
              </View>
              <Text
                style={[
                  typography.body,
                  { color: colors.text.secondary, lineHeight: 24 },
                ]}
              >
                {retro.letter}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Wins */}
        {retro?.wins && retro.wins.length > 0 && !isLoading && (
          <Animated.View entering={FadeInDown.delay(500)}>
            <Card style={{ marginBottom: spacing.md }}>
              <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
                <Ionicons name="trophy-outline" size={18} color={colors.accent.success} />
                <Text
                  style={[typography.bodyBold, { color: colors.accent.success, marginLeft: spacing.xs }]}
                >
                  Wins This Month
                </Text>
              </View>
              {retro.wins.map((win, idx) => (
                <View key={idx} style={[styles.listRow, { marginTop: spacing.xs }]}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.accent.success}
                    style={{ marginRight: spacing.sm, flexShrink: 0 }}
                  />
                  <Text style={[typography.body, { color: colors.text.secondary, flex: 1 }]}>
                    {win}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Growth Areas */}
        {retro?.growth_areas && retro.growth_areas.length > 0 && !isLoading && (
          <Animated.View entering={FadeInDown.delay(600)}>
            <Card style={{ marginBottom: spacing.md }}>
              <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
                <Ionicons name="trending-up-outline" size={18} color={colors.accent.warning} />
                <Text
                  style={[typography.bodyBold, { color: colors.accent.warning, marginLeft: spacing.xs }]}
                >
                  Growth Areas
                </Text>
              </View>
              {retro.growth_areas.map((area, idx) => (
                <View key={idx} style={[styles.listRow, { marginTop: spacing.xs }]}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color={colors.accent.warning}
                    style={{ marginRight: spacing.sm, flexShrink: 0 }}
                  />
                  <Text style={[typography.body, { color: colors.text.secondary, flex: 1 }]}>
                    {area}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Next Month Focus */}
        {retro?.next_month_focus && !isLoading && (
          <Animated.View entering={FadeInDown.delay(700)}>
            <Card
              style={{
                marginBottom: spacing.md,
                borderWidth: 1,
                borderColor: colors.accent.cyan,
              }}
            >
              <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
                <Ionicons name="arrow-forward-circle-outline" size={18} color={colors.accent.cyan} />
                <Text
                  style={[typography.bodyBold, { color: colors.accent.cyan, marginLeft: spacing.xs }]}
                >
                  Next Month's Focus
                </Text>
              </View>
              <Text style={[typography.body, { color: colors.text.secondary }]}>
                {retro.next_month_focus}
              </Text>
              <Pressable
                onPress={() => { hapticLight(); }}
                accessibilityLabel="Set focus as goal"
                style={{ marginTop: spacing.md }}
              >
                <Text style={[typography.bodyBold, { color: colors.accent.primary }]}>
                  Set as goal →
                </Text>
              </Pressable>
            </Card>
          </Animated.View>
        )}

        {/* Generate / Regenerate */}
        {!isLoading && (
          <Animated.View entering={FadeInDown.delay(750)}>
            <Button
              title={retro ? 'Regenerate Letter' : 'Generate Retrospective Letter'}
              onPress={handleGenerate}
              variant={retro ? 'outline' : 'primary'}
              loading={isGenerating}
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </Animated.View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  letterHeader: { flexDirection: 'row', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  listRow: { flexDirection: 'row', alignItems: 'flex-start' },
});
