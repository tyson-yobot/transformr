// =============================================================================
// TRANSFORMR -- AI Monthly Retrospective Letter
// Generates a comprehensive personal letter from "your AI coach" reviewing
// the user's entire month of data. Uses Claude Sonnet for deep analysis.
// Supports both user-authenticated calls and cron-triggered service-role calls.
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { COMPLIANCE_PREAMBLE } from '../_shared/compliance.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RetrospectiveRequest {
  month: string;
  user_id: string;
  type: 'full' | 'preview';
}

interface WorkoutRow {
  started_at: string;
  total_volume: number | null;
}

interface PRRow {
  achieved_at: string;
  exercise_name: string;
  weight: number | null;
}

interface MoodRow {
  score: number;
  created_at: string;
}

interface SleepRow {
  duration_minutes: number | null;
  quality: number | null;
}

interface HabitRow {
  habit_id: string;
  completed: boolean;
}

interface HabitMeta {
  id: string;
  name: string;
}

interface JournalRow {
  entry_text: string;
  wins: string[] | null;
  struggles: string[] | null;
}

interface WeightRow {
  weight: number;
  logged_at: string;
}

interface GoalRow {
  title: string;
  progress_percentage: number | null;
  is_completed: boolean | null;
}

interface ProfileRow {
  full_name: string | null;
  gamification_style: string | null;
}

interface ClaudeContent {
  type: string;
  text: string;
}

interface ClaudeResponse {
  content: ClaudeContent[];
}

interface KeyStats {
  workouts: number;
  avg_mood: number;
  habits_completion_rate: number;
  weight_change: number;
  avg_sleep_hours: number;
  total_volume: number;
  prs_set: number;
}

async function fetchMonthData(
  supabase: SupabaseClient,
  userId: string,
  month: string,
): Promise<Record<string, unknown>> {
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = `${month}-01`;
  const endDate = new Date(year!, monthNum!, 1).toISOString().split('T')[0]!;

  // Workouts
  const { data: workoutsRaw } = await supabase
    .from('workout_sessions')
    .select('started_at, total_volume')
    .eq('user_id', userId)
    .gte('started_at', `${startDate}T00:00:00Z`)
    .lt('started_at', `${endDate}T00:00:00Z`);

  const workouts = (workoutsRaw as WorkoutRow[] | null) ?? [];
  const totalVolume = workouts.reduce((sum, w) => sum + (w.total_volume ?? 0), 0);

  // PRs
  const { data: prsRaw } = await supabase
    .from('personal_records')
    .select('achieved_at, exercise_name, weight')
    .eq('user_id', userId)
    .gte('achieved_at', `${startDate}T00:00:00Z`)
    .lt('achieved_at', `${endDate}T00:00:00Z`);

  const prs = (prsRaw as PRRow[] | null) ?? [];

  // Mood
  const { data: moodRaw } = await supabase
    .from('mood_logs')
    .select('score, created_at')
    .eq('user_id', userId)
    .gte('created_at', `${startDate}T00:00:00Z`)
    .lt('created_at', `${endDate}T00:00:00Z`);

  const moods = (moodRaw as MoodRow[] | null) ?? [];
  const avgMood = moods.length
    ? moods.reduce((sum, m) => sum + m.score, 0) / moods.length
    : 0;
  const moodMin = moods.length ? Math.min(...moods.map((m) => m.score)) : 0;
  const moodMax = moods.length ? Math.max(...moods.map((m) => m.score)) : 0;

  // Sleep
  const { data: sleepRaw } = await supabase
    .from('sleep_logs')
    .select('duration_minutes, quality')
    .eq('user_id', userId)
    .gte('created_at', `${startDate}T00:00:00Z`)
    .lt('created_at', `${endDate}T00:00:00Z`);

  const sleepLogs = (sleepRaw as SleepRow[] | null) ?? [];
  const avgSleepMinutes = sleepLogs.length
    ? sleepLogs.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / sleepLogs.length
    : 0;
  const avgSleepHours = avgSleepMinutes / 60;

  // Habits
  const { data: habitLogsRaw } = await supabase
    .from('habit_logs')
    .select('habit_id, completed')
    .eq('user_id', userId)
    .gte('logged_date', startDate)
    .lt('logged_date', endDate);

  const habitLogs = (habitLogsRaw as HabitRow[] | null) ?? [];
  const completedHabits = habitLogs.filter((h) => h.completed).length;
  const habitsCompletionRate = habitLogs.length
    ? completedHabits / habitLogs.length
    : 0;

  // Get habit names
  const habitIds = [...new Set(habitLogs.map((h) => h.habit_id))];
  const { data: habitMetaRaw } = habitIds.length
    ? await supabase.from('habits').select('id, name').in('id', habitIds)
    : { data: [] };

  const habitMeta = (habitMetaRaw as HabitMeta[] | null) ?? [];
  const habitNameMap = Object.fromEntries(habitMeta.map((h) => [h.id, h.name]));

  const habitBreakdown = habitIds.map((id) => {
    const logs = habitLogs.filter((h) => h.habit_id === id);
    const rate = logs.length ? logs.filter((h) => h.completed).length / logs.length : 0;
    return { name: habitNameMap[id] ?? id, rate: Math.round(rate * 100) };
  });

  // Journal entries
  const { data: journalRaw } = await supabase
    .from('journal_entries')
    .select('entry_text, wins, struggles')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lt('date', endDate)
    .limit(10);

  const journals = (journalRaw as JournalRow[] | null) ?? [];
  const allWins = journals.flatMap((j) => j.wins ?? []).slice(0, 5);
  const allStruggles = journals.flatMap((j) => j.struggles ?? []).slice(0, 5);

  // Weight
  const { data: weightRaw } = await supabase
    .from('weight_logs')
    .select('weight, logged_at')
    .eq('user_id', userId)
    .gte('logged_at', `${startDate}T00:00:00Z`)
    .lt('logged_at', `${endDate}T00:00:00Z`)
    .order('logged_at', { ascending: true });

  const weightLogs = (weightRaw as WeightRow[] | null) ?? [];
  const weightStart = weightLogs[0]?.weight ?? null;
  const weightEnd = weightLogs[weightLogs.length - 1]?.weight ?? null;
  const weightChange =
    weightStart !== null && weightEnd !== null ? weightEnd - weightStart : 0;

  // Goals
  const { data: goalsRaw } = await supabase
    .from('goals')
    .select('title, progress_percentage, is_completed')
    .eq('user_id', userId)
    .eq('is_active', true);

  const goals = (goalsRaw as GoalRow[] | null) ?? [];

  return {
    workouts: {
      count: workouts.length,
      total_volume: totalVolume,
      prs: prs.map((p) => `${p.exercise_name} (${p.weight ?? '?'} lbs)`),
    },
    mood: {
      average: Math.round(avgMood * 10) / 10,
      min: moodMin,
      max: moodMax,
      log_count: moods.length,
    },
    sleep: {
      average_hours: Math.round(avgSleepHours * 10) / 10,
      log_count: sleepLogs.length,
    },
    habits: {
      completion_rate: Math.round(habitsCompletionRate * 100) / 100,
      breakdown: habitBreakdown,
    },
    journal: {
      entry_count: journals.length,
      wins: allWins,
      struggles: allStruggles,
    },
    weight: {
      start: weightStart,
      end: weightEnd,
      change: Math.round(weightChange * 10) / 10,
    },
    goals: goals.map((g) => ({
      title: g.title,
      progress: g.progress_percentage ?? 0,
      completed: g.is_completed ?? false,
    })),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const isCron = !authHeader;

    // Use service role for cron, anon key for user calls
    const supabaseKey = isCron
      ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      : Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, supabaseKey);

    let userId: string;

    if (!isCron) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader?.replace('Bearer ', '') ?? '',
      );
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      userId = user.id;
    } else {
      const body: RetrospectiveRequest = await req.json();
      userId = body.user_id;
    }

    const body: RetrospectiveRequest = await req.json().catch(() => ({ month: '', user_id: userId, type: 'full' }));
    const month = body.month || (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().substring(0, 7);
    })();
    const requestType = body.type ?? 'full';

    // Fetch profile
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('full_name, gamification_style')
      .eq('id', userId)
      .single();

    const profile = profileRaw as ProfileRow | null;
    const userName = profile?.full_name?.split(' ')[0] ?? 'friend';
    const coachingTone = profile?.gamification_style ?? 'balanced';

    // Fetch all month data
    const monthData = await fetchMonthData(supabase, userId, month);
    const workoutData = monthData['workouts'] as { count: number; total_volume: number; prs: string[] };
    const moodData = monthData['mood'] as { average: number; min: number; max: number; log_count: number };
    const sleepData = monthData['sleep'] as { average_hours: number; log_count: number };
    const habitsData = monthData['habits'] as { completion_rate: number; breakdown: { name: string; rate: number }[] };
    const journalData = monthData['journal'] as { entry_count: number; wins: string[]; struggles: string[] };
    const weightData = monthData['weight'] as { start: number | null; end: number | null; change: number };
    const goalsData = monthData['goals'] as { title: string; progress: number; completed: boolean }[];

    const [year, monthNum] = month.split('-');
    const monthName = new Date(`${year}-${monthNum}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });

    const dataContext = `
Month: ${monthName}
User: ${userName}
Coaching tone: ${coachingTone}

WORKOUTS:
- Sessions completed: ${workoutData.count}
- Total training volume: ${workoutData.total_volume.toLocaleString()} lbs
- Personal records set: ${workoutData.prs.length > 0 ? workoutData.prs.join(', ') : 'none'}

MOOD:
- Average mood score: ${moodData.average}/10
- Range: ${moodData.min}–${moodData.max}
- Days logged: ${moodData.log_count}

SLEEP:
- Average sleep: ${sleepData.average_hours}h/night
- Days logged: ${sleepData.log_count}

HABITS:
- Overall completion rate: ${Math.round(habitsData.completion_rate * 100)}%
- Per-habit breakdown: ${habitsData.breakdown.map((h) => `${h.name} ${h.rate}%`).join(', ') || 'no habits tracked'}

JOURNAL:
- Entries written: ${journalData.entry_count}
- Logged wins: ${journalData.wins.length > 0 ? journalData.wins.join('; ') : 'none'}
- Logged struggles: ${journalData.struggles.length > 0 ? journalData.struggles.join('; ') : 'none'}

WEIGHT:
- Change this month: ${weightData.change > 0 ? '+' : ''}${weightData.change} lbs

ACTIVE GOALS:
${goalsData.length > 0 ? goalsData.map((g) => `- ${g.title}: ${g.progress}% ${g.completed ? '(COMPLETED)' : ''}`).join('\n') : '- No active goals'}
    `.trim();

    const systemPrompt = `${COMPLIANCE_PREAMBLE}

You are a personal AI wellness coach writing a monthly retrospective letter to ${userName}.
Write in first person as "your AI coach." Address the user by first name.
Tone must match: ${coachingTone}.

Your letter should:
1. Open with a genuine headline summarizing the month's spirit
2. Celebrate real wins with specific numbers from their data
3. Honestly but gently address growth areas
4. Set a specific, actionable focus for next month
5. Close with an encouraging personal note

Respond ONLY with valid JSON in this exact shape:
{
  "letter": "string (full letter text, 300-500 words, addressed to the user by name)",
  "headline": "string (1 punchy headline summarizing the month, max 80 chars)",
  "wins": ["string", "string", "string"],
  "growth_areas": ["string", "string"],
  "next_month_focus": "string (1-2 sentences of specific actionable focus)"
}`;

    const userMessage = `Write the ${requestType === 'preview' ? 'preview (shorter)' : 'full'} monthly retrospective letter for ${monthName}:\n\n${dataContext}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      throw new Error(`Claude API error: ${claudeRes.status} ${errText}`);
    }

    const claudeData = await claudeRes.json() as ClaudeResponse;
    const rawText = claudeData.content[0]?.text ?? '{}';

    let parsed: {
      letter: string;
      headline: string;
      wins: string[];
      growth_areas: string[];
      next_month_focus: string;
    };

    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error('Failed to parse Claude response as JSON');
    }

    const keyStats: KeyStats = {
      workouts: workoutData.count,
      avg_mood: moodData.average,
      habits_completion_rate: habitsData.completion_rate,
      weight_change: weightData.change,
      avg_sleep_hours: sleepData.average_hours,
      total_volume: workoutData.total_volume,
      prs_set: workoutData.prs.length,
    };

    // Persist retrospective
    await supabase
      .from('monthly_retrospectives')
      .upsert({
        user_id: userId,
        month,
        letter: parsed.letter,
        headline: parsed.headline,
        key_stats: keyStats,
        wins: parsed.wins,
        growth_areas: parsed.growth_areas,
        next_month_focus: parsed.next_month_focus,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,month' });

    return new Response(
      JSON.stringify({
        month,
        letter: parsed.letter,
        headline: parsed.headline,
        key_stats: keyStats,
        wins: parsed.wins,
        growth_areas: parsed.growth_areas,
        next_month_focus: parsed.next_month_focus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
