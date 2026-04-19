import {
  calculateMacroTargets,
  calculateMacroPercentages,
  calculateRemainingMacros,
  getMacroProgress,
  scaleFoodMacros,
} from '../../../services/calculations/macros';

describe('calculateMacroTargets', () => {
  it('calculates maintain macros from calories with no body weight', () => {
    const result = calculateMacroTargets(2000, 'maintain');
    expect(result.calories).toBe(2000);
    // protein = 30% / 4 cal per gram
    expect(result.protein).toBe(Math.round((2000 * 30) / 100 / 4));
    expect(result.carbs).toBeGreaterThan(0);
    expect(result.fat).toBeGreaterThan(0);
  });

  it('uses body weight for protein when provided (gain: 1g/lb)', () => {
    const result = calculateMacroTargets(3000, 'gain', 180);
    expect(result.protein).toBe(Math.round(180 * 1.0));
  });

  it('uses body weight for protein when provided (lose: 1.2g/lb)', () => {
    const result = calculateMacroTargets(2000, 'lose', 160);
    expect(result.protein).toBe(Math.round(160 * 1.2));
  });

  it('calories field in result equals input calories', () => {
    const result = calculateMacroTargets(2500, 'lose');
    expect(result.calories).toBe(2500);
  });
});

describe('calculateMacroPercentages', () => {
  it('returns percentages that sum close to 100', () => {
    const result = calculateMacroPercentages(150, 200, 70);
    expect(result.protein + result.carbs + result.fat).toBeGreaterThan(95);
    expect(result.protein + result.carbs + result.fat).toBeLessThanOrEqual(105);
  });

  it('returns zeros when total calories is zero', () => {
    const result = calculateMacroPercentages(0, 0, 0);
    expect(result).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });

  it('calculates fat calories at 9 cal/g (higher % for same grams)', () => {
    // 100g protein (400cal) + 0 carbs + 0 fat → protein 100%
    const result = calculateMacroPercentages(100, 0, 0);
    expect(result.protein).toBe(100);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
  });
});

describe('calculateRemainingMacros', () => {
  it('returns zero when consumed equals target', () => {
    const targets = { calories: 2000, protein: 150, carbs: 200, fat: 65 };
    const result = calculateRemainingMacros(targets, targets);
    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('clamps to 0 when consumed exceeds target', () => {
    const targets = { calories: 2000, protein: 100, carbs: 200, fat: 60 };
    const consumed = { calories: 2500, protein: 120, carbs: 250, fat: 70 };
    const result = calculateRemainingMacros(targets, consumed);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
  });

  it('subtracts consumed from targets', () => {
    const targets = { calories: 2000, protein: 150, carbs: 200, fat: 60 };
    const consumed = { calories: 800, protein: 60, carbs: 80, fat: 25 };
    const result = calculateRemainingMacros(targets, consumed);
    expect(result.calories).toBe(1200);
    expect(result.protein).toBe(90);
    expect(result.carbs).toBe(120);
    expect(result.fat).toBe(35);
  });
});

describe('getMacroProgress', () => {
  it('returns 0 when target is 0', () => {
    expect(getMacroProgress(0, 100)).toBe(0);
  });

  it('returns percentage of consumed vs target', () => {
    expect(getMacroProgress(200, 100)).toBe(50);
    expect(getMacroProgress(200, 200)).toBe(100);
  });

  it('caps at 100 even when over target', () => {
    expect(getMacroProgress(100, 150)).toBe(100);
  });
});

describe('scaleFoodMacros', () => {
  it('scales macros proportionally by quantity', () => {
    const base = { calories: 100, protein: 10, carbs: 15, fat: 5 };
    const result = scaleFoodMacros(base, 2);
    expect(result.calories).toBe(200);
    expect(result.protein).toBeCloseTo(20, 1);
    expect(result.carbs).toBeCloseTo(30, 1);
    expect(result.fat).toBeCloseTo(10, 1);
  });

  it('handles fractional quantities', () => {
    const base = { calories: 200, protein: 20, carbs: 30, fat: 8 };
    const result = scaleFoodMacros(base, 0.5);
    expect(result.calories).toBe(100);
    expect(result.protein).toBeCloseTo(10, 1);
  });
});
