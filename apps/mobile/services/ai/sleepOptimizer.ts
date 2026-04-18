import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';
import type { AISleepRecommendation } from '@app-types/ai';

interface SleepContext {
  userId: string;
  recentSleepLogs: {
    bedtime: string;
    wakeTime: string;
    quality: number;
    durationMinutes: number;
  }[];
  workoutTimes: string[];
  caffeineHabits: string[];
  screenTime: string | null;
  wakeUpGoal: string;
  timezone: string;
}

export async function getSleepRecommendations(
  context: SleepContext,
): Promise<AISleepRecommendation> {
  const userContext: UserAIContext | null = await buildUserAIContext(context.userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-sleep-optimizer', {
    body: { ...context, userContext },
  });

  if (error) throw error;
  return data as AISleepRecommendation;
}
