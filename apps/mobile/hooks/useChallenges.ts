import { useEffect, useMemo, useCallback } from 'react';
import { useChallengeStore } from '@stores/challengeStore';
import { useAuthStore } from '@stores/authStore';

export function useChallenges() {
  const store = useChallengeStore();
  const fetchChallengeDefinitions = useChallengeStore((s) => s.fetchChallengeDefinitions);
  const fetchEnrollments = useChallengeStore((s) => s.fetchEnrollments);
  const fetchActiveEnrollment = useChallengeStore((s) => s.fetchActiveEnrollment);
  const enrollInChallengeStore = useChallengeStore((s) => s.enrollInChallenge);
  const todayLog = useChallengeStore((s) => s.todayLog);
  const activeEnrollment = useChallengeStore((s) => s.activeEnrollment);
  const challengeDefinitions = useChallengeStore((s) => s.challengeDefinitions);
  const enrollments = useChallengeStore((s) => s.enrollments);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchChallengeDefinitions();
  }, [fetchChallengeDefinitions]);

  useEffect(() => {
    if (user?.id) {
      fetchEnrollments(user.id);
      fetchActiveEnrollment(user.id);
    }
  }, [user?.id, fetchEnrollments, fetchActiveEnrollment]);

  const todayProgress = useMemo(() => {
    if (!todayLog) return { completed: 0, total: 0, percentage: 0 };
    const tasks = todayLog.tasks_completed ?? {};
    const entries = Object.values(tasks);
    const total = entries.length;
    const completed = entries.filter(Boolean).length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [todayLog]);

  const challengeProgress = useMemo(() => {
    if (!activeEnrollment) return null;
    const currentDay = activeEnrollment.current_day ?? 1;
    const totalDays = challengeDefinitions.find(
      (d) => d.id === activeEnrollment?.challenge_id
    )?.duration_days ?? 0;
    return {
      currentDay,
      totalDays,
      percentage: totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0,
      daysRemaining: Math.max(0, totalDays - currentDay),
    };
  }, [activeEnrollment, challengeDefinitions]);

  const activeChallenge = useMemo(() => {
    if (!activeEnrollment) return null;
    return challengeDefinitions.find(
      (d) => d.id === activeEnrollment?.challenge_id
    ) ?? null;
  }, [activeEnrollment, challengeDefinitions]);

  const completedChallenges = useMemo(() => {
    return enrollments.filter((e) => e.status === 'completed');
  }, [enrollments]);

  const enrollInChallenge = useCallback(
    async (challengeId: string, configuration?: Record<string, unknown>) => {
      if (!user?.id) return;
      await enrollInChallengeStore(user.id, challengeId, configuration);
    },
    [user?.id, enrollInChallengeStore]
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
