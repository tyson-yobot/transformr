import { supabase } from '@services/supabase';
import type { AISleepRecommendation } from '@app-types/ai';

interface SleepContext {
  userId: string;
  recentSleepLogs: Array<{
    bedtime: string;
    wakeTime: string;
    quality: number;
    durationMinutes: number;
  }>;
  workoutTimes: string[];
  caffeineHabits: string[];
  screenTime: string | null;
  wakeUpGoal: string;
  timezone: string;
}

export async function getSleepRecommendations(
  context: SleepContext,
): Promise<AISleepRecommendation> {
  const { data, error } = await supabase.functions.invoke('ai-sleep-optimizer', {
    body: context,
  });

  if (error) throw error;
  return data as AISleepRecommendation;
}
