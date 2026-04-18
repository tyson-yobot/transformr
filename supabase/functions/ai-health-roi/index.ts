// =============================================================================
// TRANSFORMR -- AI Health ROI Report Edge Function
// Calculates the financial and productivity return on health investments
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { COMPLIANCE_PREAMBLE } from '../_shared/compliance.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthROIRequest {
  time_range_days?: number;
}

async function callClaude(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const data = await res.json();
  return (data.content?.[0]?.text as string) ?? '{}';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: HealthROIRequest = await req.json().catch(() => ({}));
    const daysBack = body.time_range_days ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString();

    // Fetch comprehensive data in parallel
    const [
      { data: profile },
      { data: workouts },
      { data: sleepLogs },
      { data: moodLogs },
      { data: businessMetrics },
      { data: weightLogs },
      { data: habitLogs },
      { data: supplementLogs },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('workout_sessions').select('id,started_at,completed_at,total_volume,total_sets,mood_before,mood_after').eq('user_id', user.id).gte('started_at', startDateStr).order('started_at'),
      supabase.from('sleep_logs').select('*').eq('user_id', user.id).gte('date', startDate.toISOString().split('T')[0]).order('date'),
      supabase.from('mood_logs').select('*').eq('user_id', user.id).gte('logged_at', startDateStr).order('logged_at'),
      supabase.from('business_metrics').select('*').eq('user_id', user.id).gte('date', startDate.toISOString().split('T')[0]).order('date'),
      supabase.from('weight_logs').select('*').eq('user_id', user.id).gte('logged_at', startDateStr).order('logged_at', { ascending: false }).limit(30),
      supabase.from('habit_logs').select('habit_id,completed,date').eq('user_id', user.id).gte('date', startDate.toISOString().split('T')[0]).order('date'),
      supabase.from('supplement_logs').select('name,cost_per_serving').eq('user_id', user.id).gte('logged_at', startDateStr),
    ]);

    // Calculate workout investment (time)
    const workoutCount = workouts?.length ?? 0;
    const avgWorkoutMinutes = workouts?.reduce((sum, w) => {
      if (w.started_at && w.completed_at) {
        return sum + (new Date(w.completed_at).getTime() - new Date(w.started_at).getTime()) / 60000;
      }
      return sum + 45;
    }, 0) / Math.max(workoutCount, 1) ?? 45;
    const totalWorkoutHours = (workoutCount * avgWorkoutMinutes) / 60;

    // Calculate supplement investment
    const supplementCost = supplementLogs?.reduce((sum, s) => sum + (s.cost_per_serving ?? 0), 0) ?? 0;

    // Estimate hourly value from profile
    const estimatedHourlyValue = profile?.estimated_hourly_value ?? 50;

    const systemPrompt = `${COMPLIANCE_PREAMBLE}

You are a Health ROI analyst. Calculate the financial and productivity return on health investments.

ALWAYS respond with valid JSON matching this exact schema:
{
  "roi_summary": {
    "headline": "string — one powerful stat e.g. '3.2x return on every gym hour'",
    "total_health_hours_invested": number,
    "estimated_productivity_gain_percent": number,
    "dollar_value_of_productivity_gain": number,
    "cost_of_supplements": number,
    "net_roi_ratio": number,
    "verdict": "string — 1 sentence verdict"
  },
  "health_investments": [
    { "category": "Exercise", "hours_invested": number, "cost_usd": number, "measurable_benefit": "string" }
  ],
  "productivity_correlations": [
    { "health_metric": "string", "business_metric": "string", "correlation": "string", "dollar_impact": "string" }
  ],
  "high_roi_actions": [
    { "action": "string", "effort": "low|medium|high", "estimated_roi": "string", "priority": number }
  ],
  "low_roi_activities": [
    { "activity": "string", "reason": "string", "suggestion": "string" }
  ],
  "energy_roi": {
    "best_energy_days": "string description of patterns",
    "worst_energy_days": "string",
    "optimization_tip": "string"
  },
  "30_day_roi_projection": {
    "if_optimize_sleep": "string — projected revenue/productivity change",
    "if_increase_workout_frequency": "string",
    "if_optimize_nutrition": "string",
    "combined_potential": "string"
  }
}`;

    const userData = {
      profile: { estimated_hourly_value: estimatedHourlyValue, name: profile?.full_name },
      workout_summary: { count: workoutCount, avg_duration_minutes: Math.round(avgWorkoutMinutes), total_hours: Math.round(totalWorkoutHours * 10) / 10 },
      sleep_logs: sleepLogs ?? [],
      mood_logs: moodLogs ?? [],
      business_metrics: businessMetrics ?? [],
      weight_logs: weightLogs ?? [],
      habit_completion_count: habitLogs?.filter((h) => h.completed).length ?? 0,
      supplement_cost_period: Math.round(supplementCost),
      analysis_period_days: daysBack,
    };

    const userMessage = `Analyze ${daysBack} days of data and calculate the Health ROI:

${JSON.stringify(userData)}

The user's estimated hourly value is $${estimatedHourlyValue}/hr.
Total hours invested in workouts: ${totalWorkoutHours.toFixed(1)} hours.
Supplement costs this period: $${supplementCost.toFixed(2)}.

Calculate the ROI on health investments using actual data correlations.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      // Extract JSON from potential markdown code block
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) ?? aiResponse.match(/(\{[\s\S]*\})/);
      parsed = JSON.parse(jsonMatch?.[1] ?? aiResponse);
    } catch {
      parsed = {
        roi_summary: {
          headline: 'Insufficient data for ROI analysis',
          total_health_hours_invested: totalWorkoutHours,
          estimated_productivity_gain_percent: 0,
          dollar_value_of_productivity_gain: 0,
          cost_of_supplements: supplementCost,
          net_roi_ratio: 0,
          verdict: 'Log more data to unlock ROI insights.',
        },
        health_investments: [],
        productivity_correlations: [],
        high_roi_actions: [],
        low_roi_activities: [],
        energy_roi: { best_energy_days: '', worst_energy_days: '', optimization_tip: '' },
        '30_day_roi_projection': { if_optimize_sleep: '', if_increase_workout_frequency: '', if_optimize_nutrition: '', combined_potential: '' },
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
