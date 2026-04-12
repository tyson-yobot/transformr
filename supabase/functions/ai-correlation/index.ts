import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { COMPLIANCE_PREAMBLE } from "../_shared/compliance.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const AI_MODEL = "claude-sonnet-4-20250514";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function callClaude(systemPrompt: string, userMessage: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await response.json();
  return data.content[0].text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { time_range_days } = await req.json();
    const userId = user.id;
    const daysBack = time_range_days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Fetch all relevant data
    const [
      { data: sleepLogs },
      { data: moodLogs },
      { data: workoutSessions },
      { data: businessMetrics },
      { data: weightLogs },
      { data: dailyCheckins },
    ] = await Promise.all([
      supabaseClient.from("sleep_logs").select("*").eq("user_id", userId).gte("date", startDateStr).order("date"),
      supabaseClient.from("mood_logs").select("*").eq("user_id", userId).gte("logged_at", startDateStr).order("logged_at"),
      supabaseClient.from("workout_sessions").select("*").eq("user_id", userId).gte("started_at", startDateStr).order("started_at"),
      supabaseClient.from("business_metrics").select("*").eq("user_id", userId).gte("date", startDateStr).order("date"),
      supabaseClient.from("weight_logs").select("*").eq("user_id", userId).gte("logged_at", startDateStr).order("logged_at"),
      supabaseClient.from("daily_checkins").select("*").eq("user_id", userId).gte("date", startDateStr).order("date"),
    ]);

    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are a body-business correlation analysis engine. Analyze relationships between fitness metrics and business performance.
Look for statistically meaningful patterns and correlations. Be specific with data points.

ALWAYS respond with valid JSON:
{
  "correlations": [
    {
      "metric_a": "sleep_hours",
      "metric_b": "revenue",
      "correlation_strength": "strong|moderate|weak",
      "direction": "positive|negative",
      "description": "When sleep exceeds 7 hours, next-day revenue averages 20% higher",
      "data_points": 25,
      "confidence": 0.78
    }
  ],
  "key_insights": [
    {
      "insight": "Your most productive business days follow morning workouts",
      "evidence": "Specific data evidence",
      "actionable_tip": "Schedule important calls on workout days"
    }
  ],
  "performance_triggers": {
    "positive": ["Morning workout + 7hr sleep = peak business performance"],
    "negative": ["Less than 6hr sleep + no exercise = lowest productivity"]
  },
  "optimal_day_profile": {
    "sleep_hours": 7.5,
    "workout": "morning, 45-60 min",
    "nutrition": "High protein breakfast before 9am",
    "expected_productivity": "Top 20% of days"
  },
  "patterns_over_time": {
    "improving": ["Correlation between consistent sleep and mood stability strengthening"],
    "declining": ["Weekend recovery pattern weakening"],
    "stable": ["Workout-mood connection consistent"]
  },
  "recommendation": "Top recommendation based on correlation analysis"
}`;

    const allData = {
      sleep_logs: sleepLogs || [],
      mood_logs: moodLogs || [],
      workout_sessions: workoutSessions || [],
      business_metrics: businessMetrics || [],
      weight_logs: weightLogs || [],
      daily_checkins: dailyCheckins || [],
    };

    const userMessage = `Analyze ${daysBack} days of body-business data:
${JSON.stringify(allData)}

Find correlations between fitness/health metrics and business performance.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        correlations: [],
        key_insights: [],
        performance_triggers: { positive: [], negative: [] },
        optimal_day_profile: {},
        patterns_over_time: { improving: [], declining: [], stable: [] },
        recommendation: aiResponse,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
