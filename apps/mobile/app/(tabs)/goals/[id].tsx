// =============================================================================
// TRANSFORMR -- Goal Detail Screen
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { ProgressRing } from '@components/ui/ProgressRing';
import { useGoalStore } from '@stores/goalStore';
import { supabase } from '../../../services/supabase';
import { hapticSuccess, hapticMedium } from '@utils/haptics';
import { formatDate, formatNumber } from '@utils/formatters';
import type { GoalMilestone } from '@app-types/database';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const { goals, updateGoalProgress } = useGoalStore();

  const goal = goals.find((g) => g.id === id) ?? null;
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [progressInput, setProgressInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchMilestones = async () => {
      const { data } = await supabase
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', id)
        .order('sort_order', { ascending: true });
      if (data) setMilestones(data as GoalMilestone[]);
    };
    void fetchMilestones();
  }, [id]);

  const progress =
    goal?.target_value && goal.target_value > 0
      ? Math.min((goal.current_value ?? 0) / goal.target_value, 1)
      : 0;

  const handleUpdateProgress = useCallback(async () => {
    if (!goal || !progressInput.trim()) return;
    const val = parseFloat(progressInput);
    if (isNaN(val)) return;
    setIsUpdating(true);
    try {
      await updateGoalProgress(goal.id, val);
      await hapticSuccess();
      setProgressInput('');
    } finally {
      setIsUpdating(false);
    }
  }, [goal, progressInput, updateGoalProgress]);

  const handleToggleMilestone = useCallback(async (milestone: GoalMilestone) => {
    const nowCompleted = !milestone.is_completed;
    await hapticMedium();
    const { error } = await supabase
      .from('goal_milestones')
      .update({
        is_completed: nowCompleted,
        completed_at: nowCompleted ? new Date().toISOString() : null,
      })
      .eq('id', milestone.id);
    if (!error) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestone.id
            ? { ...m, is_completed: nowCompleted, completed_at: nowCompleted ? new Date().toISOString() : undefined }
            : m,
        ),
      );
    }
  }, []);

  const handleMarkComplete = useCallback(() => {
    Alert.alert(
      'Complete Goal',
      'Mark this goal as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            if (!goal) return;
            await supabase
              .from('goals')
              .update({ status: 'completed', completed_at: new Date().toISOString() })
              .eq('id', goal.id);
            await hapticSuccess();
            router.back();
          },
        },
      ],
    );
  }, [goal, router]);

  if (!goal) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background.primary }]}>
        <Ionicons name="warning-outline" size={48} color={colors.accent.danger} />
        <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.md }]}>
          Goal not found
        </Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  const statusVariant: 'success' | 'warning' | 'info' | 'default' =
    goal.status === 'active' ? 'success' :
    goal.status === 'paused' ? 'warning' :
    goal.status === 'completed' ? 'info' : 'default';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated">
            <View style={styles.headerRow}>
              {goal.icon && (
                <Text style={{ fontSize: 32, marginRight: spacing.md }}>{goal.icon}</Text>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[typography.h2, { color: colors.text.primary }]}>{goal.title}</Text>
                {goal.description && (
                  <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.xs }]}>
                    {goal.description}
                  </Text>
                )}
                <View style={[styles.badgeRow, { marginTop: spacing.sm, gap: spacing.sm }]}>
                  <Badge label={goal.status ?? 'active'} variant={statusVariant} size="sm" />
                  {goal.category && (
                    <Badge label={goal.category} size="sm" />
                  )}
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Progress */}
        {goal.target_value && goal.target_value > 0 && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.progressSection}>
            <ProgressRing
              progress={progress}
              size={140}
              strokeWidth={10}
              color={goal.color ?? colors.accent.primary}
            >
              <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                {Math.round(progress * 100)}%
              </Text>
            </ProgressRing>
            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>Current</Text>
              <Text style={[typography.stat, { color: colors.text.primary }]}>
                {formatNumber(goal.current_value ?? 0)}
                {goal.unit ? ` ${goal.unit}` : ''}
              </Text>
              <Text style={[typography.captionBold, { color: colors.text.secondary, marginTop: spacing.sm }]}>Target</Text>
              <Text style={[typography.bodyBold, { color: colors.accent.primary }]}>
                {formatNumber(goal.target_value)}
                {goal.unit ? ` ${goal.unit}` : ''}
              </Text>
              {goal.target_date && (
                <>
                  <Text style={[typography.captionBold, { color: colors.text.secondary, marginTop: spacing.sm }]}>Deadline</Text>
                  <Text style={[typography.caption, { color: colors.text.primary }]}>
                    {formatDate(goal.target_date)}
                  </Text>
                </>
              )}
            </View>
          </Animated.View>
        )}

        {/* Update Progress */}
        {goal.status === 'active' && goal.target_value && goal.target_value > 0 && (
          <Animated.View entering={FadeInDown.delay(300)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Update Progress
            </Text>
            <Card>
              <Input
                label={`New value${goal.unit ? ` (${goal.unit})` : ''}`}
                value={progressInput}
                onChangeText={setProgressInput}
                placeholder={String(goal.current_value ?? 0)}
                keyboardType="decimal-pad"
              />
              <Button
                title="Update"
                onPress={handleUpdateProgress}
                fullWidth
                loading={isUpdating}
                disabled={!progressInput.trim()}
                style={{ marginTop: spacing.md }}
              />
            </Card>
          </Animated.View>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Milestones
            </Text>
            {milestones.map((milestone) => (
              <Card
                key={milestone.id}
                style={{ marginBottom: spacing.sm }}
                onPress={() => handleToggleMilestone(milestone)}
              >
                <View style={styles.milestoneRow}>
                  <Ionicons
                    name={milestone.is_completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={milestone.is_completed ? colors.accent.success : colors.text.muted}
                  />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text
                      style={[
                        typography.bodyBold,
                        {
                          color: milestone.is_completed ? colors.text.secondary : colors.text.primary,
                          textDecorationLine: milestone.is_completed ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {milestone.title}
                    </Text>
                    {milestone.target_date && (
                      <Text style={[typography.caption, { color: colors.text.muted }]}>
                        {formatDate(milestone.target_date)}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </Animated.View>
        )}

        {/* Actions */}
        {goal.status === 'active' && (
          <Animated.View entering={FadeInDown.delay(500)}>
            <Button
              title="Mark as Complete"
              onPress={handleMarkComplete}
              variant="secondary"
              fullWidth
              style={{ marginTop: spacing.xl }}
            />
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  badgeRow: { flexDirection: 'row' },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  milestoneRow: { flexDirection: 'row', alignItems: 'center' },
});
