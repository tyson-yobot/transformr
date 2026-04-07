import { useEffect, useMemo, useCallback } from 'react';
import { useChallengeStore } from '@stores/challengeStore';
import { useAuthStore } from '@stores/authStore';

export function useChallenges() {
  const store = useChallengeStore();
  const { user } = useAuthStore();

  useEffect(() => {
    store.fetchChallengeDefinitions();
  }, []);

  useEffect(() => {
    if (user?.id) {
      store.fetchEnrollments(user.id);
      store.fetchActiveEnrollment(user.id);
    }
  }, [user?.id]);

  const todayProgress = useMemo(() => {
    if (!store.todayLog) return { completed: 0, total: 0, percentage: 0 };
    const tasks = store.todayLog.tasks_completed ?? {};
    const entries = Object.values(tasks);
    const total = entries.length;
    const completed = entries.filter(Boolean).length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [store.todayLog]);

  const challengeProgress = useMemo(() => {
    if (!store.activeEnrollment) return null;
    const currentDay = store.activeEnrollment.current_day ?? 1;
    const totalDays = store.challengeDefinitions.find(
      (d) => d.id === store.activeEnrollment?.challenge_id
    )?.duration_days ?? 0;
    return {
      currentDay,
      totalDays,
      percentage: totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0,
      daysRemaining: Math.max(0, totalDays - currentDay),
    };
  }, [store.activeEnrollment, store.challengeDefinitions]);

  const activeChallenge = useMemo(() => {
    if (!store.activeEnrollment) return null;
    return store.challengeDefinitions.find(
      (d) => d.id === store.activeEnrollment?.challenge_id
    ) ?? null;
  }, [store.activeEnrollment, store.challengeDefinitions]);

  const completedChallenges = useMemo(() => {
    return store.enrollments.filter((e) => e.status === 'completed');
  }, [store.enrollments]);

  const enrollInChallenge = useCallback(
    async (challengeId: string, configuration?: Record<string, unknown>) => {
      if (!user?.id) return;
      await store.enrollInChallenge(user.id, challengeId, configuration);
    },
    [user?.id]
  );

  return {
    ...store,
    todayProgress,
    challengeProgress,
    activeChallenge,
    completedChallenges,
    enrollInChallenge,
  };
}
