import {
  calculateMacroTargets,
  calculateMacroPercentages,
  calculateRemainingMacros,
  getMacroProgress,
  scaleFoodMacros,
} from '../../services/calculations/macros';

describe('calculateMacroTargets', () => {
  it('calculates macro targets for gaining with body weight (1g/lb protein)', () => {
    const result = calculateMacroTargets(3000, 'gain', 180);
    // protein = 180 * 1.0 = 180g
    expect(result.protein).toBe(180);
    expect(result.calories).toBe(3000);
    // Remaining calories: 3000 - (180*4) = 2280
    // carb ratio = 45 / (45+25) = 0.6429
    // fat ratio = 25 / (45+25) = 0.3571
    // carbs = round(2280 * 0.6429 / 4) = round(366.4) = 366
    // fat = round(2280 * 0.3571 / 9) = round(90.5) = 91
    expect(result.carbs).toBeGreaterThan(result.fat);
  });

  it('calculates macro targets for losing with body weight (1.2g/lb protein)', () => {
    const result = calculateMacroTargets(2000, 'lose', 180);
    // protein = 180 * 1.2 = 216g
    expect(result.protein).toBe(216);
    expect(result.calories).toBe(2000);
  });

  it('uses percentage-based protein when no body weight provided', () => {
    const result = calculateMacroTargets(2500, 'gain');
    // protein = round(2500 * 30 / 100 / 4) = round(187.5) = 188
    expect(result.protein).toBe(188);
  });

  it('uses correct ratios for maintain goal without body weight', () => {
    const result = calculateMacroTargets(2200, 'maintain');
    // protein = round(2200 * 30 / 100 / 4) = round(165) = 165
    expect(result.protein).toBe(165);
    expect(result.calories).toBe(2200);
  });

  it('splits remaining calories between carbs and fat proportionally', () => {
    const result = calculateMacroTargets(2500, 'gain', 170);
    // protein = 170, proteinCal = 680, remaining = 1820
    // carbRatio = 45/70 = 0.6429, fatRatio = 25/70 = 0.3571
    const carbCals = result.carbs * 4;
    const fatCals = result.fat * 9;
    // Carb calories should be roughly double fat calories for gain ratio
    expect(carbCals).toBeGreaterThan(fatCals);
  });

  it('returns all positive values', () => {
    const result = calculateMacroTargets(2500, 'maintain', 180);
    expect(result.calories).toBeGreaterThan(0);
    expect(result.protein).toBeGreaterThan(0);
    expect(result.carbs).toBeGreaterThan(0);
    expect(result.fat).toBeGreaterThan(0);
  });
});

describe('calculateMacroPercentages', () => {
  it('calculates correct percentages for typical macros', () => {
    // 200g protein = 800 cal, 250g carbs = 1000 cal, 80g fat = 720 cal
    // total = 2520 cal
    const result = calculateMacroPercentages(200, 250, 80);
    expect(result.protein).toBe(Math.round((800 / 2520) * 100)); // ~32
    expect(result.carbs).toBe(Math.round((1000 / 2520) * 100));  // ~40
    expect(result.fat).toBe(Math.round((720 / 2520) * 100));     // ~29
  });

  it('returns zeroes when all macros are zero', () => {
    const result = calculateMacroPercentages(0, 0, 0);
    expect(result).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });

  it('handles protein-only diet', () => {
    const result = calculateMacroPercentages(100, 0, 0);
    expect(result.protein).toBe(100);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
  });

  it('percentages sum to approximately 100', () => {
    const result = calculateMacroPercentages(180, 300, 70);
    const sum = result.protein + result.carbs + result.fat;
    // Due to rounding, sum may be 99-101
    expect(sum).toBeGreaterThanOrEqual(98);
    expect(sum).toBeLessThanOrEqual(102);
  });
});

describe('calculateRemainingMacros', () => {
  it('calculates remaining macros correctly', () => {
    const targets = { calories: 2500, protein: 180, carbs: 300, fat: 80 };
    const consumed = { calories: 1500, protein: 100, carbs: 200, fat: 50 };
    const result = calculateRemainingMacros(targets, consumed);
    expect(result).toEqual({
      calories: 1000,
      protein: 80,
      carbs: 100,
      fat: 30,
    });
  });

  it('does not return negative values when over-consumed', () => {
    const targets = { calories: 2000, protein: 150, carbs: 200, fat: 60 };
    const consumed = { calories: 2500, protein: 200, carbs: 250, fat: 80 };
    const result = calculateRemainingMacros(targets, consumed);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
  });

  it('returns full targets when nothing consumed', () => {
    const targets = { calories: 2500, protein: 180, carbs: 300, fat: 80 };
    const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    expect(calculateRemainingMacros(targets, consumed)).toEqual(targets);
  });
});

describe('getMacroProgress', () => {
  it('returns percentage progress', () => {
    expect(getMacroProgress(200, 100)).toBe(50);
  });

  it('caps progress at 100%', () => {
    expect(getMacroProgress(100, 150)).toBe(100);
  });

  it('returns 0 when target is zero', () => {
    expect(getMacroProgress(0, 50)).toBe(0);
  });

  it('returns 0 when nothing consumed', () => {
    expect(getMacroProgress(200, 0)).toBe(0);
  });

  it('returns 0 for negative target', () => {
    expect(getMacroProgress(-10, 50)).toBe(0);
  });
});

describe('scaleFoodMacros', () => {
  const baseMacros = { calories: 200, protein: 20, carbs: 30, fat: 8 };

  it('scales macros by quantity 1 (no change)', () => {
    const result = scaleFoodMacros(baseMacros, 1);
    expect(result.calories).toBe(200);
    expect(result.protein).toBe(20);
    expect(result.carbs).toBe(30);
    expect(result.fat).toBe(8);
  });

  it('scales macros by quantity 2', () => {
    const result = scaleFoodMacros(baseMacros, 2);
    expect(result.calories).toBe(400);
    expect(result.protein).toBe(40);
    expect(result.carbs).toBe(60);
    expect(result.fat).toBe(16);
  });

  it('scales macros by fractional quantity 0.5', () => {
    const result = scaleFoodMacros(baseMacros, 0.5);
    expect(result.calories).toBe(100);
    expect(result.protein).toBe(10);
    expect(result.carbs).toBe(15);
    expect(result.fat).toBe(4);
  });

  it('rounds calories to integers and macros to one decimal', () => {
    const base = { calories: 155, protein: 12.3, carbs: 18.7, fat: 5.3 };
    const result = scaleFoodMacros(base, 1.5);
    expect(Number.isInteger(result.calories)).toBe(true);
    // protein, carbs, fat should have at most 1 decimal place
    expect(result.protein).toBe(Math.round(12.3 * 1.5 * 10) / 10);
    expect(result.carbs).toBe(Math.round(18.7 * 1.5 * 10) / 10);
    expect(result.fat).toBe(Math.round(5.3 * 1.5 * 10) / 10);
  });

  it('returns zeroes when quantity is 0', () => {
    const result = scaleFoodMacros(baseMacros, 0);
    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
