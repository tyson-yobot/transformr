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

    const { week_start, week_end } = await req.json();
    const userId = user.id;

    // Aggregate data from all relevant tables
    const [
      { data: weightLogs },
      { data: mealLogs },
      { data: workoutSessions },
      { data: sleepLogs },
      { data: moodLogs },
      { data: businessMetrics },
      { data: dailyCheckins },
    ] = await Promise.all([
      supabaseClient.from("weight_logs").select("*").eq("user_id", userId).gte("logged_at", week_start).lte("logged_at", week_end),
      supabaseClient.from("meal_logs").select("*").eq("user_id", userId).gte("logged_at", week_start).lte("logged_at", week_end),
      supabaseClient.from("workout_sessions").select("*").eq("user_id", userId).gte("started_at", week_start).lte("started_at", week_end),
      supabaseClient.from("sleep_logs").select("*").eq("user_id", userId).gte("date", week_start).lte("date", week_end),
      supabaseClient.from("mood_logs").select("*").eq("user_id", userId).gte("logged_at", week_start).lte("logged_at", week_end),
      supabaseClient.from("business_metrics").select("*").eq("user_id", userId).gte("date", week_start).lte("date", week_end),
      supabaseClient.from("daily_checkins").select("*").eq("user_id", userId).gte("date", week_start).lte("date", week_end),
    ]);

    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are the TRANSFORMR weekly report generator. Analyze the user's week across fitness, nutrition, sleep, mood, and business.
Grade each area and provide actionable insights. Be specific and data-driven.

ALWAYS respond with valid JSON in this exact format:
{
  "week_summary": "2-3 sentence overall summary",
  "grades": {
    "fitness": {"grade": "A|B|C|D|F", "score": 85, "reason": "Why this grade"},
    "nutrition": {"grade": "B", "score": 75, "reason": "Why this grade"},
    "sleep": {"grade": "A", "score": 90, "reason": "Why this grade"},
    "mindset": {"grade": "B", "score": 78, "reason": "Why this grade"},
    "business": {"grade": "A", "score": 88, "reason": "Why this grade"},
    "overall": {"grade": "B+", "score": 83, "reason": "Overall assessment"}
  },
  "wins": ["Specific win 1", "Specific win 2"],
  "improvements_needed": ["Specific improvement 1", "Specific improvement 2"],
  "next_week_focus": ["Priority focus area 1", "Priority focus area 2"],
  "body_business_correlation": {
    "insight": "How body performance correlated with business this week",
    "pattern": "Specific pattern observed",
    "recommendation": "How to leverage this connection"
  },
  "streak_status": {
    "current": 14,
    "trend": "growing|stable|at_risk"
  },
  "motivational_close": "Personalized motivational message"
}`;

    const weekData = {
      weight_logs: weightLogs || [],
      meal_logs: mealLogs || [],
      workout_sessions: workoutSessions || [],
      sleep_logs: sleepLogs || [],
      mood_logs: moodLogs || [],
      business_metrics: businessMetrics || [],
      daily_checkins: dailyCheckins || [],
    };

    const userMessage = `Week: ${week_start} to ${week_end}
Data: ${JSON.stringify(weekData)}

Generate a comprehensive weekly report with grades and insights.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        week_summary: aiResponse,
        grades: {},
        wins: [],
        improvements_needed: [],
        next_week_focus: [],
        body_business_correlation: {},
        streak_status: { current: 0, trend: "unknown" },
        motivational_close: "",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
