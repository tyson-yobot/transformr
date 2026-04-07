// =============================================================================
// TRANSFORMR -- Weekly Review
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Skeleton } from '@components/ui/Skeleton';
import { formatNumber, formatCurrency, formatPercentage, getGradeColor } from '@utils/formatters';
import { supabase } from '@services/supabase';
import type { WeeklyReview } from '@app-types/database';

interface GradeCardProps {
  label: string;
  grade: string | undefined;
}

function GradeCard({ label, grade }: GradeCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const gradeStr = grade ?? '--';
  const color = getGradeColor(gradeStr);

  return (
    <View
      style={[styles.gradeCard, {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
      }]}
    >
      <Text style={[typography.stat, { color, textAlign: 'center' }]}>{gradeStr}</Text>
      <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center', marginTop: spacing.xs }]}>
        {label}
      </Text>
    </View>
  );
}

export default function WeeklyReviewScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();

  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [previousReview, setPreviousReview] = useState<WeeklyReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error: fetchError } = await supabase
          .from('weekly_reviews')
          .select('*')
          .eq('user_id', user.id)
          .order('week_start', { ascending: false })
          .limit(2);
        if (fetchError) throw fetchError;

        const reviews = (data ?? []) as WeeklyReview[];
        setReview(reviews[0] ?? null);
        setPreviousReview(reviews[1] ?? null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch review';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReview();
  }, []);

  const statDelta = useCallback(
    (current: number | undefined, previous: number | undefined): string | null => {
      if (current == null || previous == null) return null;
      const diff = current - previous;
      if (diff === 0) return null;
      return diff > 0 ? `+${formatNumber(diff, 1)}` : formatNumber(diff, 1);
    },
    [],
  );

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <View style={{ padding: spacing.lg, paddingTop: insets.top + spacing.lg, gap: spacing.md }}>
          <Skeleton variant="card" height={80} />
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={200} />
        </View>
      </View>
    );
  }

  if (!review) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <Text style={[typography.h2, { color: colors.text.primary, textAlign: 'center' }]}>
          No Weekly Review Yet
        </Text>
        <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md }]}>
          Your weekly review will appear here once generated. Check back at the end of the week!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[typography.h2, { color: colors.text.primary, textAlign: 'center' }]}>
            Weekly Review
          </Text>
          <Text style={[typography.caption, { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs }]}>
            Week of {review.week_start}
          </Text>
          {review.overall_grade && (
            <View style={{ alignItems: 'center', marginTop: spacing.md }}>
              <Text style={[{ fontSize: 48, fontWeight: '800', color: getGradeColor(review.overall_grade) }]}>
                {review.overall_grade}
              </Text>
              <Text style={[typography.caption, { color: colors.text.muted }]}>Overall Grade</Text>
            </View>
          )}
        </Animated.View>

        {/* Grades Grid */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
            Area Grades
          </Text>
          <View style={styles.gradesGrid}>
            <GradeCard label="Fitness" grade={review.fitness_grade} />
            <GradeCard label="Nutrition" grade={review.nutrition_grade} />
            <GradeCard label="Business" grade={review.business_grade} />
            <GradeCard label="Habits" grade={review.habits_grade} />
            <GradeCard label="Sleep" grade={review.sleep_grade} />
          </View>
        </Animated.View>

        {/* Stats vs Previous Week */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
            Stats vs Previous Week
          </Text>
          <Card>
            <StatRow
              label="Workouts"
              value={`${review.workouts_completed ?? 0}/${review.workouts_target ?? 0}`}
              delta={statDelta(review.workouts_completed, previousReview?.workouts_completed)}
            />
            <StatRow label="Avg Calories" value={formatNumber(review.avg_calories ?? 0)} delta={statDelta(review.avg_calories, previousReview?.avg_calories)} />
            <StatRow label="Avg Protein" value={`${formatNumber(review.avg_protein ?? 0)}g`} delta={statDelta(review.avg_protein, previousReview?.avg_protein)} />
            <StatRow label="Avg Sleep" value={`${formatNumber(review.avg_sleep_hours ?? 0, 1)}h`} delta={statDelta(review.avg_sleep_hours, previousReview?.avg_sleep_hours)} />
            <StatRow label="Habit Completion" value={formatPercentage((review.habits_completion_rate ?? 0) * 100)} delta={null} />
            <StatRow label="Focus Hours" value={formatNumber(review.focus_hours_total ?? 0, 1)} delta={statDelta(review.focus_hours_total, previousReview?.focus_hours_total)} />
            {review.revenue_this_week != null && (
              <StatRow label="Revenue" value={formatCurrency(review.revenue_this_week)} delta={statDelta(review.revenue_this_week, previousReview?.revenue_this_week)} />
            )}
            {review.prs_this_week != null && review.prs_this_week > 0 && (
              <StatRow label="New PRs" value={String(review.prs_this_week)} delta={null} />
            )}
          </Card>
        </Animated.View>

        {/* AI Summary */}
        {review.ai_weekly_summary && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              AI Summary
            </Text>
            <Card>
              <Text style={[typography.body, { color: colors.text.primary, lineHeight: 22 }]}>
                {review.ai_weekly_summary}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Wins */}
        {review.top_wins && review.top_wins.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Wins This Week
            </Text>
            {review.top_wins.map((win, index) => (
              <View
                key={`win-${index}`}
                style={[styles.listItem, {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }]}
              >
                <Text style={{ fontSize: 16, marginRight: spacing.sm }}>{'\u2705'}</Text>
                <Text style={[typography.body, { color: colors.text.primary, flex: 1 }]}>{win}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Areas to Improve */}
        {review.areas_to_improve && review.areas_to_improve.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Areas to Improve
            </Text>
            {review.areas_to_improve.map((area, index) => (
              <View
                key={`improve-${index}`}
                style={[styles.listItem, {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }]}
              >
                <Text style={{ fontSize: 16, marginRight: spacing.sm }}>{'\uD83D\uDCA1'}</Text>
                <Text style={[typography.body, { color: colors.text.primary, flex: 1 }]}>{area}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Next Week Goals */}
        {review.next_week_goals && review.next_week_goals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(700)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Next Week Goals
            </Text>
            {review.next_week_goals.map((goal, index) => (
              <View
                key={`goal-${index}`}
                style={[styles.listItem, {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }]}
              >
                <Text style={{ fontSize: 16, marginRight: spacing.sm }}>{'\uD83C\uDFAF'}</Text>
                <Text style={[typography.body, { color: colors.text.primary, flex: 1 }]}>{goal}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Stat Row sub-component
function StatRow({ label, value, delta }: { label: string; value: string; delta: string | null }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={[styles.statRow, { paddingVertical: spacing.sm }]}>
      <Text style={[typography.body, { color: colors.text.secondary, flex: 1 }]}>{label}</Text>
      <Text style={[typography.bodyBold, { color: colors.text.primary }]}>{value}</Text>
      {delta && (
        <Text
          style={[
            typography.tiny,
            {
              color: delta.startsWith('+') ? colors.accent.success : colors.accent.danger,
              marginLeft: spacing.sm,
              minWidth: 40,
              textAlign: 'right',
            },
          ]}
        >
          {delta}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  gradesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  gradeCard: {
    width: 100,
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(248,250,252,0.1)',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
