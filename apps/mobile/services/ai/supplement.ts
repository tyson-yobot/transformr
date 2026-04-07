import { supabase } from '@services/supabase';
import type { AISupplementRecommendation } from '@app-types/ai';

interface SupplementContext {
  userId: string;
  goalDirection: string;
  currentWeight: number;
  goalWeight: number;
  activityLevel: string;
  dietaryRestrictions: string[];
  currentSupplements: Array<{ name: string; dosage: string }>;
  avgProteinIntake: number;
  avgCalorieIntake: number;
  sleepQuality: number;
  age: number;
  gender: string;
}

export async function getSupplementRecommendations(
  context: SupplementContext,
): Promise<AISupplementRecommendation> {
  const { data, error } = await supabase.functions.invoke('ai-supplement', {
    body: context,
  });

  if (error) throw error;
  return data as AISupplementRecommendation;
}
