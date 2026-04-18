import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';
import type { AITrajectory } from '@app-types/ai';

interface TrajectoryContext {
  userId: string;
  currentWeight: number;
  goalWeight: number;
  weightHistory: { date: string; weight: number }[];
  workoutsPerWeek: number;
  avgCalories: number;
  targetCalories: number;
  currentRevenue?: number;
  revenueGoal?: number;
  revenueHistory?: { date: string; amount: number }[];
  countdownDate?: string;
  currentStreak: number;
  habitsCompletionRate: number;
}

export async function generateTrajectory(
  context: TrajectoryContext,
): Promise<AITrajectory> {
  const userContext: UserAIContext | null = await buildUserAIContext(context.userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-trajectory', {
    body: { ...context, userContext },
  });

  if (error) throw error;
  return data as AITrajectory;
}
