import { useEffect, useMemo } from 'react';
import { useHabitStore } from '@stores/habitStore';
import { useAuthStore } from '@stores/authStore';

export function useHabits() {
  const store = useHabitStore();
  const fetchHabits = useHabitStore((s) => s.fetchHabits);
  const habits = useHabitStore((s) => s.habits);
  const todayCompletions = useHabitStore((s) => s.todayCompletions);
  const { user } = useAuthStore();

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
    ...store,
    todayProgress,
  };
}
