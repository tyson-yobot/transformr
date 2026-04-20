// =============================================================================
// TRANSFORMR -- AI Workout Narrator Edge Function
// Real-time narration for 5 workout events: start, set_logged, pr_detected,
// midpoint, workout_complete
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { COMPLIANCE_PREAMBLE } from '../_shared/compliance.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export type NarratorEventType =
  | 'workout_start'
  | 'set_logged'
  | 'pr_detected'
  | 'midpoint'
  | 'workout_complete';

interface NarratorRequest {
  event: NarratorEventType;
  exercise_name?: string;
  sets_completed?: number;
  total_volume?: number;
  elapsed_minutes?: number;
  is_pr?: boolean;
  pr_weight?: number;
  pr_reps?: number;
  total_exercises?: number;
  completed_exercises?: number;
  mood_before?: number;
  coaching_tone?: 'drill_sergeant' | 'motivational' | 'balanced' | 'calm';
  template_name?: string;
  weight?: number;
  reps?: number;
}

async function callClaudeHaiku(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const data = await res.json();
  return (data.content?.[0]?.text as string) ?? '';
}

function buildSystemPrompt(tone: string): string {
  const toneMap: Record<string, string> = {
    drill_sergeant: 'You are a no-nonsense drill sergeant coach. Short, direct, no fluff. Call out exactly what the athlete just did. Use active verbs.',
    motivational: 'You are a high-energy hype coach. Celebrate every win loudly. Use energy and enthusiasm.',
    balanced: 'You are a professional strength coach. Data-driven, specific, professional. Reference the numbers.',
    calm: 'You are a calm, encouraging coach. Validate effort. Gentle, patient, present-tense affirmations.',
  };
  const toneInstruction = toneMap[tone] ?? toneMap['balanced'];
  return `${COMPLIANCE_PREAMBLE}

${toneInstruction}

Rules:
- Maximum 2 sentences. Be SPECIFIC — reference actual numbers (weight, reps, sets, volume).
- No generic phrases like "great job" or "keep it up" without specifics.
- No emojis. Plain text only.
- Sound like a real human coach, not an AI.
- Return ONLY the narration text, nothing else.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    const authHeader = req.headers.get('Authorization');
    const { data: { user } } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? '',
    );
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: NarratorRequest = await req.json();
    const tone = body.coaching_tone ?? 'balanced';
    const system = buildSystemPrompt(tone);

    let userMessage = '';

    switch (body.event) {
      case 'workout_start': {
        const template = body.template_name ? `"${body.template_name}"` : 'a custom workout';
        const moodNote = body.mood_before
          ? ` User's mood going in: ${body.mood_before}/10.`
          : '';
        userMessage = `The athlete just started ${template}.${moodNote} Give them a powerful opening statement to set the tone for this session.`;
        break;
      }

      case 'set_logged': {
        const vol = body.total_volume?.toFixed(0) ?? '0';
        userMessage = `The athlete just logged set ${body.sets_completed ?? 1}: ${body.weight ?? '?'} lbs × ${body.reps ?? '?'} reps on ${body.exercise_name ?? 'an exercise'}. Total session volume: ${vol} lbs. Elapsed: ${body.elapsed_minutes ?? 0} min. Acknowledge the set and cue them for the rest period.`;
        break;
      }

      case 'pr_detected': {
        userMessage = `PERSONAL RECORD ALERT! ${body.exercise_name ?? 'Exercise'}: ${body.pr_weight ?? '?'} lbs × ${body.pr_reps ?? '?'} reps — a new all-time best. Total session volume: ${(body.total_volume ?? 0).toFixed(0)} lbs. Deliver an explosive 2-sentence reaction.`;
        break;
      }

      case 'midpoint': {
        const pct = body.total_exercises
          ? Math.round(((body.completed_exercises ?? 0) / body.total_exercises) * 100)
          : 50;
        const vol = (body.total_volume ?? 0).toFixed(0);
        userMessage = `Midpoint of the workout reached — ${pct}% done. ${body.sets_completed ?? 0} sets logged, ${vol} lbs volume in ${body.elapsed_minutes ?? 0} minutes. Give a halfway check-in that assesses pace and pushes for a strong second half.`;
        break;
      }

      case 'workout_complete': {
        const vol = (body.total_volume ?? 0).toFixed(0);
        const dur = body.elapsed_minutes ?? 0;
        userMessage = `Workout complete. ${body.sets_completed ?? 0} total sets, ${vol} lbs total volume, ${dur} minutes. Send them off with a closing statement that celebrates the work done and primes recovery.`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown event type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const narration = await callClaudeHaiku(system, userMessage);

    return new Response(
      JSON.stringify({ narration, event: body.event }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
