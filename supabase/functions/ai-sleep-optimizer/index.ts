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
      max_tokens: 2048,
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

    const {
      sleep_logs,
      wake_time_goal,
      workout_schedule,
      work_schedule,
      caffeine_habits,
      screen_habits,
    } = await req.json();

    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are a sleep optimization AI. Analyze sleep patterns and provide personalized recommendations.
Use evidence-based sleep science to optimize sleep quality and recovery.

ALWAYS respond with valid JSON:
{
  "sleep_analysis": {
    "average_duration_hours": 6.5,
    "average_quality_score": 6,
    "consistency_score": 5,
    "sleep_debt_hours": 3.5,
    "pattern": "Description of sleep pattern observed"
  },
  "recommendations": {
    "ideal_bedtime": "10:30 PM",
    "ideal_wake_time": "6:00 AM",
    "target_duration_hours": 7.5,
    "wind_down_start": "9:30 PM",
    "wind_down_routine": [
      {"time": "9:30 PM", "activity": "Dim lights, stop work"},
      {"time": "9:45 PM", "activity": "Light stretching or reading"},
      {"time": "10:15 PM", "activity": "Get into bed, breathing exercises"}
    ],
    "morning_routine": [
      {"time": "6:00 AM", "activity": "Wake up, sunlight exposure"},
      {"time": "6:10 AM", "activity": "Hydrate with water"}
    ]
  },
  "cutoff_times": {
    "caffeine_cutoff": "2:00 PM",
    "alcohol_cutoff": "7:00 PM",
    "screen_cutoff": "9:30 PM",
    "heavy_meal_cutoff": "7:30 PM",
    "intense_exercise_cutoff": "7:00 PM"
  },
  "environment_tips": [
    "Keep room temperature between 65-68F",
    "Use blackout curtains"
  ],
  "supplement_suggestions": [
    {"name": "Magnesium glycinate", "dosage": "200-400mg", "timing": "30min before bed"}
  ],
  "weekly_sleep_goal": "Aim for 7.5 hours average with consistent bed/wake times",
  "priority_changes": [
    {"change": "Most important change to make", "impact": "Expected impact on sleep quality"}
  ]
}`;

    const userMessage = `Sleep data (recent logs): ${JSON.stringify(sleep_logs || [])}
Wake time goal: ${wake_time_goal || "not set"}
Workout schedule: ${JSON.stringify(workout_schedule || {})}
Work schedule: ${JSON.stringify(work_schedule || {})}
Caffeine habits: ${JSON.stringify(caffeine_habits || {})}
Screen habits: ${JSON.stringify(screen_habits || {})}

Analyze sleep patterns and provide optimization recommendations.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        sleep_analysis: { pattern: aiResponse },
        recommendations: {},
        cutoff_times: {},
        environment_tips: [],
        supplement_suggestions: [],
        weekly_sleep_goal: "",
        priority_changes: [],
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
