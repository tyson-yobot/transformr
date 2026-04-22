import { useEffect, useMemo } from 'react';
import { useHabitStore } from '@stores/habitStore';
import { useAuthStore } from '@stores/authStore';

export function useHabits() {
  const habits = useHabitStore((s) => s.habits);
  const todayCompletions = useHabitStore((s) => s.todayCompletions);
  const allCompletions = useHabitStore((s) => s.allCompletions);
  const overallStreak = useHabitStore((s) => s.overallStreak);
  const isLoading = useHabitStore((s) => s.isLoading);
  const error = useHabitStore((s) => s.error);
  const fetchHabits = useHabitStore((s) => s.fetchHabits);
  const completeHabit = useHabitStore((s) => s.completeHabit);
  const createHabit = useHabitStore((s) => s.createHabit);
  const getStreakData = useHabitStore((s) => s.getStreakData);
  const clearError = useHabitStore((s) => s.clearError);
  const reset = useHabitStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.id) {
      fetchHabits();
    }
  }, [user?.id, fetchHabits]);

  const todayProgress = useMemo(() => {
    const total = habits.filter((h) => h.is_active).length;
    const completed = todayCompletions.length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [habits, todayCompletions]);

  return {
    habits,
    todayCompletions,
    allCompletions,
    overallStreak,
    isLoading,
    error,
    fetchHabits,
    completeHabit,
    createHabit,
    getStreakData,
    clearError,
    reset,
    todayProgress,
  };
}
