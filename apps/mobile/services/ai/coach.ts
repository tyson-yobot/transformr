import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';
import type { AICoachResponse } from '@app-types/ai';

interface CoachContext {
  userId: string;
  currentWeight?: number;
  goalWeight?: number;
  goalDirection?: string;
  workoutsThisWeek?: number;
  caloriesYesterday?: number;
  proteinYesterday?: number;
  currentStreak?: number;
  sleepHoursLast?: number;
  moodAverage?: number;
  readinessScore?: number;
  countdownDaysLeft?: number;
  countdownTitle?: string;
  businessRevenue?: number;
  revenueGoal?: number;
}

export async function getAICoaching(context: CoachContext): Promise<AICoachResponse> {
  const userContext: UserAIContext | null = await buildUserAIContext(context.userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: { ...context, userContext },
  });

  if (error) throw error;
  return data as AICoachResponse;
}

export async function getMorningBriefing(userId: string): Promise<string> {
  const userContext: UserAIContext | null = await buildUserAIContext(userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: { userId, type: 'morning_briefing', userContext },
  });

  if (error) throw error;
  return (data as { message: string }).message;
}

export async function getEveningReflection(userId: string): Promise<string> {
  const userContext: UserAIContext | null = await buildUserAIContext(userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: { userId, type: 'evening_reflection', userContext },
  });

  if (error) throw error;
  return (data as { message: string }).message;
}

export async function getWorkoutAdvice(
  userId: string,
  readinessScore: number,
  musclesSore: string[],
): Promise<AICoachResponse> {
  const userContext: UserAIContext | null = await buildUserAIContext(userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: { userId, type: 'workout_advice', readinessScore, musclesSore, userContext },
  });

  if (error) throw error;
  return data as AICoachResponse;
}
