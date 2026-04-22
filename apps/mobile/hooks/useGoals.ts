import { useEffect, useMemo } from 'react';
import { useGoalStore } from '@stores/goalStore';
import { useAuthStore } from '@stores/authStore';

export function useGoals() {
  const goals = useGoalStore((s) => s.goals);
  const milestones = useGoalStore((s) => s.milestones);
  const isLoading = useGoalStore((s) => s.isLoading);
  const error = useGoalStore((s) => s.error);
  const fetchGoals = useGoalStore((s) => s.fetchGoals);
  const createGoal = useGoalStore((s) => s.createGoal);
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const updateGoalProgress = useGoalStore((s) => s.updateGoalProgress);
  const clearError = useGoalStore((s) => s.clearError);
  const reset = useGoalStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);

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
    goals,
    milestones,
    isLoading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    updateGoalProgress,
    clearError,
    reset,
    activeGoals,
    goalsByCategory,
  };
}
