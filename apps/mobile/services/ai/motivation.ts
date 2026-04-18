import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';
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
  const userContext: UserAIContext | null = await buildUserAIContext(context.userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-motivation', {
    body: { ...context, userContext },
  });

  if (error) throw error;
  return data as AIMotivation;
}

export async function getDailyQuote(userId: string): Promise<string> {
  const userContext: UserAIContext | null = await buildUserAIContext(userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-motivation', {
    body: { userId, type: 'daily_quote', userContext },
  });

  if (error) throw error;
  return (data as { message: string }).message;
}
