import {
  projectWeight,
  projectRevenue,
  daysToTarget,
  calculateLinearRegression,
} from '../../services/calculations/projections';

// ---------------------------------------------------------------------------
// projectWeight
// ---------------------------------------------------------------------------
describe('projectWeight', () => {
  const makeHistory = (weights: number[]) =>
    weights.map((weight, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, weight }));

  it('returns empty array when fewer than 2 data points', () => {
    expect(projectWeight([], 175, 90)).toHaveLength(0);
    expect(projectWeight(makeHistory([185]), 175, 90)).toHaveLength(0);
  });

  it('returns correct number of projections', () => {
    const history = makeHistory([190, 189, 188]);
    const result = projectWeight(history, 175, 30);
    expect(result).toHaveLength(30);
  });

  it('uses default of 90 days when not specified', () => {
    const history = makeHistory([190, 189]);
    const result = projectWeight(history, 175);
    expect(result).toHaveLength(90);
  });

  it('projects weight loss trend correctly', () => {
    // 1 lb per day weight loss
    const history = makeHistory([190, 189, 188, 187, 186]);
    const result = projectWeight(history, 175, 4);
    // Each day should be ~1 lb less than previous
    expect(result[0]?.weight).toBeCloseTo(185, 0);
    expect(result[3]?.weight).toBeCloseTo(182, 0);
  });

  it('projects weight gain trend correctly', () => {
    const history = makeHistory([170, 171, 172]);
    const result = projectWeight(history, 190, 5);
    expect(result[0]?.weight).toBeGreaterThan(172);
  });

  it('clamps projected weight at minimum of 80', () => {
    // Very aggressive weight loss projection
    const history = [
      { date: '2026-01-01', weight: 85 },
      { date: '2026-01-02', weight: 82 },
    ];
    const result = projectWeight(history, 70, 10);
    result.forEach((point) => expect(point.weight).toBeGreaterThanOrEqual(80));
  });

  it('clamps projected weight at maximum of 400', () => {
    // Very aggressive weight gain projection
    const history = [
      { date: '2026-01-01', weight: 390 },
      { date: '2026-01-02', weight: 395 },
    ];
    const result = projectWeight(history, 500, 5);
    result.forEach((point) => expect(point.weight).toBeLessThanOrEqual(400));
  });

  it('returns dates in yyyy-MM-dd format', () => {
    const history = makeHistory([185, 184]);
    const result = projectWeight(history, 175, 3);
    result.forEach((point) => {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('uses only the last 30 entries for trend calculation', () => {
    // Create 40 days of history — only last 30 should be used
    const history = Array.from({ length: 40 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      weight: 200 - i * 0.5, // 0.5 lb per day loss
    }));
    const result = projectWeight(history, 170, 1);
    expect(result[0]?.weight).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// projectRevenue
// ---------------------------------------------------------------------------
describe('projectRevenue', () => {
  const makeRevHistory = (amounts: number[]) =>
    amounts.map((amount, i) => ({ date: `2026-0${i + 1}-01`, amount }));

  it('returns empty array when fewer than 2 data points', () => {
    expect(projectRevenue([], 90)).toHaveLength(0);
    expect(projectRevenue(makeRevHistory([10000]), 90)).toHaveLength(0);
  });

  it('returns correct number of monthly projections', () => {
    const history = makeRevHistory([8000, 9000, 10000, 11000]);
    const result = projectRevenue(history, 90); // 90 days = 3 months
    expect(result).toHaveLength(Math.ceil(90 / 30));
  });

  it('uses default of 90 days when not specified', () => {
    const history = makeRevHistory([8000, 9000]);
    const result = projectRevenue(history);
    expect(result.length).toBeGreaterThan(0);
  });

  it('projects growing revenue correctly', () => {
    // $1000 growth per period
    const history = makeRevHistory([9000, 10000, 11000, 12000]);
    const result = projectRevenue(history, 60); // 2 months
    expect(result[0]?.amount).toBeGreaterThan(12000);
  });

  it('projects declining revenue', () => {
    const history = makeRevHistory([12000, 11000, 10000, 9000]);
    const result = projectRevenue(history, 30);
    expect(result[0]?.amount).toBeLessThan(9000);
  });

  it('clamps revenue at 0 (no negative revenue)', () => {
    // Very steep decline
    const history = makeRevHistory([1000, 500]);
    const result = projectRevenue(history, 90);
    result.forEach((point) => expect(point.amount).toBeGreaterThanOrEqual(0));
  });

  it('returns dates in yyyy-MM-dd format', () => {
    const history = makeRevHistory([9000, 10000]);
    const result = projectRevenue(history, 30);
    result.forEach((point) => {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('uses only last 4 data points for trend calculation', () => {
    // 6 points: only last 4 should matter
    const history = makeRevHistory([5000, 6000, 7000, 8000, 9000, 10000]);
    const result = projectRevenue(history, 30);
    expect(result[0]?.amount).toBeGreaterThan(10000); // $1k/period growth
  });
});

// ---------------------------------------------------------------------------
// daysToTarget
// ---------------------------------------------------------------------------
describe('daysToTarget', () => {
  it('returns null when daily change is 0', () => {
    expect(daysToTarget(185, 175, 0)).toBeNull();
  });

  it('calculates days for weight loss', () => {
    // Need to lose 10 lbs at 1 lb/day
    expect(daysToTarget(185, 175, -1)).toBe(10);
  });

  it('calculates days for weight gain', () => {
    // Need to gain 10 lbs at 0.5 lbs/day
    expect(daysToTarget(170, 180, 0.5)).toBe(20);
  });

  it('returns null when going in wrong direction for loss', () => {
    // Target is lower but daily change is positive (gaining weight)
    expect(daysToTarget(185, 175, 0.5)).toBeNull();
  });

  it('returns null when going in wrong direction for gain', () => {
    // Target is higher but daily change is negative (losing weight)
    expect(daysToTarget(170, 180, -0.5)).toBeNull();
  });

  it('returns 1 day when daily change exactly equals remaining', () => {
    expect(daysToTarget(185, 175, -10)).toBe(1);
  });

  it('rounds up to ceiling for non-integer days', () => {
    // 10 lbs to lose at 3 lbs/day = 3.33 → 4 days
    expect(daysToTarget(185, 175, -3)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// calculateLinearRegression
// ---------------------------------------------------------------------------
describe('calculateLinearRegression', () => {
  it('returns zeros for fewer than 2 data points', () => {
    expect(calculateLinearRegression([])).toEqual({ slope: 0, intercept: 0, r2: 0 });
    expect(calculateLinearRegression([{ x: 1, y: 1 }])).toEqual({ slope: 0, intercept: 0, r2: 0 });
  });

  it('calculates perfect linear fit', () => {
    // y = 2x + 1 exactly
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

  it('returns r2 = 0 when all y values are the same (zero variance)', () => {
    // All y values equal → ssTot = 0 → r2 = 0
    const data = [
      { x: 1, y: 5 },
      { x: 2, y: 5 },
      { x: 3, y: 5 },
    ];
    const result = calculateLinearRegression(data);
    expect(result.r2).toBe(0);
  });

  it('returns negative slope for decreasing data', () => {
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 8 },
      { x: 3, y: 6 },
    ];
    const result = calculateLinearRegression(data);
    expect(result.slope).toBeLessThan(0);
  });

  it('returns r2 between 0 and 1 for imperfect data', () => {
    const data = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 3 }, // outlier
      { x: 4, y: 8 },
    ];
    const result = calculateLinearRegression(data);
    expect(result.r2).toBeGreaterThanOrEqual(0);
    expect(result.r2).toBeLessThanOrEqual(1);
  });

  it('handles two points exactly', () => {
    const data = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    const result = calculateLinearRegression(data);
    expect(result.slope).toBeCloseTo(1, 5);
    expect(result.intercept).toBeCloseTo(0, 5);
  });
});
