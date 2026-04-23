// =============================================================================
// TRANSFORMR — Health ROI Report Service
//
// Computes quantifiable ROI metrics from existing Supabase data.
// Calls ai-chat-coach for the AI narrative section.
// =============================================================================

import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';

export interface HealthROIMetrics {
  consistencyScore: number;        // 0–100: workouts logged / active days
  estimatedCaloriesBurned: number; // total from workout sessions
  calorieTarget: number;           // from profile
  nutritionAdherence: number;      // 0–100: days on target / days logged
  sleepQuality: number;            // 0–100: average quality rating
  habitCompletion: number;         // 0–100: completions / expected
  activeDays: number;
  workoutCount: number;
}

export interface HealthROIReport {
  metrics: HealthROIMetrics;
  aiNarrative: string;
  generatedAt: string;
}

export async function computeHealthROIReport(
  userId: string,
  windowDays: 30 | 60 | 90 = 30,
): Promise<HealthROIReport> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffISO = cutoff.toISOString();
  const cutoffDate = cutoffISO.split('T')[0] ?? '';

  const [workoutsRes, nutritionRes, sleepRes, habitsRes, profileRes] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select('started_at, duration_minutes, total_volume')
      .eq('user_id', userId)
      .gte('started_at', cutoffISO)
      .not('completed_at', 'is', null),
    supabase
      .from('nutrition_logs')
      .select('date, calories')
      .eq('user_id', userId)
      .gte('date', cutoffDate),
    supabase
      .from('sleep_logs')
      .select('quality_rating')
      .eq('user_id', userId)
      .gte('date', cutoffDate),
    supabase
      .from('habits')
      .select('target_frequency_per_week, habit_completions(completed_date)')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('profiles')
      .select('daily_calorie_target')
      .eq('id', userId)
      .single(),
  ]);

  const workouts = workoutsRes.data ?? [];
  const nutritionLogs = nutritionRes.data ?? [];
  const sleepLogs = sleepRes.data ?? [];
  const habits = habitsRes.data ?? [];
  const calorieTarget = (profileRes.data?.daily_calorie_target as number | null) ?? 2000;

  // Active days (distinct workout dates)
  const activeDates = new Set(
    workouts.map((w: Record<string, unknown>) => ((w.started_at as string) ?? '').split('T')[0]),
  );
  const activeDays = activeDates.size;

  // Consistency: workouts / window days
  const consistencyScore = Math.min(100, Math.round((workouts.length / windowDays) * 100 * 7));

  // Calories burned estimate (avg 5 kcal/min per session)
  const estimatedCaloriesBurned = workouts.reduce(
    (sum: number, w: Record<string, unknown>) => sum + ((w.duration_minutes as number | null) ?? 0) * 5,
    0,
  );

  // Nutrition adherence: days within 10% of calorie target
  const adherentDays = nutritionLogs.filter((n: Record<string, unknown>) => {
    const cal = (n.calories as number | null) ?? 0;
    return Math.abs(cal - calorieTarget) / calorieTarget <= 0.1;
  }).length;
  const nutritionAdherence = nutritionLogs.length > 0
    ? Math.round((adherentDays / nutritionLogs.length) * 100)
    : 0;

  // Sleep quality (0–10 scale from DB, convert to 0–100)
  const sleepQuality = sleepLogs.length > 0
    ? Math.round(
        (sleepLogs.reduce((sum: number, s: Record<string, unknown>) => sum + ((s.quality_rating as number | null) ?? 0), 0) /
          sleepLogs.length) *
          10,
      )
    : 0;

  // Habit completion rate
  const expectedCompletions = habits.reduce((sum: number, h: Record<string, unknown>) => {
    const freq = (h.target_frequency_per_week as number | null) ?? 7;
    return sum + Math.round((freq / 7) * windowDays);
  }, 0);
  const actualCompletions = habits.reduce((sum: number, h: Record<string, unknown>) => {
    const completions = (
      h.habit_completions as { completed_date: string }[] | null
    ) ?? [];
    return sum + completions.filter((c) => c.completed_date >= cutoffDate).length;
  }, 0);
  const habitCompletion = expectedCompletions > 0
    ? Math.min(100, Math.round((actualCompletions / expectedCompletions) * 100))
    : 0;

  const metrics: HealthROIMetrics = {
    consistencyScore,
    estimatedCaloriesBurned,
    calorieTarget,
    nutritionAdherence,
    sleepQuality,
    habitCompletion,
    activeDays,
    workoutCount: workouts.length,
  };

  // AI narrative
  const prompt = [
    `Generate a 3-sentence health ROI summary for the past ${windowDays} days.`,
    `Workouts: ${workouts.length} sessions, ${activeDays} active days.`,
    `Consistency: ${consistencyScore}%. Calories burned (est.): ${estimatedCaloriesBurned} kcal.`,
    `Nutrition adherence: ${nutritionAdherence}%. Sleep quality: ${sleepQuality}/100.`,
    `Habit completion: ${habitCompletion}%.`,
    `Be specific, encouraging, and data-driven. No filler phrases.`,
  ].join(' ');

  const userContext: UserAIContext | null = await buildUserAIContext(userId).catch(() => null);

  const { data: aiData } = await supabase.functions.invoke('ai-chat-coach', {
    body: { message: prompt, topic: 'general', userContext },
  });

  const aiNarrative =
    (aiData as { reply?: string } | null)?.reply ??
    `Over the past ${windowDays} days, you completed ${workouts.length} workouts with a ${consistencyScore}% consistency score. Your nutrition adherence was ${nutritionAdherence}% and habit completion ${habitCompletion}%.`;

  return { metrics, aiNarrative, generatedAt: new Date().toISOString() };
}
