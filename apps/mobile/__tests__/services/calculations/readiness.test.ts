import {
  calculateReadinessScore,
  getReadinessEmoji,
} from '../../../services/calculations/readiness';

const fullInput = {
  sleepHours: 8,
  sleepQuality: 5,
  moodScore: 9,
  stressLevel: 2,
  energyLevel: 9,
  sorenessLevel: 1,
  workoutsLast3Days: 1,
  totalVolumeLast3Days: 5000,
  avgVolumePer3Days: 6000,
};

describe('calculateReadinessScore', () => {
  it('returns score in 1-100 range', () => {
    const result = calculateReadinessScore(fullInput);
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('returns go_hard recommendation for high score', () => {
    const result = calculateReadinessScore(fullInput);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.recommendation).toBe('go_hard');
  });

  it('returns rest recommendation for low score', () => {
    const result = calculateReadinessScore({
      sleepHours: 3,
      sleepQuality: 1,
      moodScore: 1,
      stressLevel: 10,
      energyLevel: 1,
      sorenessLevel: 10,
      workoutsLast3Days: 3,
      totalVolumeLast3Days: 20000,
      avgVolumePer3Days: 5000,
    });
    expect(result.score).toBeLessThan(40);
    expect(result.recommendation).toBe('rest');
  });

  it('uses defaults when all inputs are null', () => {
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
    // Default components: sleep=15, soreness=15, stress=15, energy=15, trainingLoad=10 → 70
    expect(result.score).toBe(70);
    expect(result.recommendation).toBe('moderate');
  });

  it('returns component breakdown summing to score', () => {
    const result = calculateReadinessScore(fullInput);
    const sum = result.sleepComponent + result.sorenessComponent + result.stressComponent +
      result.energyComponent + result.trainingLoadComponent;
    expect(result.score).toBe(Math.min(100, Math.max(1, sum)));
  });

  it('returns explanation string', () => {
    const result = calculateReadinessScore(fullInput);
    expect(typeof result.explanation).toBe('string');
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it('trainingLoadComponent is 15 when well rested (ratio <= 0.5)', () => {
    const result = calculateReadinessScore({
      ...fullInput,
      totalVolumeLast3Days: 1000,
      avgVolumePer3Days: 5000,
    });
    expect(result.trainingLoadComponent).toBe(15);
  });
});

describe('getReadinessEmoji', () => {
  it('returns green circle for score >= 80', () => {
    expect(getReadinessEmoji(85)).toBe('🟢');
  });

  it('returns yellow circle for score 60-79', () => {
    expect(getReadinessEmoji(65)).toBe('🟡');
  });

  it('returns orange circle for score 40-59', () => {
    expect(getReadinessEmoji(50)).toBe('🟠');
  });

  it('returns red circle for score < 40', () => {
    expect(getReadinessEmoji(30)).toBe('🔴');
  });
});
