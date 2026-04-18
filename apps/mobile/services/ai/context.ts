// =============================================================================
// TRANSFORMR — Universal AI Context Builder
// Every Edge Function call must include this context object.
// Generic advice is unacceptable. All AI output must reference the user's data.
// =============================================================================

import { supabase } from '@/services/supabase';

export interface UserAIContext {
  userId: string;
  profile: {
    name: string;
    currentWeight: number;
    goalWeight: number;
    goalDeadline: string;
    daysRemaining: number;
    subscriptionTier: string;
    coachingTone: 'drill_sergeant' | 'motivational' | 'balanced' | 'calm';
    dietaryRestrictions: string[];
    healthConditions: string[];
    groceryBudgetWeekly: number;
    estimatedHourlyValue: number;
  };
  last7Days: {
    workouts: Array<{ date: string; templateName: string; volumeLbs: number; prsAchieved: number }>;
    nutrition: Array<{ date: string; calories: number; protein: number; carbs: number; fat: number; waterOz: number }>;
    sleep: Array<{ date: string; durationHours: number; qualityRating: number }>;
    mood: Array<{ date: string; rating: number; notes: string }>;
    readiness: Array<{ date: string; score: number }>;
    business: Array<{ date: string; revenueLogged: number; deepWorkHours: number }>;
    habits: Array<{ habitName: string; completedDates: string[]; currentStreak: number }>;
  };
  currentStreaks: {
    longestActiveStreak: number;
    habitStreaks: Record<string, number>;
    workoutStreak: number;
  };
  activeGoals: Array<{ title: string; targetValue: number; currentValue: number; unit: string; deadline: string }>;
  personalRecords: Array<{ exerciseName: string; weight: number; reps: number; achievedAt: string }>;
  supplementStack: Array<{ name: string; dose: string; timing: string; evidenceTier: string }>;
  labMarkers: Array<{ name: string; value: number; unit: string; trend: string; lastUpdated: string }>;
  businessMetrics: {
    currentMRR: number;
    revenueGoal: number;
    customerCount: number;
    avgDeepWorkHoursOnTrainingDays: number;
    avgDeepWorkHoursOnRestDays: number;
  };
  partnerLinked: boolean;
  partnerName?: string;
}

export async function buildUserAIContext(userId: string): Promise<UserAIContext> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const [
    profileResult,
    workoutsResult,
    sleepResult,
    moodResult,
    readinessResult,
    focusResult,
    habitsResult,
    goalsResult,
    prsResult,
    supplementsResult,
    labsResult,
    partnerResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('workout_sessions')
      .select('*, workout_sets(*)')
      .eq('user_id', userId)
      .gte('started_at', sevenDaysAgoISO)
      .not('completed_at', 'is', null),
    supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgoISO.split('T')[0]),
    supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', sevenDaysAgoISO),
    supabase
      .from('readiness_scores')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgoISO.split('T')[0]),
    supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', sevenDaysAgoISO),
    supabase
      .from('habits')
      .select('*, habit_completions(completed_date)')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase.from('goals').select('*').eq('user_id', userId).eq('status', 'active'),
    supabase
      .from('personal_records')
      .select('*, exercises(name)')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false })
      .limit(20),
    supabase.from('supplements').select('*').eq('user_id', userId).eq('is_active', true),
    supabase
      .from('lab_biomarkers')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false }),
    supabase
      .from('partnerships')
      .select('*, partner:profiles!user_b(display_name)')
      .eq('user_a', userId)
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const goalDeadline = profile?.goal_deadline ?? null;
  const daysRemaining = goalDeadline
    ? Math.max(0, Math.ceil((new Date(goalDeadline).getTime() - Date.now()) / 86400000))
    : 0;

  const workoutDates = new Set((workoutsResult.data ?? []).map((w) => w.started_at.split('T')[0]));
  const focusSessions = focusResult.data ?? [];

  const focusOnTraining = focusSessions
    .filter((f) => workoutDates.has((f.started_at as string).split('T')[0]))
    .reduce((sum, f) => sum + ((f.duration_minutes as number) ?? 0) / 60, 0);
  const focusOnRest = focusSessions
    .filter((f) => !workoutDates.has((f.started_at as string).split('T')[0]))
    .reduce((sum, f) => sum + ((f.duration_minutes as number) ?? 0) / 60, 0);
  const trainingDayCount = workoutDates.size;
  const restDayCount = Math.max(1, 7 - trainingDayCount);

  return {
    userId,
    profile: {
      name: (profile?.display_name as string) ?? 'there',
      currentWeight: (profile?.current_weight as number) ?? 0,
      goalWeight: (profile?.goal_weight as number) ?? 0,
      goalDeadline: goalDeadline ?? '',
      daysRemaining,
      subscriptionTier: (profile?.subscription_tier as string) ?? 'free',
      coachingTone:
        ((profile?.coaching_tone as UserAIContext['profile']['coachingTone']) ?? 'balanced'),
      dietaryRestrictions: (profile?.dietary_restrictions as string[]) ?? [],
      healthConditions: (profile?.health_conditions as string[]) ?? [],
      groceryBudgetWeekly: (profile?.grocery_budget_weekly as number) ?? 100,
      estimatedHourlyValue: (profile?.estimated_hourly_value as number) ?? 50,
    },
    last7Days: {
      workouts: (workoutsResult.data ?? []).map((w) => ({
        date: (w.started_at as string).split('T')[0],
        templateName: (w.template_name as string) ?? 'Custom',
        volumeLbs: ((w.workout_sets as Array<{ weight: number; reps: number }>) ?? []).reduce(
          (sum, s) => sum + s.weight * s.reps,
          0,
        ),
        prsAchieved: 0,
      })),
      nutrition: [],
      sleep: (sleepResult.data ?? []).map((s) => ({
        date: s.date as string,
        durationHours: s.duration_hours as number,
        qualityRating: s.quality_rating as number,
      })),
      mood: (moodResult.data ?? []).map((m) => ({
        date: (m.logged_at as string).split('T')[0],
        rating: m.rating as number,
        notes: (m.notes as string) ?? '',
      })),
      readiness: (readinessResult.data ?? []).map((r) => ({
        date: r.date as string,
        score: r.score as number,
      })),
      business: focusSessions.map((f) => ({
        date: (f.started_at as string).split('T')[0],
        revenueLogged: 0,
        deepWorkHours: ((f.duration_minutes as number) ?? 0) / 60,
      })),
      habits: (habitsResult.data ?? []).map((h) => ({
        habitName: h.name as string,
        completedDates: (
          (h.habit_completions as Array<{ completed_date: string }>) ?? []
        ).map((c) => c.completed_date),
        currentStreak: (h.current_streak as number) ?? 0,
      })),
    },
    currentStreaks: {
      longestActiveStreak: Math.max(
        0,
        ...((habitsResult.data ?? []).map((h) => (h.current_streak as number) ?? 0)),
      ),
      habitStreaks: Object.fromEntries(
        (habitsResult.data ?? []).map((h) => [h.name as string, (h.current_streak as number) ?? 0]),
      ),
      workoutStreak: (profile?.workout_streak as number) ?? 0,
    },
    activeGoals: (goalsResult.data ?? []).map((g) => ({
      title: g.title as string,
      targetValue: g.target_value as number,
      currentValue: (g.current_value as number) ?? 0,
      unit: g.unit as string,
      deadline: g.deadline as string,
    })),
    personalRecords: (prsResult.data ?? []).map((r) => ({
      exerciseName: ((r.exercises as { name: string } | null)?.name) ?? '',
      weight: r.weight as number,
      reps: r.reps as number,
      achievedAt: r.achieved_at as string,
    })),
    supplementStack: (supplementsResult.data ?? []).map((s) => ({
      name: s.name as string,
      dose: s.dose as string,
      timing: s.timing as string,
      evidenceTier: (s.evidence_tier as string) ?? 'C',
    })),
    labMarkers: (labsResult.data ?? []).map((m) => ({
      name: m.marker_name as string,
      value: m.value as number,
      unit: m.unit as string,
      trend: (m.trend as string) ?? 'stable',
      lastUpdated: m.recorded_at as string,
    })),
    businessMetrics: {
      currentMRR: (profile?.current_mrr as number) ?? 0,
      revenueGoal: (profile?.revenue_goal as number) ?? 0,
      customerCount: (profile?.customer_count as number) ?? 0,
      avgDeepWorkHoursOnTrainingDays:
        trainingDayCount > 0 ? focusOnTraining / trainingDayCount : 0,
      avgDeepWorkHoursOnRestDays: focusOnRest / restDayCount,
    },
    partnerLinked: !!partnerResult.data,
    partnerName:
      (partnerResult.data?.partner as { display_name: string } | null)?.display_name,
  };
}
