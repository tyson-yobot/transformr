import { useMemo } from 'react';
import { calculateReadinessScore, getReadinessEmoji } from '@services/calculations/readiness';

interface UseReadinessInput {
  sleepHours: number | null;
  sleepQuality: number | null;
  moodScore: number | null;
  stressLevel: number | null;
  energyLevel: number | null;
  sorenessLevel: number | null;
  workoutsLast3Days: number;
  totalVolumeLast3Days: number;
  avgVolumePer3Days: number;
}

export function useReadiness(input: UseReadinessInput) {
  const {
    sleepHours,
    sleepQuality,
    moodScore,
    stressLevel,
    energyLevel,
    sorenessLevel,
    workoutsLast3Days,
    totalVolumeLast3Days,
    avgVolumePer3Days,
  } = input;

  const readiness = useMemo(
    () =>
      calculateReadinessScore({
        sleepHours,
        sleepQuality,
        moodScore,
        stressLevel,
        energyLevel,
        sorenessLevel,
        workoutsLast3Days,
        totalVolumeLast3Days,
        avgVolumePer3Days,
      }),
    [
      sleepHours,
      sleepQuality,
      moodScore,
      stressLevel,
      energyLevel,
      sorenessLevel,
      workoutsLast3Days,
      totalVolumeLast3Days,
      avgVolumePer3Days,
    ],
  );

  const emoji = useMemo(() => getReadinessEmoji(readiness.score), [readiness.score]);

  return { ...readiness, emoji };
}
