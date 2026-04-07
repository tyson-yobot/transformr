import { useEffect, useMemo } from 'react';
import { useGoalStore } from '@stores/goalStore';
import { useAuthStore } from '@stores/authStore';

export function useGoals() {
  const store = useGoalStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      store.fetchGoals();
    }
  }, [user?.id]);

  const activeGoals = useMemo(
    () => store.goals.filter((g) => g.status === 'active'),
    [store.goals],
  );

  const goalsByCategory = useMemo(() => {
    const grouped: Record<string, typeof store.goals> = {};
    for (const goal of activeGoals) {
      const category = goal.category ?? 'personal';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(goal);
    }
    return grouped;
  }, [activeGoals]);

  return {
    ...store,
    activeGoals,
    goalsByCategory,
  };
}
