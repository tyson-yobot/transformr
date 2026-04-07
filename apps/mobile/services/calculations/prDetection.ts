// Personal Record detection logic

interface SetData {
  exerciseId: string;
  weight: number;
  reps: number;
  durationSeconds?: number;
}

interface PRRecord {
  exerciseId: string;
  recordType: 'max_weight' | 'max_reps' | 'max_volume' | 'max_duration' | 'max_1rm';
  value: number;
  previousRecord: number | null;
}

interface ExistingPR {
  exerciseId: string;
  recordType: string;
  value: number;
}

export function detectPRs(
  setData: SetData,
  existingPRs: ExistingPR[],
): PRRecord[] {
  const prs: PRRecord[] = [];

  const exercisePRs = existingPRs.filter((pr) => pr.exerciseId === setData.exerciseId);

  // Max weight PR
  const currentMaxWeight = exercisePRs.find((pr) => pr.recordType === 'max_weight');
  if (setData.weight > (currentMaxWeight?.value ?? 0)) {
    prs.push({
      exerciseId: setData.exerciseId,
      recordType: 'max_weight',
      value: setData.weight,
      previousRecord: currentMaxWeight?.value ?? null,
    });
  }

  // Max reps PR (at any weight)
  const currentMaxReps = exercisePRs.find((pr) => pr.recordType === 'max_reps');
  if (setData.reps > (currentMaxReps?.value ?? 0)) {
    prs.push({
      exerciseId: setData.exerciseId,
      recordType: 'max_reps',
      value: setData.reps,
      previousRecord: currentMaxReps?.value ?? null,
    });
  }

  // Max volume PR (weight × reps for a single set)
  const volume = setData.weight * setData.reps;
  const currentMaxVolume = exercisePRs.find((pr) => pr.recordType === 'max_volume');
  if (volume > (currentMaxVolume?.value ?? 0)) {
    prs.push({
      exerciseId: setData.exerciseId,
      recordType: 'max_volume',
      value: volume,
      previousRecord: currentMaxVolume?.value ?? null,
    });
  }

  // Estimated 1RM PR (Epley formula)
  if (setData.reps > 0 && setData.reps <= 12 && setData.weight > 0) {
    const estimated1rm = calculate1RM(setData.weight, setData.reps);
    const currentMax1rm = exercisePRs.find((pr) => pr.recordType === 'max_1rm');
    if (estimated1rm > (currentMax1rm?.value ?? 0)) {
      prs.push({
        exerciseId: setData.exerciseId,
        recordType: 'max_1rm',
        value: Math.round(estimated1rm * 10) / 10,
        previousRecord: currentMax1rm?.value ?? null,
      });
    }
  }

  // Max duration PR (for timed exercises)
  if (setData.durationSeconds && setData.durationSeconds > 0) {
    const currentMaxDuration = exercisePRs.find((pr) => pr.recordType === 'max_duration');
    if (setData.durationSeconds > (currentMaxDuration?.value ?? 0)) {
      prs.push({
        exerciseId: setData.exerciseId,
        recordType: 'max_duration',
        value: setData.durationSeconds,
        previousRecord: currentMaxDuration?.value ?? null,
      });
    }
  }

  return prs;
}

// Epley formula for estimated 1RM
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps <= 0 || weight <= 0) return 0;
  return weight * (1 + reps / 30);
}

// Calculate weight for target reps based on 1RM
export function calculateWeightForReps(oneRepMax: number, targetReps: number): number {
  if (targetReps <= 0) return 0;
  if (targetReps === 1) return oneRepMax;
  return Math.round((oneRepMax / (1 + targetReps / 30)) / 2.5) * 2.5; // Round to nearest 2.5
}

export function getPRLabel(recordType: string): string {
  const labels: Record<string, string> = {
    max_weight: 'Weight PR',
    max_reps: 'Rep PR',
    max_volume: 'Volume PR',
    max_duration: 'Duration PR',
    max_1rm: 'Estimated 1RM PR',
  };
  return labels[recordType] ?? 'PR';
}

export function getPREmoji(recordType: string): string {
  const emojis: Record<string, string> = {
    max_weight: '🏋️',
    max_reps: '🔁',
    max_volume: '📊',
    max_duration: '⏱️',
    max_1rm: '💪',
  };
  return emojis[recordType] ?? '🏆';
}
