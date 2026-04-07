import { useMemo } from 'react';
import { calculateStreak, getStreakHeatmapData, isStreakAtRisk, getNextStreakMilestone } from '@services/calculations/streaks';

interface UseStreaksInput {
  completionDates: string[];
}

export function useStreaks({ completionDates }: UseStreaksInput) {
  const streakData = useMemo(() => calculateStreak(completionDates), [completionDates]);
  const heatmapData = useMemo(() => getStreakHeatmapData(completionDates), [completionDates]);

  const atRisk = useMemo(() => {
    if (completionDates.length === 0) return false;
    const lastDate = [...completionDates].sort().pop();
    return lastDate ? isStreakAtRisk(lastDate) : false;
  }, [completionDates]);

  const nextMilestone = useMemo(
    () => getNextStreakMilestone(streakData.currentStreak),
    [streakData.currentStreak],
  );

  return {
    ...streakData,
    heatmapData,
    atRisk,
    nextMilestone,
    daysToMilestone: nextMilestone - streakData.currentStreak,
  };
}
