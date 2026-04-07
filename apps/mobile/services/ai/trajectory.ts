import { supabase } from '@services/supabase';
import type { AITrajectory } from '@app-types/ai';

interface TrajectoryContext {
  userId: string;
  currentWeight: number;
  goalWeight: number;
  weightHistory: Array<{ date: string; weight: number }>;
  workoutsPerWeek: number;
  avgCalories: number;
  targetCalories: number;
  currentRevenue?: number;
  revenueGoal?: number;
  revenueHistory?: Array<{ date: string; amount: number }>;
  countdownDate?: string;
  currentStreak: number;
  habitsCompletionRate: number;
}

export async function generateTrajectory(
  context: TrajectoryContext,
): Promise<AITrajectory> {
  const { data, error } = await supabase.functions.invoke('ai-trajectory', {
    body: context,
  });

  if (error) throw error;
  return data as AITrajectory;
}
