import {
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateAge,
  getActivityLevelLabel,
} from '../../services/calculations/bmr';

describe('calculateBMR', () => {
  it('calculates BMR for a male correctly using Mifflin-St Jeor', () => {
    // 180 lbs, 70 inches, 30 years old, male
    // weightKg = 180 * 0.453592 = 81.64656
    // heightCm = 70 * 2.54 = 177.8
    // BMR = 10 * 81.64656 + 6.25 * 177.8 - 5 * 30 + 5
    // BMR = 816.4656 + 1111.25 - 150 + 5 = 1782.7156
    const bmr = calculateBMR(180, 70, 30, 'male');
    expect(bmr).toBeCloseTo(1782.72, 0);
  });

  it('calculates BMR for a female correctly using Mifflin-St Jeor', () => {
    // 140 lbs, 64 inches, 25 years old, female
    // weightKg = 140 * 0.453592 = 63.50288
    // heightCm = 64 * 2.54 = 162.56
    // BMR = 10 * 63.50288 + 6.25 * 162.56 - 5 * 25 - 161
    // BMR = 635.0288 + 1016.0 - 125 - 161 = 1365.0288
    const bmr = calculateBMR(140, 64, 25, 'female');
    expect(bmr).toBeCloseTo(1365.03, 0);
  });

  it('uses female formula for gender "other"', () => {
    const bmrOther = calculateBMR(160, 68, 28, 'other');
    const bmrFemale = calculateBMR(160, 68, 28, 'female');
    expect(bmrOther).toBe(bmrFemale);
  });

  it('uses female formula for gender "prefer_not_to_say"', () => {
    const bmrPnts = calculateBMR(160, 68, 28, 'prefer_not_to_say');
    const bmrFemale = calculateBMR(160, 68, 28, 'female');
    expect(bmrPnts).toBe(bmrFemale);
  });

  it('produces higher BMR for males than females with same stats', () => {
    const maleBmr = calculateBMR(170, 68, 30, 'male');
    const femaleBmr = calculateBMR(170, 68, 30, 'female');
    // Male formula adds +5, female subtracts -161, diff = 166
    expect(maleBmr - femaleBmr).toBeCloseTo(166, 0);
  });

  it('decreases BMR with increasing age', () => {
    const bmrAge25 = calculateBMR(180, 70, 25, 'male');
    const bmrAge45 = calculateBMR(180, 70, 45, 'male');
    expect(bmrAge25).toBeGreaterThan(bmrAge45);
    // Difference should be 5 * 20 = 100
    expect(bmrAge25 - bmrAge45).toBeCloseTo(100, 0);
  });

  it('increases BMR with increasing weight', () => {
    const bmrLight = calculateBMR(150, 70, 30, 'male');
    const bmrHeavy = calculateBMR(220, 70, 30, 'male');
    expect(bmrHeavy).toBeGreaterThan(bmrLight);
  });

  it('increases BMR with increasing height', () => {
    const bmrShort = calculateBMR(180, 64, 30, 'male');
    const bmrTall = calculateBMR(180, 76, 30, 'male');
    expect(bmrTall).toBeGreaterThan(bmrShort);
  });
});

describe('calculateTDEE', () => {
  const baseBMR = 1800;

  it('calculates TDEE for sedentary activity level', () => {
    expect(calculateTDEE(baseBMR, 'sedentary')).toBe(Math.round(1800 * 1.2));
  });

  it('calculates TDEE for light activity level', () => {
    expect(calculateTDEE(baseBMR, 'light')).toBe(Math.round(1800 * 1.375));
  });

  it('calculates TDEE for moderate activity level', () => {
    expect(calculateTDEE(baseBMR, 'moderate')).toBe(Math.round(1800 * 1.55));
  });

  it('calculates TDEE for very active level', () => {
    expect(calculateTDEE(baseBMR, 'very_active')).toBe(Math.round(1800 * 1.725));
  });

  it('calculates TDEE for extra active level', () => {
    expect(calculateTDEE(baseBMR, 'extra_active')).toBe(Math.round(1800 * 1.9));
  });

  it('returns a rounded integer', () => {
    const tdee = calculateTDEE(1753, 'moderate');
    expect(Number.isInteger(tdee)).toBe(true);
  });
});

describe('calculateCalorieTarget', () => {
  it('adds 500 calories for gaining goal', () => {
    expect(calculateCalorieTarget(2500, 'gain')).toBe(3000);
  });

  it('subtracts 500 calories for losing goal', () => {
    expect(calculateCalorieTarget(2500, 'lose')).toBe(2000);
  });

  it('keeps calories the same for maintain goal', () => {
    expect(calculateCalorieTarget(2500, 'maintain')).toBe(2500);
  });

  it('returns a rounded integer', () => {
    expect(Number.isInteger(calculateCalorieTarget(2501, 'gain'))).toBe(true);
  });
});

describe('calculateAge', () => {
  it('calculates age correctly for a past birthday this year', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    const birthMonth = today.getMonth(); // 0-indexed, same month
    const birthDay = today.getDate() - 1; // yesterday in this month
    const dob = `${birthYear}-${String(birthMonth + 1).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
    expect(calculateAge(dob)).toBe(30);
  });

  it('calculates age correctly when birthday has not occurred yet this year', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 25;
    // Use a month in the future
    const futureMonth = ((today.getMonth() + 2) % 12) + 1;
    const futureYear = futureMonth <= today.getMonth() + 1 ? birthYear + 1 : birthYear;
    const dob = `${futureYear}-${String(futureMonth).padStart(2, '0')}-15`;
    const age = calculateAge(dob);
    // Should be 24 because birthday hasn't happened yet
    expect(age).toBe(24);
  });

  it('calculates age on exact birthday', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 20;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dob = `${birthYear}-${month}-${day}`;
    expect(calculateAge(dob)).toBe(20);
  });

  it('returns 0 for an infant born this year', () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dob = `${today.getFullYear()}-${month}-${day}`;
    expect(calculateAge(dob)).toBe(0);
  });
});

describe('getActivityLevelLabel', () => {
  it('returns correct label for sedentary', () => {
    expect(getActivityLevelLabel('sedentary')).toBe('Sedentary (desk job, little exercise)');
  });

  it('returns correct label for very_active', () => {
    expect(getActivityLevelLabel('very_active')).toBe('Very Active (6-7 days/week)');
  });
});
