// Macro target calculations

type GoalDirection = 'gain' | 'lose' | 'maintain';

interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroRatios {
  protein: number; // percentage
  carbs: number;
  fat: number;
}

// Macro ratios based on goal direction
const MACRO_RATIOS: Record<GoalDirection, MacroRatios> = {
  gain: { protein: 30, carbs: 45, fat: 25 },
  lose: { protein: 40, carbs: 30, fat: 30 },
  maintain: { protein: 30, carbs: 40, fat: 30 },
};

export function calculateMacroTargets(
  calories: number,
  goalDirection: GoalDirection,
  bodyWeightLbs?: number,
): MacroTargets {
  const ratios = MACRO_RATIOS[goalDirection];

  // If body weight is provided, use 1g/lb for protein (gaining) or 1.2g/lb (losing)
  let protein: number;
  if (bodyWeightLbs) {
    const proteinPerLb = goalDirection === 'lose' ? 1.2 : 1.0;
    protein = Math.round(bodyWeightLbs * proteinPerLb);
  } else {
    protein = Math.round((calories * ratios.protein) / 100 / 4);
  }

  const proteinCalories = protein * 4;
  const remainingCalories = calories - proteinCalories;

  // Split remaining between carbs and fat based on ratios
  const carbRatio = ratios.carbs / (ratios.carbs + ratios.fat);
  const fatRatio = ratios.fat / (ratios.carbs + ratios.fat);

  const carbs = Math.round((remainingCalories * carbRatio) / 4);
  const fat = Math.round((remainingCalories * fatRatio) / 9);

  return { calories, protein, carbs, fat };
}

export function calculateMacroPercentages(
  protein: number,
  carbs: number,
  fat: number,
): MacroRatios {
  const totalCalories = protein * 4 + carbs * 4 + fat * 9;
  if (totalCalories === 0) return { protein: 0, carbs: 0, fat: 0 };

  return {
    protein: Math.round((protein * 4 * 100) / totalCalories),
    carbs: Math.round((carbs * 4 * 100) / totalCalories),
    fat: Math.round((fat * 9 * 100) / totalCalories),
  };
}

export function calculateRemainingMacros(
  targets: MacroTargets,
  consumed: MacroTargets,
): MacroTargets {
  return {
    calories: Math.max(0, targets.calories - consumed.calories),
    protein: Math.max(0, targets.protein - consumed.protein),
    carbs: Math.max(0, targets.carbs - consumed.carbs),
    fat: Math.max(0, targets.fat - consumed.fat),
  };
}

export function getMacroProgress(target: number, consumed: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((consumed / target) * 100));
}

export function scaleFoodMacros(
  baseMacros: { calories: number; protein: number; carbs: number; fat: number },
  quantity: number,
): { calories: number; protein: number; carbs: number; fat: number } {
  return {
    calories: Math.round(baseMacros.calories * quantity),
    protein: Math.round(baseMacros.protein * quantity * 10) / 10,
    carbs: Math.round(baseMacros.carbs * quantity * 10) / 10,
    fat: Math.round(baseMacros.fat * quantity * 10) / 10,
  };
}
