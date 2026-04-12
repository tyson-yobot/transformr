// =============================================================================
// TRANSFORMR -- Budget-Aware Grocery List Service (Module 5)
// =============================================================================

import { supabase } from '@services/supabase';
import type { BudgetGroceryListResponse, TieredMeal } from '@app-types/ai';

export interface GroceryListParams {
  meal_plan: {
    meals: {
      name: string;
      servings: number;
      ingredients: { name: string; quantity: string; estimated_cost: number }[];
    }[];
  };
  dietary_restrictions?: string[];
  budget_override?: number;
  household_size?: number;
  existing_pantry?: string[];
}

export async function generateBudgetGroceryList(
  params: GroceryListParams,
): Promise<BudgetGroceryListResponse> {
  const { data, error } = await supabase.functions.invoke('ai-grocery-list', {
    body: params,
  });

  if (error) throw error;
  return data as BudgetGroceryListResponse;
}

export function mealsToGroceryInput(
  meals: TieredMeal[],
): GroceryListParams['meal_plan'] {
  return {
    meals: meals.map((m) => ({
      name: m.name,
      servings: m.servings,
      ingredients: m.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        estimated_cost: i.estimated_cost,
      })),
    })),
  };
}
