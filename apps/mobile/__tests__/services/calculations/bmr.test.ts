import {
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateAge,
  getActivityLevelLabel,
} from '../../../services/calculations/bmr';

describe('calculateBMR', () => {
  it('uses male formula: 10w + 6.25h - 5a + 5', () => {
    // 180 lbs, 70 inches, 30 years, male
    // weightKg = 180 * 0.453592 ≈ 81.65
    // heightCm = 70 * 2.54 = 177.8
    // BMR = 10*81.65 + 6.25*177.8 - 5*30 + 5
    //     = 816.5 + 1111.25 - 150 + 5 = 1782.75
    const result = calculateBMR(180, 70, 30, 'male');
    expect(result).toBeCloseTo(1782.75, 0);
  });

  it('uses female formula: 10w + 6.25h - 5a - 161', () => {
    const result = calculateBMR(130, 65, 25, 'female');
    // weightKg = 130 * 0.453592 ≈ 58.97
    // heightCm = 65 * 2.54 = 165.1
    // BMR = 10*58.97 + 6.25*165.1 - 5*25 - 161 = 589.7 + 1031.875 - 125 - 161 = 1335.575
    expect(result).toBeCloseTo(1335.6, 0);
  });

  it('uses female formula for gender=other', () => {
    const female = calculateBMR(150, 67, 35, 'female');
    const other = calculateBMR(150, 67, 35, 'other');
    expect(other).toBe(female);
  });

  it('uses female formula for gender=prefer_not_to_say', () => {
    const female = calculateBMR(150, 67, 35, 'female');
    const pns = calculateBMR(150, 67, 35, 'prefer_not_to_say');
    expect(pns).toBe(female);
  });
});

describe('calculateTDEE', () => {
  it('multiplies BMR by sedentary multiplier (1.2)', () => {
    expect(calculateTDEE(1800, 'sedentary')).toBe(Math.round(1800 * 1.2));
  });

  it('multiplies BMR by moderate multiplier (1.55)', () => {
    expect(calculateTDEE(1800, 'moderate')).toBe(Math.round(1800 * 1.55));
  });

  it('multiplies BMR by extra_active multiplier (1.9)', () => {
    expect(calculateTDEE(2000, 'extra_active')).toBe(Math.round(2000 * 1.9));
  });
});

describe('calculateCalorieTarget', () => {
  it('returns TDEE + 500 for gain', () => {
    expect(calculateCalorieTarget(2500, 'gain')).toBe(3000);
  });

  it('returns TDEE - 500 for lose', () => {
    expect(calculateCalorieTarget(2500, 'lose')).toBe(2000);
  });

  it('returns TDEE for maintain', () => {
    expect(calculateCalorieTarget(2500, 'maintain')).toBe(2500);
  });
});

describe('calculateAge', () => {
  it('calculates age correctly for a past birth date', () => {
    const today = new Date();
    const birth = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    const dob = birth.toISOString().split('T')[0] ?? '';
    expect(calculateAge(dob)).toBe(30);
  });

  it('subtracts 1 year when birthday has not yet occurred this year', () => {
    // Use Jan 1 of next year as birth month/day → birthday always in future for rest of year
    const birth = new Date(new Date().getFullYear() - 25, 11, 31); // Dec 31 of 25 years ago
    const today = new Date();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    const birthdayPassed = monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0);
    const dob = birth.toISOString().split('T')[0] ?? '';
    // Only test when birthday hasn't passed (i.e., not on/after Dec 31)
    if (!birthdayPassed) {
      expect(calculateAge(dob)).toBe(24);
    } else {
      expect(calculateAge(dob)).toBe(25);
    }
  });
});

describe('getActivityLevelLabel', () => {
  it('returns label string for each activity level', () => {
    expect(getActivityLevelLabel('sedentary')).toContain('Sedentary');
    expect(getActivityLevelLabel('light')).toContain('Light');
    expect(getActivityLevelLabel('moderate')).toContain('Moderate');
    expect(getActivityLevelLabel('very_active')).toContain('Very Active');
    expect(getActivityLevelLabel('extra_active')).toContain('Extra Active');
  });
});
