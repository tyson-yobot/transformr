import { useEffect, useMemo } from 'react';
import { useGoalStore } from '@stores/goalStore';
import { useAuthStore } from '@stores/authStore';

export function useGoals() {
  const store = useGoalStore();
  const fetchGoals = useGoalStore((s) => s.fetchGoals);
  const goals = useGoalStore((s) => s.goals);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchGoals();
    }
  }, [user?.id, fetchGoals]);

  const activeGoals = useMemo(
    () => goals.filter((g) => g.status === 'active'),
    [goals],
  );

  const goalsByCategory = useMemo(() => {
    const grouped: Record<string, typeof goals> = {};
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
