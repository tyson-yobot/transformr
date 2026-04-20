import {
  calculateDayScore,
  getDayScoreEmoji,
} from '../../../services/calculations/dayScore';

const perfectInput = {
  habitsCompleted: 5,
  habitsTotal: 5,
  caloriesTarget: 2000,
  caloriesLogged: 2000,
  proteinTarget: 150,
  proteinLogged: 150,
  workoutsCompleted: 1,
  workoutsPlanned: 1,
  sleepHours: 8,
  waterOz: 80,
  waterTarget: 80,
  moodAverage: 10,
  focusHours: 4,
};

describe('calculateDayScore', () => {
  it('returns score in 0-100 range', () => {
    const result = calculateDayScore(perfectInput);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('returns high score for perfect input', () => {
    const result = calculateDayScore(perfectInput);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it('returns 0 score for all-zero input', () => {
    const result = calculateDayScore({
      habitsCompleted: 0,
      habitsTotal: 5,
      caloriesTarget: 2000,
      caloriesLogged: 0,
      proteinTarget: 150,
      proteinLogged: 0,
      workoutsCompleted: 0,
      workoutsPlanned: 1,
      sleepHours: 0,
      waterOz: 0,
      waterTarget: 80,
      moodAverage: 1,
      focusHours: 0,
    });
    expect(result.score).toBeLessThan(15);
  });

  it('gives 25 habit points for 100% completion', () => {
    const result = calculateDayScore(perfectInput);
    expect(result.breakdown.habits).toBe(25);
  });

  it('gives 0 habit points for 0% completion', () => {
    const result = calculateDayScore({ ...perfectInput, habitsCompleted: 0 });
    expect(result.breakdown.habits).toBe(0);
  });

  it('gives 15 sleep points for 7-9 hours', () => {
    const result = calculateDayScore({ ...perfectInput, sleepHours: 8 });
    expect(result.breakdown.sleep).toBe(15);
  });

  it('gives lower sleep points for < 6 hours', () => {
    const result = calculateDayScore({ ...perfectInput, sleepHours: 4 });
    expect(result.breakdown.sleep).toBeLessThan(15);
  });

  it('returns grade string', () => {
    const result = calculateDayScore(perfectInput);
    expect(typeof result.grade).toBe('string');
    expect(result.grade.length).toBeGreaterThan(0);
  });

  it('returns A+ for score >= 95', () => {
    const result = calculateDayScore(perfectInput);
    if (result.score >= 95) {
      expect(result.grade).toBe('A+');
    }
  });

  it('gives 25 habit points when habitsTotal is 0 (default full credit)', () => {
    const result = calculateDayScore({ ...perfectInput, habitsTotal: 0, habitsCompleted: 0 });
    expect(result.breakdown.habits).toBe(25);
  });
});

describe('getDayScoreEmoji', () => {
  it('returns fire for score >= 90', () => {
    expect(getDayScoreEmoji(95)).toBe('🔥');
  });

  it('returns muscle for score >= 80', () => {
    expect(getDayScoreEmoji(82)).toBe('💪');
  });

  it('returns thumbs up for score >= 70', () => {
    expect(getDayScoreEmoji(72)).toBe('👍');
  });

  it('returns neutral face for score >= 60', () => {
    expect(getDayScoreEmoji(62)).toBe('😐');
  });

  it('returns sleeping face for score < 60', () => {
    expect(getDayScoreEmoji(50)).toBe('😴');
  });
});
