import {
  detectPRs,
  calculate1RM,
  calculateWeightForReps,
  getPRLabel,
  getPREmoji,
} from '../../../services/calculations/prDetection';

describe('detectPRs', () => {
  const baseSet = { exerciseId: 'squat', weight: 225, reps: 5 };

  it('returns empty array when no PRs are broken', () => {
    const existingPRs = [
      { exerciseId: 'squat', recordType: 'max_weight', value: 300 },
      { exerciseId: 'squat', recordType: 'max_reps', value: 10 },
      { exerciseId: 'squat', recordType: 'max_volume', value: 3000 },
      { exerciseId: 'squat', recordType: 'max_1rm', value: 400 },
    ];
    expect(detectPRs(baseSet, existingPRs)).toHaveLength(0);
  });

  it('detects max_weight PR when weight exceeds existing', () => {
    const prs = detectPRs({ exerciseId: 'squat', weight: 315, reps: 1 }, [
      { exerciseId: 'squat', recordType: 'max_weight', value: 300 },
    ]);
    const weightPR = prs.find((p) => p.recordType === 'max_weight');
    expect(weightPR).toBeDefined();
    expect(weightPR?.value).toBe(315);
    expect(weightPR?.previousRecord).toBe(300);
  });

  it('detects max_reps PR', () => {
    const prs = detectPRs({ exerciseId: 'bench', weight: 135, reps: 15 }, [
      { exerciseId: 'bench', recordType: 'max_reps', value: 12 },
    ]);
    const repPR = prs.find((p) => p.recordType === 'max_reps');
    expect(repPR).toBeDefined();
    expect(repPR?.value).toBe(15);
  });

  it('detects max_volume PR (weight * reps)', () => {
    // 200 lbs * 8 reps = 1600 volume
    const prs = detectPRs({ exerciseId: 'dl', weight: 200, reps: 8 }, [
      { exerciseId: 'dl', recordType: 'max_volume', value: 1500 },
    ]);
    const volPR = prs.find((p) => p.recordType === 'max_volume');
    expect(volPR).toBeDefined();
    expect(volPR?.value).toBe(1600);
  });

  it('detects max_1rm PR using Epley formula', () => {
    // 225 * (1 + 5/30) = 225 * 1.1667 ≈ 262.5
    const prs = detectPRs({ exerciseId: 'squat', weight: 225, reps: 5 }, [
      { exerciseId: 'squat', recordType: 'max_1rm', value: 200 },
    ]);
    const oneRmPR = prs.find((p) => p.recordType === 'max_1rm');
    expect(oneRmPR).toBeDefined();
    expect(oneRmPR?.value).toBeCloseTo(262.5, 0);
  });

  it('does not detect 1rm PR when reps > 12', () => {
    const prs = detectPRs({ exerciseId: 'squat', weight: 100, reps: 15 }, [
      { exerciseId: 'squat', recordType: 'max_1rm', value: 50 },
    ]);
    const oneRmPR = prs.find((p) => p.recordType === 'max_1rm');
    expect(oneRmPR).toBeUndefined();
  });

  it('detects duration PR when durationSeconds provided', () => {
    const prs = detectPRs(
      { exerciseId: 'plank', weight: 0, reps: 1, durationSeconds: 120 },
      [{ exerciseId: 'plank', recordType: 'max_duration', value: 90 }],
    );
    const durPR = prs.find((p) => p.recordType === 'max_duration');
    expect(durPR?.value).toBe(120);
  });

  it('returns null previousRecord when no existing PR', () => {
    const prs = detectPRs({ exerciseId: 'new_exercise', weight: 100, reps: 5 }, []);
    const weightPR = prs.find((p) => p.recordType === 'max_weight');
    expect(weightPR?.previousRecord).toBeNull();
  });
});

describe('calculate1RM', () => {
  it('returns weight itself for 1 rep', () => {
    expect(calculate1RM(315, 1)).toBe(315);
  });

  it('applies Epley formula: weight * (1 + reps/30)', () => {
    expect(calculate1RM(200, 10)).toBeCloseTo(200 * (1 + 10 / 30), 5);
  });

  it('returns 0 for 0 weight', () => {
    expect(calculate1RM(0, 5)).toBe(0);
  });

  it('returns 0 for 0 reps', () => {
    expect(calculate1RM(200, 0)).toBe(0);
  });
});

describe('calculateWeightForReps', () => {
  it('returns oneRepMax for targetReps=1', () => {
    expect(calculateWeightForReps(300, 1)).toBe(300);
  });

  it('returns 0 for targetReps=0', () => {
    expect(calculateWeightForReps(300, 0)).toBe(0);
  });

  it('rounds to nearest 2.5', () => {
    const result = calculateWeightForReps(300, 5);
    expect(result % 2.5).toBe(0);
  });
});

describe('getPRLabel', () => {
  it('returns readable label for known record types', () => {
    expect(getPRLabel('max_weight')).toBe('Weight PR');
    expect(getPRLabel('max_reps')).toBe('Rep PR');
    expect(getPRLabel('max_volume')).toBe('Volume PR');
    expect(getPRLabel('max_duration')).toBe('Duration PR');
    expect(getPRLabel('max_1rm')).toBe('Estimated 1RM PR');
  });

  it('returns "PR" for unknown type', () => {
    expect(getPRLabel('unknown_type')).toBe('PR');
  });
});

describe('getPREmoji', () => {
  it('returns emoji for known record types', () => {
    expect(typeof getPREmoji('max_weight')).toBe('string');
    expect(getPREmoji('max_weight').length).toBeGreaterThan(0);
  });

  it('returns default emoji for unknown type', () => {
    expect(typeof getPREmoji('unknown')).toBe('string');
  });
});
