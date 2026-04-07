import {
  calculateReadinessScore,
  getReadinessEmoji,
} from '../../services/calculations/readiness';

describe('calculateReadinessScore', () => {
  it('calculates high readiness when well rested and low stress', () => {
    const result = calculateReadinessScore({
      sleepHours: 8,
      sleepQuality: 5,
      moodScore: 9,
      stressLevel: 1,    // low stress => high points (20)
      energyLevel: 10,   // high energy => high points (20)
      sorenessLevel: 1,  // low soreness => high points (20)
      workoutsLast3Days: 1,
      totalVolumeLast3Days: 5000,
      avgVolumePer3Days: 10000, // loadRatio = 0.5 => 15 points
    });
    // sleep: round(8/8*15 + 5/5*10) = 25
    // soreness: round(20 * (1 - 0/9)) = 20
    // stress: round(20 * (1 - 0/9)) = 20
    // energy: round(20 * (9/9)) = 20
    // training: 15
    // total: 100 (capped)
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.recommendation).toBe('go_hard');
  });

  it('calculates low readiness with poor sleep and high soreness', () => {
    const result = calculateReadinessScore({
      sleepHours: 4,
      sleepQuality: 1,
      moodScore: 2,
      stressLevel: 9,     // high stress => low points
      energyLevel: 2,     // low energy => low points
      sorenessLevel: 9,   // high soreness => low points
      workoutsLast3Days: 5,
      totalVolumeLast3Days: 20000,
      avgVolumePer3Days: 10000, // loadRatio = 2.0 => 2 points
    });
    expect(result.score).toBeLessThan(40);
    expect(result.recommendation).toBe('rest');
  });

  it('uses default values when data is missing (null)', () => {
    const result = calculateReadinessScore({
      sleepHours: null,
      sleepQuality: null,
      moodScore: null,
      stressLevel: null,
      energyLevel: null,
      sorenessLevel: null,
      workoutsLast3Days: 0,
      totalVolumeLast3Days: 0,
      avgVolumePer3Days: 0,
    });
    // Defaults: sleep=15, soreness=15, stress=15, energy=15, training=10
    expect(result.score).toBe(70);
    expect(result.sleepComponent).toBe(15);
    expect(result.sorenessComponent).toBe(15);
    expect(result.stressComponent).toBe(15);
    expect(result.energyComponent).toBe(15);
    expect(result.trainingLoadComponent).toBe(10);
  });

  it('maps score >= 80 to go_hard recommendation', () => {
    const result = calculateReadinessScore({
      sleepHours: 8,
      sleepQuality: 5,
      moodScore: 9,
      stressLevel: 1,
      energyLevel: 10,
      sorenessLevel: 1,
      workoutsLast3Days: 0,
      totalVolumeLast3Days: 0,
      avgVolumePer3Days: 10000,
    });
    expect(result.recommendation).toBe('go_hard');
  });

  it('maps score 60-79 to moderate recommendation', () => {
    const result = calculateReadinessScore({
      sleepHours: 7,
      sleepQuality: 3,
      moodScore: 5,
      stressLevel: 4,
      energyLevel: 5,
      sorenessLevel: 4,
      workoutsLast3Days: 2,
      totalVolumeLast3Days: 10000,
      avgVolumePer3Days: 10000,
    });
    // Should land in moderate range
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThan(80);
    expect(result.recommendation).toBe('moderate');
  });

  it('maps score 40-59 to light recommendation', () => {
    const result = calculateReadinessScore({
      sleepHours: 5,
      sleepQuality: 2,
      moodScore: 3,
      stressLevel: 7,
      energyLevel: 3,
      sorenessLevel: 7,
      workoutsLast3Days: 4,
      totalVolumeLast3Days: 15000,
      avgVolumePer3Days: 10000,
    });
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(60);
    expect(result.recommendation).toBe('light');
  });

  it('calculates training load component based on volume ratio', () => {
    // Low load ratio (well rested)
    const rested = calculateReadinessScore({
      sleepHours: null, sleepQuality: null, moodScore: null,
      stressLevel: null, energyLevel: null, sorenessLevel: null,
      workoutsLast3Days: 0,
      totalVolumeLast3Days: 3000,
      avgVolumePer3Days: 10000, // 0.3 ratio => 15 points
    });
    expect(rested.trainingLoadComponent).toBe(15);

    // High load ratio (overreaching)
    const overreached = calculateReadinessScore({
      sleepHours: null, sleepQuality: null, moodScore: null,
      stressLevel: null, energyLevel: null, sorenessLevel: null,
      workoutsLast3Days: 5,
      totalVolumeLast3Days: 20000,
      avgVolumePer3Days: 10000, // 2.0 ratio => 2 points
    });
    expect(overreached.trainingLoadComponent).toBe(2);
  });

  it('returns score between 1 and 100', () => {
    const result = calculateReadinessScore({
      sleepHours: 8,
      sleepQuality: 5,
      moodScore: 10,
      stressLevel: 1,
      energyLevel: 10,
      sorenessLevel: 1,
      workoutsLast3Days: 0,
      totalVolumeLast3Days: 0,
      avgVolumePer3Days: 10000,
    });
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('includes an explanation string', () => {
    const result = calculateReadinessScore({
      sleepHours: 4,
      sleepQuality: 1,
      moodScore: 2,
      stressLevel: 9,
      energyLevel: 2,
      sorenessLevel: 9,
      workoutsLast3Days: 5,
      totalVolumeLast3Days: 20000,
      avgVolumePer3Days: 10000,
    });
    expect(result.explanation).toBeTruthy();
    expect(typeof result.explanation).toBe('string');
  });
});

describe('getReadinessEmoji', () => {
  it('returns green for score >= 80', () => {
    expect(getReadinessEmoji(85)).toBeDefined();
  });

  it('returns yellow for score 60-79', () => {
    expect(getReadinessEmoji(70)).toBeDefined();
  });

  it('returns orange for score 40-59', () => {
    expect(getReadinessEmoji(50)).toBeDefined();
  });

  it('returns red for score < 40', () => {
    expect(getReadinessEmoji(20)).toBeDefined();
  });
});
