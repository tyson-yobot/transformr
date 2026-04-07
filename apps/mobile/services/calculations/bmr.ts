// BMR and TDEE calculations using Mifflin-St Jeor equation

type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export function calculateBMR(
  weightLbs: number,
  heightInches: number,
  ageYears: number,
  gender: Gender,
): number {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightInches * 2.54;

  // Mifflin-St Jeor
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
  }
  // Use female formula for female, other, prefer_not_to_say
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateCalorieTarget(
  tdee: number,
  goalDirection: 'gain' | 'lose' | 'maintain',
): number {
  switch (goalDirection) {
    case 'gain':
      return Math.round(tdee + 500); // +500 cal surplus for gaining
    case 'lose':
      return Math.round(tdee - 500); // -500 cal deficit for losing
    case 'maintain':
      return Math.round(tdee);
  }
}

export function calculateAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getActivityLevelLabel(level: ActivityLevel): string {
  const labels: Record<ActivityLevel, string> = {
    sedentary: 'Sedentary (desk job, little exercise)',
    light: 'Light (1-3 days/week)',
    moderate: 'Moderate (3-5 days/week)',
    very_active: 'Very Active (6-7 days/week)',
    extra_active: 'Extra Active (athlete/physical job)',
  };
  return labels[level];
}
