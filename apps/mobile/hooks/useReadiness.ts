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
  const readiness = useMemo(() => calculateReadinessScore(input), [
    input.sleepHours,
    input.sleepQuality,
    input.moodScore,
    input.stressLevel,
    input.energyLevel,
    input.sorenessLevel,
    input.workoutsLast3Days,
    input.totalVolumeLast3Days,
    input.avgVolumePer3Days,
  ]);

  const emoji = useMemo(() => getReadinessEmoji(readiness.score), [readiness.score]);

  return { ...readiness, emoji };
}
