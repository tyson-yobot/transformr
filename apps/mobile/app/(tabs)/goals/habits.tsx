// =============================================================================
// TRANSFORMR -- Habit Tracker
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import type { ColorScheme } from '@theme/colors';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Chip } from '@components/ui/Chip';
import { StreakCalendar } from '@components/charts/StreakCalendar';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { useHabitStore } from '@stores/habitStore';
import { useGamificationStyle } from '@hooks/useGamificationStyle';
import { hapticSuccess, hapticStreakMilestone, hapticMedium } from '@utils/haptics';
import { MonoText } from '@components/ui/MonoText';
import { EmptyState } from '@components/ui/EmptyState';
import { useFeatureGate } from '@hooks/useFeatureGate';
import type { Habit } from '@app-types/database';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { SCREEN_HELP } from '../../../constants/screenHelp';

type HabitCategory = NonNullable<Habit['category']>;

function HabitCheckbox({ isCompleted, colors }: {
  isCompleted: boolean;
  colors: ColorScheme;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    if (isCompleted) {
      scale.value = withSpring(0.8, { damping: 10, stiffness: 400 }, () => {
        scale.value = withSpring(1.2, { damping: 10, stiffness: 300 }, () => {
          scale.value = withSpring(1.0, { damping: 14, stiffness: 250 });
        });
      });
    }
  }, [isCompleted, scale]);

  return (
    <Animated.View
      style={[
        {
          width: 36,
          height: 36,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: isCompleted ? colors.accent.success : colors.border.default,
          backgroundColor: isCompleted ? colors.accent.success : colors.background.tertiary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      {isCompleted && (
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
      )}
    </Animated.View>
  );
}

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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isDrillSergeant, isMotivational, style: gamStyle } = useGamificationStyle();
  const isIntense = isDrillSergeant || isMotivational;
  const {
    habits,
    todayCompletions,
    allCompletions,
    isLoading,
    fetchHabits,
    completeHabit,
    createHabit,
  } = useHabitStore();
  const { toast, show: showToast, hide: hideToast } = useActionToast();

  const { isAvailable: canAddHabit, showUpgradeModal } = useFeatureGate('unlimited_habits');

  const [refreshing, setRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<HabitCategory | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('personal');
  const [, setCompletedAnimations] = useState<Set<string>>(new Set());

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.habitsScreen} />,
    });
  }, [navigation]);

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
      const storeError = useHabitStore.getState().error;
      if (storeError) {
        Alert.alert('Error', storeError);
        return;
      }
      await hapticSuccess();
      showToast('Habit complete \u2713', { subtext: 'Keep the streak going' });
      setCompletedAnimations((prev) => new Set(prev).add(habitId));
      const newStreak = (currentStreak ?? 0) + 1;
      if (STREAK_MILESTONES.includes(newStreak)) {
        await hapticStreakMilestone();
      }
    },
    [completedIds, completeHabit, showToast],
  );

  const handleAddHabit = useCallback(async () => {
    if (!newHabitName.trim()) return;
    await createHabit({
      name: newHabitName.trim(),
      category: newHabitCategory,
    });
    const storeError = useHabitStore.getState().error;
    if (storeError) {
      Alert.alert('Failed to Create', storeError);
      return;
    }
    await hapticSuccess();
    setShowAddModal(false);
    setNewHabitName('');
  }, [newHabitName, newHabitCategory, createHabit]);

  const getNextMilestone = (streak: number): number | null => {
    return STREAK_MILESTONES.find((m) => m > streak) ?? null;
  };

  // Build streak calendar data from 90-day completion history
  const streakCalendarData = useMemo(() => {
    const dataMap = new Map<string, number>();
    for (const completion of allCompletions) {
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
  }, [allCompletions]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ActionToast
        message={toast.message}
        subtext={toast.subtext}
        visible={toast.visible}
        onHide={hideToast}
        type={toast.type}
      />
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
        <AIInsightCard screenKey="goals/habits" style={{ marginBottom: spacing.md }} />

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
                <Text style={typography.monoBody}>{completedIds.size}/{habits.length}</Text>
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
          {habits.length === 0 && (
            <EmptyState
              ionIcon="checkmark-circle-outline"
              title="Build your daily foundation"
              subtitle="Small habits, compounded over time, create extraordinary results. Add your first habit to get started."
              actionLabel="Add First Habit"
              onAction={() => {
                hapticMedium();
                if (!canAddHabit && habits.length >= 5) {
                  showUpgradeModal();
                } else {
                  setShowAddModal(true);
                }
              }}
            />
          )}
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
                  accessibilityLabel={`${isCompleted ? 'Completed' : 'Complete'} habit ${habit.name}`}
                >
                  <Card
                    variant={isCompleted ? 'success' : streak >= 7 ? 'fire' : 'default'}
                    style={
                      isCompleted
                        ? { backgroundColor: colors.accent.successSubtle }
                        : undefined
                    }
                  >
                    <View style={styles.habitRow}>
                      {/* Checkbox */}
                      <HabitCheckbox
                        isCompleted={isCompleted}
                        colors={colors}
                      />

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

                      {/* Streak Badge */}
                      <View style={styles.streakBadge}>
                        <MonoText
                          variant="monoCaption"
                          color={
                            streak >= 30
                              ? colors.accent.gold
                              : streak >= 7
                                ? colors.accent.warning
                                : streak > 0
                                  ? colors.accent.success
                                  : colors.text.muted
                          }
                        >
                          {streak > 0 ? '\uD83D\uDD25' : '\u23F3'}{streak}
                        </MonoText>
                        <Text
                          style={[
                            typography.tiny,
                            { color: colors.text.muted },
                          ]}
                        >
                          {streak === 0
                            ? 'start today'
                            : isIntense
                              ? gamStyle.streakLabel.replace('{count}', String(streak))
                              : 'day streak'}
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
          onPress={() => {
            hapticMedium();
            if (!canAddHabit && habits.length >= 5) {
              showUpgradeModal();
            } else {
              setShowAddModal(true);
            }
          }}
          accessibilityLabel="Add a new habit"
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
          contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.sm }}
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
  content: { paddingBottom: 100 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressTrack: { flex: 1, overflow: 'hidden' },
  progressFill: { height: '100%' },
  habitRow: { flexDirection: 'row', alignItems: 'center' },
  streakBadge: { alignItems: 'center', marginLeft: 8 },
  milestoneTrack: { width: '100%', overflow: 'hidden' },
});
