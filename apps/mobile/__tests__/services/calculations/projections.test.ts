import {
  projectWeight,
  projectRevenue,
  daysToTarget,
  calculateLinearRegression,
} from '../../../services/calculations/projections';

describe('projectWeight', () => {
  it('returns empty array with fewer than 2 data points', () => {
    expect(projectWeight([], 170, 30)).toEqual([]);
    expect(projectWeight([{ date: '2026-01-01', weight: 180 }], 170, 30)).toEqual([]);
  });

  it('returns daysToProject data points', () => {
    const history = [
      { date: '2026-01-01', weight: 200 },
      { date: '2026-02-01', weight: 198 },
    ];
    const result = projectWeight(history, 180, 30);
    expect(result).toHaveLength(30);
  });

  it('each projection has date and weight fields', () => {
    const history = [
      { date: '2026-01-01', weight: 200 },
      { date: '2026-02-01', weight: 195 },
    ];
    const result = projectWeight(history, 180, 5);
    for (const point of result) {
      expect(typeof point.date).toBe('string');
      expect(typeof point.weight).toBe('number');
    }
  });

  it('clamps weight to 80-400 range', () => {
    // Unrealistically fast loss — weight should clamp to 80
    const history = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      weight: 100 - i * 5,
    }));
    const result = projectWeight(history, 50, 90);
    for (const point of result) {
      expect(point.weight).toBeGreaterThanOrEqual(80);
      expect(point.weight).toBeLessThanOrEqual(400);
    }
  });
});

describe('projectRevenue', () => {
  it('returns empty array with fewer than 2 data points', () => {
    expect(projectRevenue([], 30)).toEqual([]);
    expect(projectRevenue([{ date: '2026-01-01', amount: 1000 }], 30)).toEqual([]);
  });

  it('returns projected monthly data points', () => {
    const history = [
      { date: '2026-01-01', amount: 10000 },
      { date: '2026-02-01', amount: 11000 },
      { date: '2026-03-01', amount: 12000 },
    ];
    const result = projectRevenue(history, 90);
    expect(result.length).toBeGreaterThan(0);
    for (const point of result) {
      expect(point.amount).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('daysToTarget', () => {
  it('returns null when dailyChange is 0', () => {
    expect(daysToTarget(180, 170, 0)).toBeNull();
  });

  it('returns null when going wrong direction', () => {
    // Trying to lose weight but gaining
    expect(daysToTarget(180, 170, 0.5)).toBeNull();
    // Trying to gain but losing
    expect(daysToTarget(160, 180, -0.5)).toBeNull();
  });

  it('returns ceiling of days needed', () => {
    // Need to lose 10 lbs at 0.5/day = 20 days
    expect(daysToTarget(180, 170, -0.5)).toBe(20);
  });

  it('rounds up partial days', () => {
    expect(daysToTarget(180, 177, -2)).toBe(2); // 3/2 = 1.5 → ceil = 2
  });
});

describe('calculateLinearRegression', () => {
  it('returns zeros for fewer than 2 points', () => {
    expect(calculateLinearRegression([])).toEqual({ slope: 0, intercept: 0, r2: 0 });
    expect(calculateLinearRegression([{ x: 1, y: 2 }])).toEqual({ slope: 0, intercept: 0, r2: 0 });
  });

  it('fits a perfect line with r2 = 1', () => {
    // y = 2x + 1
    const data = [
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
      { x: 4, y: 9 },
    ];
    const result = calculateLinearRegression(data);
    expect(result.slope).toBeCloseTo(2, 5);
    expect(result.intercept).toBeCloseTo(1, 5);
    expect(result.r2).toBeCloseTo(1, 5);
  });

  it('returns r2 between 0 and 1 for noisy data', () => {
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 5 },
      { x: 3, y: 15 },
      { x: 4, y: 8 },
    ];
    const result = calculateLinearRegression(data);
    expect(result.r2).toBeGreaterThanOrEqual(0);
    expect(result.r2).toBeLessThanOrEqual(1);
  });
});
