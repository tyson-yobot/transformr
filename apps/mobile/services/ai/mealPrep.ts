import { supabase } from '@services/supabase';

interface MealPrepContext {
  userId: string;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  mealsPerDay: number;
  daysToPrep: number;
  servingsPerMeal: number; // 1 for individual, 2 for couples
  dietaryRestrictions: string[];
  dislikedFoods: string[];
  budget?: number;
  availableEquipment: string[];
  maxPrepTimeMinutes: number;
}

interface MealPrepResult {
  meals: Array<{
    name: string;
    mealType: string;
    servings: number;
    macros: { calories: number; protein: number; carbs: number; fat: number };
    ingredients: Array<{ name: string; quantity: number; unit: string }>;
    instructions: string[];
    prepTimeMinutes: number;
  }>;
  prepSchedule: Array<{
    step: number;
    description: string;
    durationMinutes: number;
    parallelWith?: number[];
  }>;
  containerPlan: Array<{
    label: string;
    contents: string;
    day: string;
    mealType: string;
    macros: { calories: number; protein: number; carbs: number; fat: number };
  }>;
  totalPrepTimeMinutes: number;
  groceryList: Array<{
    name: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
  }>;
  totalEstimatedCost: number;
  tips: string[];
}

export async function generateMealPrepPlan(
  context: MealPrepContext,
): Promise<MealPrepResult> {
  const { data, error } = await supabase.functions.invoke('ai-meal-prep', {
    body: context,
  });

  if (error) throw error;
  return data as MealPrepResult;
}
