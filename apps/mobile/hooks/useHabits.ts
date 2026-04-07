import { useEffect, useMemo } from 'react';
import { useHabitStore } from '@stores/habitStore';
import { useAuthStore } from '@stores/authStore';

export function useHabits() {
  const store = useHabitStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      store.fetchHabits();
    }
  }, [user?.id]);

  const todayProgress = useMemo(() => {
    const total = store.habits.filter((h) => h.is_active).length;
    const completed = store.todayCompletions.length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [store.habits, store.todayCompletions]);

  return {
    ...store,
    todayProgress,
  };
}
