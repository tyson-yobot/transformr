// Input validation utilities

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Must contain a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Must contain a number');
  return { valid: errors.length === 0, errors };
}

export function isValidWeight(weight: number): boolean {
  return weight > 0 && weight < 1000;
}

export function isValidReps(reps: number): boolean {
  return Number.isInteger(reps) && reps > 0 && reps <= 999;
}

export function isValidSets(sets: number): boolean {
  return Number.isInteger(sets) && sets > 0 && sets <= 20;
}

export function isValidCalories(calories: number): boolean {
  return calories >= 0 && calories <= 10000;
}

export function isValidMacro(grams: number): boolean {
  return grams >= 0 && grams <= 2000;
}

export function isValidWaterOz(oz: number): boolean {
  return oz > 0 && oz <= 200;
}

export function isValidRPE(rpe: number): boolean {
  return rpe >= 1 && rpe <= 10;
}

export function isValidMood(mood: number): boolean {
  return Number.isInteger(mood) && mood >= 1 && mood <= 10;
}

export function isValidPainLevel(pain: number): boolean {
  return Number.isInteger(pain) && pain >= 1 && pain <= 10;
}

export function isValidPercentage(value: number): boolean {
  return value >= 0 && value <= 100;
}

export function isValidCurrency(amount: number): boolean {
  return amount >= 0 && amount <= 999999999;
}

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isWithinLength(value: string, min: number, max: number): boolean {
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max;
}

export function sanitizeInput(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}
