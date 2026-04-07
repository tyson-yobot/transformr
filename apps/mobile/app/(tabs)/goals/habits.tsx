// =============================================================================
// TRANSFORMR -- Habit Tracker
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
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Chip } from '@components/ui/Chip';
import { StreakCalendar } from '@components/charts/StreakCalendar';
import { useHabitStore } from '@stores/habitStore';
import { hapticSuccess, hapticStreakMilestone } from '@utils/haptics';
import type { Habit } from '@app-types/database';

type HabitCategory = NonNullable<Habit['category']>;

const HABIT_CATEGORIES: { key: HabitCategory; label: string }[] = [
  { key: 'fitness', label: 'Fitness' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'health', label: 'Health' },
  { key: 'business', label: 'Business' },
  { key: 'personal', label: 'Personal' },
  { key: 'mindset', label: 'Mindset' },
  { key: 'finance', label: 'Finance' },
  { key: 'learning', label: 'Learning' },
];

const STREAK_MILESTONES = [7, 14, 21, 30, 50, 75, 100, 200, 365];

export default function HabitTracker() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const {
    habits,
    todayCompletions,
    isLoading,
    fetchHabits,
    completeHabit,
    createHabit,
  } = useHabitStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<HabitCategory | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('personal');
  const [completedAnimations, setCompletedAnimations] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHabits();
    setRefreshing(false);
  }, [fetchHabits]);

  const completedIds = useMemo(
    () => new Set(todayCompletions.map((c) => c.habit_id).filter(Boolean)),
    [todayCompletions],
  );

  const filteredHabits = useMemo(
    () =>
      filterCategory
        ? habits.filter((h) => h.category === filterCategory)
        : habits,
    [habits, filterCategory],
  );

  const todayProgress = useMemo(() => {
    if (habits.length === 0) return 0;
    return completedIds.size / habits.length;
  }, [habits, completedIds]);

  const handleComplete = useCallback(
    async (habitId: string, currentStreak: number) => {
      if (completedIds.has(habitId)) return;
      await completeHabit(habitId);
      await hapticSuccess();

      setCompletedAnimations((prev) => new Set(prev).add(habitId));

      const newStreak = (currentStreak ?? 0) + 1;
      if (STREAK_MILESTONES.includes(newStreak)) {
        await hapticStreakMilestone();
      }
    },
    [completedIds, completeHabit],
  );

  const handleAddHabit = useCallback(async () => {
    if (!newHabitName.trim()) return;
    await createHabit({
      name: newHabitName.trim(),
      category: newHabitCategory,
    });
    await hapticSuccess();
    setShowAddModal(false);
    setNewHabitName('');
  }, [newHabitName, newHabitCategory, createHabit]);

  const getNextMilestone = (streak: number): number | null => {
    return STREAK_MILESTONES.find((m) => m > streak) ?? null;
  };

  // Build streak calendar data from today completions
  const streakCalendarData = useMemo(() => {
    const dataMap = new Map<string, number>();
    for (const completion of todayCompletions) {
      if (completion.completed_at) {
        const dateKey = completion.completed_at.substring(0, 10);
        dataMap.set(dateKey, (dataMap.get(dateKey) ?? 0) + 1);
      }
    }
    return Array.from(dataMap.entries()).map(([date, count]) => ({
      date,
      completed: count > 0,
      count,
    }));
  }, [todayCompletions]);

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
        {/* Today's Progress */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card>
            <Text style={[typography.h3, { color: colors.text.primary }]}>
              Today's Progress
            </Text>
            <View style={[styles.progressRow, { marginTop: spacing.md }]}>
              <View
                style={[
                  styles.progressTrack,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderRadius: 6,
                    height: 12,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.accent.success,
                      borderRadius: 6,
                      width: `${Math.round(todayProgress * 100)}%` as `${number}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  typography.bodyBold,
                  { color: colors.text.primary, marginLeft: spacing.md },
                ]}
              >
                {completedIds.size}/{habits.length}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Category Filter Chips */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: spacing.sm,
              marginTop: spacing.lg,
              paddingVertical: spacing.xs,
            }}
          >
            <Chip
              label="All"
              selected={filterCategory === null}
              onPress={() => setFilterCategory(null)}
            />
            {HABIT_CATEGORIES.map((cat) => (
              <Chip
                key={cat.key}
                label={cat.label}
                selected={filterCategory === cat.key}
                onPress={() =>
                  setFilterCategory(
                    filterCategory === cat.key ? null : cat.key,
                  )
                }
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Habits Checklist */}
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {filteredHabits.map((habit, index) => {
            const isCompleted = completedIds.has(habit.id);
            const streak = habit.current_streak ?? 0;
            const nextMilestone = getNextMilestone(streak);

            return (
              <Animated.View
                key={habit.id}
                entering={FadeInDown.delay(300 + index * 50)}
              >
                <Pressable
                  onPress={() => handleComplete(habit.id, streak)}
                  disabled={isCompleted}
                >
                  <Card
                    style={
                      isCompleted
                        ? { borderWidth: 1, borderColor: colors.accent.success }
                        : undefined
                    }
                  >
                    <View style={styles.habitRow}>
                      {/* Checkbox */}
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: isCompleted
                              ? colors.accent.success
                              : colors.border.default,
                            backgroundColor: isCompleted
                              ? colors.accent.success
                              : 'transparent',
                            borderRadius: borderRadius.sm,
                          },
                        ]}
                      >
                        {isCompleted && (
                          <Animated.Text
                            entering={ZoomIn.duration(200)}
                            style={styles.checkmark}
                          >
                            {'\u2713'}
                          </Animated.Text>
                        )}
                      </View>

                      {/* Habit Info */}
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text
                          style={[
                            typography.bodyBold,
                            {
                              color: isCompleted
                                ? colors.text.secondary
                                : colors.text.primary,
                              textDecorationLine: isCompleted
                                ? 'line-through'
                                : 'none',
                            },
                          ]}
                        >
                          {habit.name}
                        </Text>
                        {habit.description && (
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.text.muted, marginTop: 2 },
                            ]}
                            numberOfLines={1}
                          >
                            {habit.description}
                          </Text>
                        )}
                      </View>

                      {/* Streak */}
                      <View style={styles.streakBadge}>
                        <Text
                          style={[
                            typography.captionBold,
                            { color: colors.accent.fire },
                          ]}
                        >
                          {streak}
                        </Text>
                        <Text
                          style={[
                            typography.tiny,
                            { color: colors.text.muted },
                          ]}
                        >
                          streak
                        </Text>
                      </View>
                    </View>

                    {/* Milestone Progress */}
                    {nextMilestone && (
                      <View style={{ marginTop: spacing.sm }}>
                        <View
                          style={[
                            styles.milestoneTrack,
                            {
                              backgroundColor: colors.background.tertiary,
                              borderRadius: 3,
                              height: 4,
                            },
                          ]}
                        >
                          <View
                            style={{
                              height: 4,
                              borderRadius: 3,
                              backgroundColor: colors.accent.gold,
                              width: `${Math.round((streak / nextMilestone) * 100)}%` as `${number}%`,
                            }}
                          />
                        </View>
                        <Text
                          style={[
                            typography.tiny,
                            {
                              color: colors.text.muted,
                              marginTop: 2,
                              textAlign: 'right',
                            },
                          ]}
                        >
                          Next: {nextMilestone} days
                        </Text>
                      </View>
                    )}
                  </Card>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Streak Calendar */}
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
            Streak Heatmap
          </Text>
          <Card>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <StreakCalendar data={streakCalendarData} days={90} />
            </ScrollView>
          </Card>
        </Animated.View>

        {/* Add Habit Button */}
        <Button
          title="Add Habit"
          onPress={() => setShowAddModal(true)}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        title="Add Habit"
      >
        <Input
          label="Habit Name"
          value={newHabitName}
          onChangeText={setNewHabitName}
          placeholder="e.g. Meditate 10 minutes"
        />

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
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {HABIT_CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              selected={newHabitCategory === cat.key}
              onPress={() => setNewHabitCategory(cat.key)}
            />
          ))}
        </ScrollView>

        <Button
          title="Create Habit"
          onPress={handleAddHabit}
          fullWidth
          loading={isLoading}
          disabled={!newHabitName.trim()}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressTrack: { flex: 1, overflow: 'hidden' },
  progressFill: { height: '100%' },
  habitRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  streakBadge: { alignItems: 'center', marginLeft: 8 },
  milestoneTrack: { width: '100%', overflow: 'hidden' },
});
