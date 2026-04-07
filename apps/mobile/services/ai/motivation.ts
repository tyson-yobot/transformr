import { supabase } from '@services/supabase';
import type { AIMotivation } from '@app-types/ai';

interface MotivationContext {
  userId: string;
  currentMood?: number;
  currentStreak: number;
  todayWorkoutCompleted: boolean;
  todayCaloriesLogged: number;
  targetCalories: number;
  recentPRs: string[];
  countdownDaysLeft?: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  lastWorkoutDaysAgo: number;
  habitsCompletedToday: number;
  habitsTotalToday: number;
}

export async function getMotivation(
  context: MotivationContext,
): Promise<AIMotivation> {
  const { data, error } = await supabase.functions.invoke('ai-motivation', {
    body: context,
  });

  if (error) throw error;
  return data as AIMotivation;
}

export async function getDailyQuote(userId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-motivation', {
    body: { userId, type: 'daily_quote' },
  });

  if (error) throw error;
  return (data as { message: string }).message;
}
