import { supabase } from '@services/supabase';

interface GroceryContext {
  userId: string;
  mealPlanMeals: Array<{
    name: string;
    servings: number;
    ingredients: Array<{ name: string; quantity: number; unit: string }>;
  }>;
  dietaryRestrictions: string[];
  budget?: number;
  storePreference?: string;
  existingPantryItems?: string[];
}

interface GroceryListResult {
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    aisle: string;
    estimatedCost: number;
    alternatives: string[];
  }>;
  totalEstimatedCost: number;
  budgetSuggestions: string[];
  mealPrepTips: string[];
}

export async function generateGroceryList(
  context: GroceryContext,
): Promise<GroceryListResult> {
  const { data, error } = await supabase.functions.invoke('ai-grocery-list', {
    body: context,
  });

  if (error) throw error;
  return data as GroceryListResult;
}
