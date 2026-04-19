import {
  calculateDayScore,
  getDayScoreEmoji,
} from '../../services/calculations/dayScore';

describe('calculateDayScore', () => {
  const perfectDay = {
    habitsCompleted: 5,
    habitsTotal: 5,
    caloriesTarget: 2500,
    caloriesLogged: 2500,
    proteinTarget: 180,
    proteinLogged: 180,
    workoutsCompleted: 1,
    workoutsPlanned: 1,
    sleepHours: 8,
    waterOz: 100,
    waterTarget: 100,
    moodAverage: 10,
    focusHours: 4,
  };

  it('scores a perfect day close to 100', () => {
    const result = calculateDayScore(perfectDay);
    // habits: 25, nutrition: 20, training: 20, sleep: 15, hydration: 10, mood: 5, focus: 5
    expect(result.score).toBe(100);
    expect(result.grade).toBe('A+');
  });

  it('scores a terrible day very low', () => {
    const result = calculateDayScore({
      habitsCompleted: 0,
      habitsTotal: 5,
      caloriesTarget: 2500,
      caloriesLogged: 0,
      proteinTarget: 180,
      proteinLogged: 0,
      workoutsCompleted: 0,
      workoutsPlanned: 1,
      sleepHours: 3,
      waterOz: 0,
      waterTarget: 100,
      moodAverage: 1,
      focusHours: 0,
    });
    expect(result.score).toBeLessThan(30);
    expect(result.grade).toBe('F');
  });

  it('calculates partial completion correctly', () => {
    const result = calculateDayScore({
      habitsCompleted: 3,
      habitsTotal: 5,
      caloriesTarget: 2500,
      caloriesLogged: 2200,
      proteinTarget: 180,
      proteinLogged: 150,
      workoutsCompleted: 1,
      workoutsPlanned: 1,
      sleepHours: 7,
      waterOz: 80,
      waterTarget: 100,
      moodAverage: 7,
      focusHours: 2,
    });
    expect(result.score).toBeGreaterThan(50);
    expect(result.score).toBeLessThan(100);
  });

  it('assigns grade A for score 90-94', () => {
    const result = calculateDayScore({
      ...perfectDay,
      habitsCompleted: 4,
      habitsTotal: 5,
      focusHours: 3,
    });
    // Lose some habit and focus points
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.score).toBeLessThan(95);
    expect(result.grade).toBe('A');
  });

  it('assigns grade B for score 80-84', () => {
    const result = calculateDayScore({
      ...perfectDay,
      habitsCompleted: 3,
      habitsTotal: 5,
      proteinLogged: 140,
      focusHours: 2,
    });
    expect(['B', 'B+']).toContain(result.grade);
  });

  it('handles missing sleep data with default score', () => {
    const result = calculateDayScore({
      ...perfectDay,
      sleepHours: null,
    });
    // Sleep defaults to 10 instead of 15
    expect(result.breakdown.sleep).toBe(10);
    expect(result.score).toBe(95);
  });

  it('assigns sleep score 10 for borderline adequate sleep (6-6.9 hours)', () => {
    // sleepHours >= 6 but < 7: else if branch → sleepScore = 10
    const result = calculateDayScore({
      ...perfectDay,
      sleepHours: 6.5,
    });
    expect(result.breakdown.sleep).toBe(10);
  });

  it('assigns sleep score below 10 for under 6 hours sleep', () => {
    // sleepHours < 6: else branch → sleepScore = round(15 * sleepHours/7)
    const result = calculateDayScore({
      ...perfectDay,
      sleepHours: 4,
    });
    // 15 * (4/7) = 8.57 → 9
    expect(result.breakdown.sleep).toBe(9);
  });

  it('handles missing mood data with default score', () => {
    const result = calculateDayScore({
      ...perfectDay,
      moodAverage: null,
    });
    // Mood defaults to 3 instead of 5
    expect(result.breakdown.mood).toBe(3);
  });

  it('gives full training credit when no plan but workout completed', () => {
    const result = calculateDayScore({
      ...perfectDay,
      workoutsPlanned: 0,
      workoutsCompleted: 1,
    });
    expect(result.breakdown.training).toBe(20);
  });

  it('gives partial training credit on rest day (no plan, no workout)', () => {
    const result = calculateDayScore({
      ...perfectDay,
      workoutsPlanned: 0,
      workoutsCompleted: 0,
    });
    expect(result.breakdown.training).toBe(10);
  });

  it('gives full habits score when no habits are tracked', () => {
    const result = calculateDayScore({
      ...perfectDay,
      habitsCompleted: 0,
      habitsTotal: 0,
    });
    // habitsTotal = 0 returns 25 (full credit)
    expect(result.breakdown.habits).toBe(25);
  });

  it('penalizes calorie inaccuracy (both over and under)', () => {
    const under = calculateDayScore({
      ...perfectDay,
      caloriesLogged: 1500, // 1000 under
    });
    const over = calculateDayScore({
      ...perfectDay,
      caloriesLogged: 3500, // 1000 over
    });
    // Both should lose nutrition points
    expect(under.breakdown.nutrition).toBeLessThan(20);
    expect(over.breakdown.nutrition).toBeLessThan(20);
  });

  it('caps focus score at 5 points', () => {
    const result = calculateDayScore({
      ...perfectDay,
      focusHours: 10, // Way more than needed
    });
    expect(result.breakdown.focus).toBe(5);
  });

  it('returns score between 0 and 100', () => {
    const result = calculateDayScore(perfectDay);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('uses 0 calorie accuracy when caloriesTarget is 0', () => {
    const result = calculateDayScore({
      ...perfectDay,
      caloriesTarget: 0,
      caloriesLogged: 2500,
    });
    // calorieAccuracy = 0 → calorie portion = 0; protein portion still full
    expect(result.breakdown.nutrition).toBeLessThan(20);
  });

  it('uses 0 protein ratio when proteinTarget is 0', () => {
    const result = calculateDayScore({
      ...perfectDay,
      proteinTarget: 0,
      proteinLogged: 180,
    });
    // proteinRatio = 0 → protein portion = 0; calorie portion still full
    expect(result.breakdown.nutrition).toBeLessThan(20);
  });

  it('uses default hydration score of 5 when waterTarget is 0', () => {
    const result = calculateDayScore({
      ...perfectDay,
      waterTarget: 0,
      waterOz: 0,
    });
    expect(result.breakdown.hydration).toBe(5);
  });

  it('assigns grade C+ for score 75-79', () => {
    // habits:10 nutrition:16 training:20 sleep:15 hydration:8 mood:3 focus:4 = 76
    const result = calculateDayScore({
      habitsCompleted: 2,
      habitsTotal: 5,
      caloriesTarget: 2500,
      caloriesLogged: 2000,
      proteinTarget: 180,
      proteinLogged: 150,
      workoutsCompleted: 1,
      workoutsPlanned: 1,
      sleepHours: 8,
      waterOz: 80,
      waterTarget: 100,
      moodAverage: 7,
      focusHours: 3,
    });
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.score).toBeLessThan(80);
    expect(result.grade).toBe('C+');
  });

  it('assigns grade C for score 70-74', () => {
    // habits:10 nutrition:11 training:20 sleep:15 hydration:8 mood:3 focus:4 = 71
    const result = calculateDayScore({
      habitsCompleted: 2,
      habitsTotal: 5,
      caloriesTarget: 2500,
      caloriesLogged: 1250,
      proteinTarget: 180,
      proteinLogged: 108,
      workoutsCompleted: 1,
      workoutsPlanned: 1,
      sleepHours: 8,
      waterOz: 80,
      waterTarget: 100,
      moodAverage: 7,
      focusHours: 3,
    });
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThan(75);
    expect(result.grade).toBe('C');
  });

  it('assigns grade D+ for score 65-69', () => {
    // habits:15 nutrition:11 training:10 sleep:15 hydration:8 mood:3 focus:4 = 66
    const result = calculateDayScore({
      habitsCompleted: 3,
      habitsTotal: 5,
      caloriesTarget: 2500,
      caloriesLogged: 1250,
      proteinTarget: 180,
      proteinLogged: 108,
      workoutsCompleted: 1,
      workoutsPlanned: 2,
      sleepHours: 8,
      waterOz: 80,
      waterTarget: 100,
      moodAverage: 7,
      focusHours: 3,
    });
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.score).toBeLessThan(70);
    expect(result.grade).toBe('D+');
  });

  it('assigns grade D for score 60-64', () => {
    // habits:15 nutrition:11 training:10 sleep:15 hydration:3 mood:3 focus:4 = 61
    const result = calculateDayScore({
      habitsCompleted: 3,
      habitsTotal: 5,
      caloriesTarget: 2500,
      caloriesLogged: 1250,
      proteinTarget: 180,
      proteinLogged: 108,
      workoutsCompleted: 1,
      workoutsPlanned: 2,
      sleepHours: 8,
      waterOz: 30,
      waterTarget: 100,
      moodAverage: 7,
      focusHours: 3,
    });
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThan(65);
    expect(result.grade).toBe('D');
  });
});

describe('getDayScoreEmoji', () => {
  it('returns defined emoji for various score ranges', () => {
    expect(getDayScoreEmoji(95)).toBeDefined();
    expect(getDayScoreEmoji(85)).toBeDefined();
    expect(getDayScoreEmoji(75)).toBeDefined();
    expect(getDayScoreEmoji(65)).toBeDefined();
    expect(getDayScoreEmoji(50)).toBeDefined();
  });
});
