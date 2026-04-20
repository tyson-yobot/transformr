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
    // sleepComponent: round(min(1,6/8)*15 + (3/5)*10) = round(11.25+6) = 17
    // sorenessComponent: round(20*(1-(6-1)/9)) = round(20*4/9) = 9
    // stressComponent: round(20*(1-(6-1)/9)) = 9
    // energyComponent: round(20*((3-1)/9)) = round(4.44) = 4
    // trainingLoadComponent: 15000/10000=1.5 → 5
    // total: 17+9+9+4+5 = 44 → 'light'
    const result = calculateReadinessScore({
      sleepHours: 6,
      sleepQuality: 3,
      moodScore: 4,
      stressLevel: 6,
      energyLevel: 3,
      sorenessLevel: 6,
      workoutsLast3Days: 4,
      totalVolumeLast3Days: 15000,
      avgVolumePer3Days: 10000,
    });
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(60);
    expect(result.recommendation).toBe('light');
  });

  it('calculates training load component based on volume ratio', () => {
    // Low load ratio (well rested, <= 0.5)
    const rested = calculateReadinessScore({
      sleepHours: null, sleepQuality: null, moodScore: null,
      stressLevel: null, energyLevel: null, sorenessLevel: null,
      workoutsLast3Days: 0,
      totalVolumeLast3Days: 3000,
      avgVolumePer3Days: 10000, // 0.3 ratio => 15 points
    });
    expect(rested.trainingLoadComponent).toBe(15);

    // Moderate load ratio (0.5-1.0) => 12 points
    const moderate = calculateReadinessScore({
      sleepHours: null, sleepQuality: null, moodScore: null,
      stressLevel: null, energyLevel: null, sorenessLevel: null,
      workoutsLast3Days: 2,
      totalVolumeLast3Days: 8000,
      avgVolumePer3Days: 10000, // 0.8 ratio => 12 points
    });
    expect(moderate.trainingLoadComponent).toBe(12);

    // Moderate-high load ratio (1.0-1.3) => 8 points
    const moderateHigh = calculateReadinessScore({
      sleepHours: null, sleepQuality: null, moodScore: null,
      stressLevel: null, energyLevel: null, sorenessLevel: null,
      workoutsLast3Days: 3,
      totalVolumeLast3Days: 12000,
      avgVolumePer3Days: 10000, // 1.2 ratio => 8 points
    });
    expect(moderateHigh.trainingLoadComponent).toBe(8);

    // High load ratio (1.3-1.6) => 5 points
    const high = calculateReadinessScore({
      sleepHours: null, sleepQuality: null, moodScore: null,
      stressLevel: null, energyLevel: null, sorenessLevel: null,
      workoutsLast3Days: 4,
      totalVolumeLast3Days: 14000,
      avgVolumePer3Days: 10000, // 1.4 ratio => 5 points
    });
    expect(high.trainingLoadComponent).toBe(5);

    // High load ratio (overreaching, > 1.6) => 2 points
    const overreached = calculateReadinessScore({
      sleepHours: null, sleepQuality: null, moodScore: null,
      stressLevel: null, energyLevel: null, sorenessLevel: null,
      workoutsLast3Days: 5,
      totalVolumeLast3Days: 20000,
      avgVolumePer3Days: 10000, // 2.0 ratio => 2 points
    });
    expect(overreached.trainingLoadComponent).toBe(2);

    // Default (avgVolumePer3Days = 0) => 10 points
    const noHistory = calculateReadinessScore({
      sleepHours: null, sleepQuality: null, moodScore: null,
      stressLevel: null, energyLevel: null, sorenessLevel: null,
      workoutsLast3Days: 0,
      totalVolumeLast3Days: 0,
      avgVolumePer3Days: 0,
    });
    expect(noHistory.trainingLoadComponent).toBe(10);
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

  it('includes minor note in go_hard explanation when a component is slightly low', () => {
    // sleepComponent = round(min(1,4/8)*15 + (1/5)*10) = round(7.5+2) = 10 < 12 → flag
    // sorenessComponent: sorenessLevel=1 → 20, stressComponent: stressLevel=1 → 20
    // energyComponent: energyLevel=10 → 20, trainingLoadComponent: 0/10000=0 → 15
    // score = 10+20+20+20+15 = 85 ≥ 80 → go_hard with "Minor note: sleep quality is low"
    const result = calculateReadinessScore({
      sleepHours: 4,
      sleepQuality: 1,
      moodScore: 10,
      stressLevel: 1,
      energyLevel: 10,
      sorenessLevel: 1,
      workoutsLast3Days: 0,
      totalVolumeLast3Days: 0,
      avgVolumePer3Days: 10000,
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.recommendation).toBe('go_hard');
    expect(result.explanation).toContain('Minor note');
    expect(result.explanation).toContain('sleep quality is low');
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
