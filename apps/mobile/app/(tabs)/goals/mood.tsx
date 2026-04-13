// =============================================================================
// TRANSFORMR -- Mood Logger
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
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Chip } from '@components/ui/Chip';
import { Slider } from '@components/ui/Slider';
import { MoodChart } from '@components/charts/MoodChart';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { useMoodStore } from '@stores/moodStore';
import { hapticSuccess, hapticLight } from '@utils/haptics';
import type { MoodLog } from '@app-types/database';

type MoodContext = NonNullable<MoodLog['context']>;

const MOOD_EMOJIS: Record<number, string> = {
  1: '\uD83D\uDE29', 2: '\uD83D\uDE1E', 3: '\uD83D\uDE14',
  4: '\uD83D\uDE15', 5: '\uD83D\uDE10', 6: '\uD83D\uDE42',
  7: '\uD83D\uDE0A', 8: '\uD83D\uDE04', 9: '\uD83D\uDE01',
  10: '\uD83E\uDD29',
};

const CONTEXTS: { key: MoodContext; label: string }[] = [
  { key: 'morning', label: 'Morning' },
  { key: 'midday', label: 'Midday' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'post_workout', label: 'Post Workout' },
  { key: 'post_meal', label: 'Post Meal' },
];

export default function MoodLogger() {
  const { colors, typography, spacing } = useTheme();
  const { todayMood, moodHistory, isLoading, logMood, fetchMoodHistory } =
    useMoodStore();

  const [refreshing, setRefreshing] = useState(false);
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [motivation, setMotivation] = useState(5);
  const [context, setContext] = useState<MoodContext>('morning');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    fetchMoodHistory({
      start: thirtyDaysAgo.toISOString(),
      end: now.toISOString(),
    });
  }, [fetchMoodHistory]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await fetchMoodHistory({
      start: thirtyDaysAgo.toISOString(),
      end: now.toISOString(),
    });
    setRefreshing(false);
  }, [fetchMoodHistory]);

  const handleLog = useCallback(async () => {
    await logMood({ mood, energy, stress, motivation, context, notes: notes || undefined });
    await hapticSuccess();
    setNotes('');
  }, [mood, energy, stress, motivation, context, notes, logMood]);

  const chartData = useMemo(
    () =>
      moodHistory
        .filter((m) => m.logged_at)
        .map((m) => ({
          date: m.logged_at!,
          mood: m.mood ?? 5,
          energy: m.energy ?? 5,
          stress: m.stress ?? 5,
        }))
        .reverse(),
    [moodHistory],
  );

  const correlationInsights = useMemo(() => {
    if (moodHistory.length < 5) return [];
    const insights: string[] = [];

    const highMood = moodHistory.filter((m) => (m.mood ?? 0) >= 7);
    const lowMood = moodHistory.filter((m) => (m.mood ?? 0) <= 4);

    if (highMood.length > 0) {
      const avgEnergy =
        highMood.reduce((s, m) => s + (m.energy ?? 5), 0) / highMood.length;
      if (avgEnergy >= 7) {
        insights.push('High mood days correlate with high energy levels.');
      }
    }

    if (lowMood.length > 0) {
      const avgStress =
        lowMood.reduce((s, m) => s + (m.stress ?? 5), 0) / lowMood.length;
      if (avgStress >= 7) {
        insights.push('Low mood tends to coincide with high stress.');
      }
    }

    const postWorkout = moodHistory.filter((m) => m.context === 'post_workout');
    if (postWorkout.length >= 3) {
      const avgPostWorkout =
        postWorkout.reduce((s, m) => s + (m.mood ?? 5), 0) / postWorkout.length;
      const avgOverall =
        moodHistory.reduce((s, m) => s + (m.mood ?? 5), 0) / moodHistory.length;
      if (avgPostWorkout > avgOverall + 0.5) {
        insights.push('Your mood is typically higher after workouts.');
      }
    }

    return insights;
  }, [moodHistory]);

  const moodEmoji = MOOD_EMOJIS[mood] ?? '\uD83D\uDE10';

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
        <AIInsightCard screenKey="goals/mood" style={{ marginBottom: spacing.md }} />

        {/* Quick Mood Input */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated">
            <Text style={[typography.h3, { color: colors.text.primary, textAlign: 'center' }]}>
              How are you feeling?
            </Text>
            <Text style={[styles.moodEmoji, { marginTop: spacing.md }]}>
              {moodEmoji}
            </Text>
            <Slider
              value={mood}
              onValueChange={(v) => {
                setMood(v);
                hapticLight();
              }}
              min={1}
              max={10}
              step={1}
              label="Mood"
              fillColor={
                mood >= 7
                  ? colors.accent.success
                  : mood >= 4
                    ? colors.accent.warning
                    : colors.accent.danger
              }
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </Animated.View>

        {/* Sub-metrics */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={{ marginTop: spacing.lg }}>
            <Slider
              value={energy}
              onValueChange={setEnergy}
              min={1}
              max={10}
              step={1}
              label="Energy"
              fillColor={colors.accent.success}
            />
            <Slider
              value={stress}
              onValueChange={setStress}
              min={1}
              max={10}
              step={1}
              label="Stress"
              fillColor={colors.accent.danger}
              style={{ marginTop: spacing.lg }}
            />
            <Slider
              value={motivation}
              onValueChange={setMotivation}
              min={1}
              max={10}
              step={1}
              label="Motivation"
              fillColor={colors.accent.primary}
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        </Animated.View>

        {/* Context Selector */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text
            style={[
              typography.captionBold,
              {
                color: colors.text.secondary,
                marginTop: spacing.lg,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Context
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {CONTEXTS.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                selected={context === c.key}
                onPress={() => setContext(c.key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Notes */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Input
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="What's on your mind?"
            multiline
            containerStyle={{ marginTop: spacing.lg }}
          />
        </Animated.View>

        {/* Submit */}
        <Button
          title={todayMood ? 'Update Mood' : 'Log Mood'}
          onPress={handleLog}
          fullWidth
          loading={isLoading}
          style={{ marginTop: spacing.xl }}
        />

        {/* Mood Chart */}
        {chartData.length > 1 && (
          <Animated.View entering={FadeInDown.delay(500)}>
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
              Mood Trends
            </Text>
            <Card>
              <MoodChart data={chartData} showEnergy showStress />
            </Card>
          </Animated.View>
        )}

        {/* Correlation Insights */}
        {correlationInsights.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600)}>
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
              Insights
            </Text>
            {correlationInsights.map((insight, i) => (
              <Card key={i} style={{ marginBottom: spacing.sm }}>
                <View style={styles.insightRow}>
                  <Badge label="AI" variant="info" size="sm" />
                  <Text
                    style={[
                      typography.body,
                      { color: colors.text.secondary, marginLeft: spacing.sm, flex: 1 },
                    ]}
                  >
                    {insight}
                  </Text>
                </View>
              </Card>
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
  moodEmoji: { fontSize: 48, textAlign: 'center' },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start' },
});
