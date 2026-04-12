// =============================================================================
// TRANSFORMR -- AI Workout Coach (Module 12)
// Speed-optimized workout generation. Generates complete, periodized workout
// plans based on user history, goals, available equipment, and time.
// =============================================================================

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      workout_type,
      target_muscle_groups,
      available_equipment,
      time_limit_minutes,
      experience_level,
      injuries,
      focus,
    } = body;

    // Gather user context
    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [profileRes, workoutsRes, goalsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("workout_sessions")
        .select("started_at, total_volume, notes, duration_minutes")
        .eq("user_id", user.id)
        .gte("started_at", fourteenDaysAgo)
        .order("started_at", { ascending: false })
        .limit(10),
      supabase
        .from("goals")
        .select("title, category, target_value, current_value")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("category", "fitness")
        .limit(5),
    ]);

    const profile = profileRes.data ?? {};
    const recentWorkouts = workoutsRes.data ?? [];
    const fitnessGoals = goalsRes.data ?? [];

    const systemPrompt =
      COMPLIANCE_PREAMBLE +
      "\n\n" +
      `You are the TRANSFORMR workout coach AI. Generate a complete, ready-to-execute workout plan.

Rules:
- Include warm-up, main work, and cooldown
- Use progressive overload principles based on recent history
- Respect time limit and available equipment
- Include specific sets, reps, rest periods, and RPE targets
- Account for injuries/limitations
- Reference user's actual training history

Return valid JSON:
{
  "workout_name": "Push Day — Chest & Shoulders Focus",
  "estimated_duration_minutes": 45,
  "warmup": [
    { "exercise": "Band pull-aparts", "sets": 2, "reps": 15, "rest_seconds": 30, "notes": "Activation" }
  ],
  "main_work": [
    {
      "exercise": "Barbell Bench Press",
      "sets": 4,
      "reps": "6-8",
      "rest_seconds": 120,
      "rpe": 8,
      "weight_suggestion": "Based on history",
      "notes": "Control eccentric, pause at chest"
    }
  ],
  "finisher": [
    { "exercise": "Push-up AMRAP", "sets": 1, "reps": "Max", "rest_seconds": 0, "notes": "All out" }
  ],
  "cooldown": [
    { "exercise": "Chest doorway stretch", "duration_seconds": 30, "notes": "Each side" }
  ],
  "coaching_notes": [
    "Focus on mind-muscle connection today",
    "Your volume is up 12% this week — great momentum"
  ],
  "next_session_suggestion": "Pull Day — Back & Biceps"
}`;

    const userMessage = `User context:
- Profile: ${JSON.stringify(profile)}
- Recent workouts (14d): ${JSON.stringify(recentWorkouts)}
- Fitness goals: ${JSON.stringify(fitnessGoals)}

Request:
- Workout type: ${workout_type ?? "full body"}
- Target muscles: ${JSON.stringify(target_muscle_groups ?? ["all"])}
- Equipment: ${JSON.stringify(available_equipment ?? ["full gym"])}
- Time limit: ${time_limit_minutes ?? 60} minutes
- Experience: ${experience_level ?? "intermediate"}
- Injuries/limitations: ${JSON.stringify(injuries ?? [])}
- Focus: ${focus ?? "hypertrophy"}

Generate a complete workout plan.`;

    const startTime = Date.now();

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

    const aiData = await response.json();
    const latencyMs = Date.now() - startTime;
    const rawText = aiData.content[0].text;

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { raw_response: rawText };
      }
    }

    parsed.latency_ms = latencyMs;
    parsed.tokens_in = aiData.usage?.input_tokens ?? 0;
    parsed.tokens_out = aiData.usage?.output_tokens ?? 0;

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
