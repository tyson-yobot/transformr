// =============================================================================
// TRANSFORMR -- AI Daily Affirmation & Evening Wind-Down
// Generates personalized morning affirmations and evening wind-down content
// using Claude Haiku, grounded in the user's real data and coaching tone.
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { COMPLIANCE_PREAMBLE } from '../_shared/compliance.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserContext {
  date: string;
  streak: number;
  goals: string[];
  mood_yesterday?: number;
  workout_yesterday?: boolean;
}

interface AffirmationRequest {
  type: 'morning' | 'evening';
  user_context: UserContext;
}

interface MorningResponse {
  type: 'morning';
  affirmation: string;
  intention: string;
  action_tip: string;
  audio_script: string;
  generated_at: string;
}

interface EveningResponse {
  type: 'evening';
  reflection_prompt: string;
  gratitude_cue: string;
  wind_down_exercise: string;
  tomorrow_prep: string;
  generated_at: string;
}

interface ClaudeContent {
  type: string;
  text: string;
}

interface ClaudeResponse {
  content: ClaudeContent[];
}

interface ProfileRow {
  coaching_tone: string | null;
  full_name: string | null;
  gamification_style: string | null;
}

interface GoalRow {
  title: string;
  description: string | null;
  target_date: string | null;
}

interface MoodRow {
  score: number;
  created_at: string;
}

interface WorkoutRow {
  started_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const authHeader = req.headers.get('Authorization');
    const { data: { user } } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? '',
    );
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body: AffirmationRequest = await req.json();
    const { type, user_context } = body;

    if (type !== 'morning' && type !== 'evening') {
      return new Response(
        JSON.stringify({ error: 'type must be "morning" or "evening"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('coaching_tone, full_name, gamification_style')
      .eq('id', user.id)
      .single();

    const profile = profileData as ProfileRow | null;
    const userName = profile?.full_name?.split(' ')[0] ?? 'friend';
    const coachingTone = profile?.gamification_style ?? 'balanced';

    // Fetch user goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('title, description, target_date')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(5);

    const goals = (goalsData as GoalRow[] | null) ?? [];
    const goalTitles = goals.map((g) => g.title);

    // Fetch yesterday's mood
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: moodData } = await supabase
      .from('mood_logs')
      .select('score')
      .eq('user_id', user.id)
      .gte('created_at', `${yesterdayStr}T00:00:00Z`)
      .lte('created_at', `${yesterdayStr}T23:59:59Z`)
      .order('created_at', { ascending: false })
      .limit(1);

    const moodYesterday = (moodData as MoodRow[] | null)?.[0]?.score ?? user_context.mood_yesterday ?? null;

    // Fetch yesterday's workout
    const { data: workoutData } = await supabase
      .from('workout_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .gte('started_at', `${yesterdayStr}T00:00:00Z`)
      .lte('started_at', `${yesterdayStr}T23:59:59Z`)
      .limit(1);

    const workedOutYesterday = (workoutData as WorkoutRow[] | null)?.length
      ? true
      : (user_context.workout_yesterday ?? false);

    // Build prompts
    const contextBlock = `
User: ${userName}
Coaching tone: ${coachingTone}
Current streak: ${user_context.streak} days
Active goals: ${goalTitles.length > 0 ? goalTitles.join(', ') : 'none logged yet'}
Yesterday's mood score: ${moodYesterday !== null ? `${moodYesterday}/10` : 'not logged'}
Worked out yesterday: ${workedOutYesterday ? 'yes' : 'no'}
Today's date: ${user_context.date}
    `.trim();

    let systemPrompt: string;
    let userMessage: string;

    if (type === 'morning') {
      systemPrompt = `${COMPLIANCE_PREAMBLE}

You are a personal wellness coach delivering a morning affirmation to ${userName}.
Your tone must match: ${coachingTone}.
Keep affirmations grounded in the user's real data — streak, goals, mood, activity.
Never use generic platitudes. Be specific, warm, and energizing.

Respond ONLY with valid JSON in this exact shape:
{
  "affirmation": "string (2-3 sentences, personalized, energizing)",
  "intention": "string (1 sentence focus for the day, tied to their goals)",
  "action_tip": "string (1 specific, concrete action tied to their goals or schedule)",
  "audio_script": "string (3-4 sentences, written as if spoken aloud in a calm voice, starts with their name)"
}`;

      userMessage = `Generate a morning affirmation for this user:\n\n${contextBlock}`;
    } else {
      systemPrompt = `${COMPLIANCE_PREAMBLE}

You are a personal wellness coach delivering an evening wind-down session to ${userName}.
Your tone must match: ${coachingTone}.
Help the user decompress, reflect, and prepare for tomorrow — using their actual data.
Never pressure or shame. Be warm, specific, and calming.

Respond ONLY with valid JSON in this exact shape:
{
  "reflection_prompt": "string (1 open-ended question inviting honest reflection on the day)",
  "gratitude_cue": "string (1-2 sentences prompting gratitude that references their actual day)",
  "wind_down_exercise": "string (a simple breathing or grounding exercise with specific counts)",
  "tomorrow_prep": "string (1-2 sentences preparing them for tomorrow based on their goals)"
}`;

      userMessage = `Generate an evening wind-down session for this user:\n\n${contextBlock}`;
    }

    // Call Claude Haiku
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!claudeRes.ok) {
      const errorText = await claudeRes.text();
      throw new Error(`Claude API error: ${claudeRes.status} ${errorText}`);
    }

    const claudeData = await claudeRes.json() as ClaudeResponse;
    const rawText = claudeData.content[0]?.text ?? '{}';

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(rawText) as Record<string, string>;
    } catch {
      throw new Error('Failed to parse Claude response as JSON');
    }

    const generatedAt = new Date().toISOString();
    const dateStr = user_context.date;

    // Persist to daily_affirmations
    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      date: dateStr,
      type,
      generated_at: generatedAt,
    };

    if (type === 'morning') {
      insertPayload['affirmation'] = parsed['affirmation'] ?? null;
      insertPayload['intention'] = parsed['intention'] ?? null;
      insertPayload['action_tip'] = parsed['action_tip'] ?? null;
      insertPayload['audio_script'] = parsed['audio_script'] ?? null;
    } else {
      insertPayload['reflection_prompt'] = parsed['reflection_prompt'] ?? null;
      insertPayload['gratitude_cue'] = parsed['gratitude_cue'] ?? null;
      insertPayload['wind_down_exercise'] = parsed['wind_down_exercise'] ?? null;
      insertPayload['tomorrow_prep'] = parsed['tomorrow_prep'] ?? null;
    }

    await supabase
      .from('daily_affirmations')
      .upsert(insertPayload, { onConflict: 'user_id,date,type' });

    // Build response
    let responseBody: MorningResponse | EveningResponse;

    if (type === 'morning') {
      responseBody = {
        type: 'morning',
        affirmation: parsed['affirmation'] ?? '',
        intention: parsed['intention'] ?? '',
        action_tip: parsed['action_tip'] ?? '',
        audio_script: parsed['audio_script'] ?? '',
        generated_at: generatedAt,
      };
    } else {
      responseBody = {
        type: 'evening',
        reflection_prompt: parsed['reflection_prompt'] ?? '',
        gratitude_cue: parsed['gratitude_cue'] ?? '',
        wind_down_exercise: parsed['wind_down_exercise'] ?? '',
        tomorrow_prep: parsed['tomorrow_prep'] ?? '',
        generated_at: generatedAt,
      };
    }

    return new Response(
      JSON.stringify(responseBody),
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
