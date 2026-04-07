import {
  detectPRs,
  calculate1RM,
  calculateWeightForReps,
  getPRLabel,
  getPREmoji,
} from '../../services/calculations/prDetection';

describe('detectPRs', () => {
  const exerciseId = 'bench-press-1';

  it('detects a max weight PR', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_weight', value: 200 },
    ];
    const prs = detectPRs({ exerciseId, weight: 225, reps: 5 }, existingPRs);
    const weightPR = prs.find((p) => p.recordType === 'max_weight');
    expect(weightPR).toBeDefined();
    expect(weightPR!.value).toBe(225);
    expect(weightPR!.previousRecord).toBe(200);
  });

  it('detects a max reps PR', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_reps', value: 10 },
    ];
    const prs = detectPRs({ exerciseId, weight: 135, reps: 15 }, existingPRs);
    const repsPR = prs.find((p) => p.recordType === 'max_reps');
    expect(repsPR).toBeDefined();
    expect(repsPR!.value).toBe(15);
    expect(repsPR!.previousRecord).toBe(10);
  });

  it('detects a max volume PR', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_volume', value: 1000 },
    ];
    // 225 * 5 = 1125 > 1000
    const prs = detectPRs({ exerciseId, weight: 225, reps: 5 }, existingPRs);
    const volPR = prs.find((p) => p.recordType === 'max_volume');
    expect(volPR).toBeDefined();
    expect(volPR!.value).toBe(1125);
    expect(volPR!.previousRecord).toBe(1000);
  });

  it('detects an estimated 1RM PR', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_1rm', value: 250 },
    ];
    // 225 * (1 + 5/30) = 225 * 1.1667 = 262.5
    const prs = detectPRs({ exerciseId, weight: 225, reps: 5 }, existingPRs);
    const e1rmPR = prs.find((p) => p.recordType === 'max_1rm');
    expect(e1rmPR).toBeDefined();
    expect(e1rmPR!.value).toBeCloseTo(262.5, 0);
    expect(e1rmPR!.previousRecord).toBe(250);
  });

  it('does not detect PR when values are not beaten', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_weight', value: 300 },
      { exerciseId, recordType: 'max_reps', value: 20 },
      { exerciseId, recordType: 'max_volume', value: 5000 },
      { exerciseId, recordType: 'max_1rm', value: 350 },
    ];
    const prs = detectPRs({ exerciseId, weight: 200, reps: 8 }, existingPRs);
    expect(prs).toHaveLength(0);
  });

  it('detects multiple PRs in one set', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_weight', value: 200 },
      { exerciseId, recordType: 'max_reps', value: 5 },
      { exerciseId, recordType: 'max_volume', value: 900 },
      { exerciseId, recordType: 'max_1rm', value: 220 },
    ];
    // 225 lbs x 8 reps = 1800 volume, 1RM = 225 * (1 + 8/30) = 285
    const prs = detectPRs({ exerciseId, weight: 225, reps: 8 }, existingPRs);
    expect(prs.length).toBe(4); // all 4 PRs beaten
  });

  it('handles first time exercise with no existing PRs', () => {
    const prs = detectPRs({ exerciseId, weight: 135, reps: 10 }, []);
    // Should detect all PR types since everything beats 0
    expect(prs.find((p) => p.recordType === 'max_weight')).toBeDefined();
    expect(prs.find((p) => p.recordType === 'max_reps')).toBeDefined();
    expect(prs.find((p) => p.recordType === 'max_volume')).toBeDefined();
    expect(prs.find((p) => p.recordType === 'max_1rm')).toBeDefined();
    // previousRecord should be null for first time
    expect(prs[0]!.previousRecord).toBeNull();
  });

  it('ignores PRs from other exercises', () => {
    const existingPRs = [
      { exerciseId: 'squat-1', recordType: 'max_weight', value: 400 },
    ];
    const prs = detectPRs({ exerciseId, weight: 225, reps: 5 }, existingPRs);
    const weightPR = prs.find((p) => p.recordType === 'max_weight');
    expect(weightPR).toBeDefined();
    expect(weightPR!.previousRecord).toBeNull(); // no existing PR for this exercise
  });

  it('does not detect 1RM PR when reps > 12', () => {
    const prs = detectPRs({ exerciseId, weight: 100, reps: 15 }, []);
    const e1rmPR = prs.find((p) => p.recordType === 'max_1rm');
    expect(e1rmPR).toBeUndefined();
  });

  it('detects duration PR for timed exercises', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_duration', value: 60 },
    ];
    const prs = detectPRs(
      { exerciseId, weight: 0, reps: 0, durationSeconds: 90 },
      existingPRs,
    );
    const durPR = prs.find((p) => p.recordType === 'max_duration');
    expect(durPR).toBeDefined();
    expect(durPR!.value).toBe(90);
  });
});

describe('calculate1RM', () => {
  it('returns the weight itself for 1 rep', () => {
    expect(calculate1RM(225, 1)).toBe(225);
  });

  it('uses Epley formula for multiple reps', () => {
    // 200 * (1 + 5/30) = 200 * 1.1667 = 233.33
    expect(calculate1RM(200, 5)).toBeCloseTo(233.33, 1);
  });

  it('returns 0 for 0 reps', () => {
    expect(calculate1RM(200, 0)).toBe(0);
  });

  it('returns 0 for 0 weight', () => {
    expect(calculate1RM(0, 5)).toBe(0);
  });

  it('returns higher 1RM for more reps at same weight', () => {
    expect(calculate1RM(200, 10)).toBeGreaterThan(calculate1RM(200, 5));
  });
});

describe('calculateWeightForReps', () => {
  it('returns 1RM for target reps of 1', () => {
    expect(calculateWeightForReps(300, 1)).toBe(300);
  });

  it('returns 0 for target reps of 0', () => {
    expect(calculateWeightForReps(300, 0)).toBe(0);
  });

  it('rounds to nearest 2.5 lbs', () => {
    const result = calculateWeightForReps(300, 5);
    expect(result % 2.5).toBe(0);
  });

  it('returns lower weight for higher reps', () => {
    expect(calculateWeightForReps(300, 10)).toBeLessThan(calculateWeightForReps(300, 5));
  });
});

describe('getPRLabel', () => {
  it('returns correct label for max_weight', () => {
    expect(getPRLabel('max_weight')).toBe('Weight PR');
  });

  it('returns correct label for max_1rm', () => {
    expect(getPRLabel('max_1rm')).toBe('Estimated 1RM PR');
  });

  it('returns generic PR for unknown type', () => {
    expect(getPRLabel('unknown')).toBe('PR');
  });
});

describe('getPREmoji', () => {
  it('returns correct emoji for max_weight', () => {
    expect(getPREmoji('max_weight')).toBeDefined();
  });

  it('returns trophy for unknown type', () => {
    expect(getPREmoji('unknown')).toBeDefined();
  });
});
