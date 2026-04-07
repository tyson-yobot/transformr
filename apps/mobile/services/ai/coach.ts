import { supabase } from '@services/supabase';
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
  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: context,
  });

  if (error) throw error;
  return data as AICoachResponse;
}

export async function getMorningBriefing(userId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: { userId, type: 'morning_briefing' },
  });

  if (error) throw error;
  return (data as { message: string }).message;
}

export async function getEveningReflection(userId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: { userId, type: 'evening_reflection' },
  });

  if (error) throw error;
  return (data as { message: string }).message;
}

export async function getWorkoutAdvice(
  userId: string,
  readinessScore: number,
  musclesSore: string[],
): Promise<AICoachResponse> {
  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: { userId, type: 'workout_advice', readinessScore, musclesSore },
  });

  if (error) throw error;
  return data as AICoachResponse;
}
