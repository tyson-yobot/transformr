// =============================================================================
// TRANSFORMR -- Budget-Aware Meal Prep Service (Module 5)
// =============================================================================

import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';
import type { BudgetMealPrepResponse } from '@app-types/ai';

export interface MealPrepParams {
  userId?: string;
  macro_targets?: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  dietary_restrictions?: string[];
  meals_per_day?: number;
  prep_time_hours?: number;
  cooking_skill?: 'beginner' | 'intermediate' | 'advanced';
  equipment?: string[];
  flavor_preferences?: string[];
  budget_override?: number;
}

export async function generateBudgetMealPrepPlan(
  params: MealPrepParams,
): Promise<BudgetMealPrepResponse> {
  const resolvedUserId = params.userId ?? (await supabase.auth.getUser()).data.user?.id ?? '';
  const userContext: UserAIContext | null = resolvedUserId
    ? await buildUserAIContext(resolvedUserId).catch(() => null)
    : null;

  const { data, error } = await supabase.functions.invoke('ai-meal-prep', {
    body: { ...params, userContext },
  });

  if (error) throw error;
  return data as BudgetMealPrepResponse;
}

export async function getWeeklyGroceryBudget(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('weekly_grocery_budget_usd')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return (data?.weekly_grocery_budget_usd as number) ?? 0;
}

export async function updateWeeklyGroceryBudget(budget: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ weekly_grocery_budget_usd: budget })
    .eq('id', user.id);

  if (error) throw error;
}
