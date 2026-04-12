// =============================================================================
// TRANSFORMR -- AI Post-Workout Analysis (Module 12)
// Analyzes a completed workout session and provides feedback on volume,
// intensity, progressive overload, and recovery recommendations.
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

    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch the workout session and exercises
    const [sessionRes, exercisesRes, recentRes, profileRes] =
      await Promise.all([
        supabase
          .from("workout_sessions")
          .select("*")
          .eq("id", session_id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("workout_exercises")
          .select("*")
          .eq("session_id", session_id)
          .order("order_index", { ascending: true }),
        supabase
          .from("workout_sessions")
          .select("started_at, total_volume, duration_minutes")
          .eq("user_id", user.id)
          .neq("id", session_id)
          .order("started_at", { ascending: false })
          .limit(10),
        supabase
          .from("profiles")
          .select("display_name, goal_direction")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

    if (!sessionRes.data) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const systemPrompt =
      COMPLIANCE_PREAMBLE +
      "\n\n" +
      `You are the TRANSFORMR post-workout analyst. Analyze the completed workout and provide detailed, data-driven feedback.

Return valid JSON:
{
  "overall_rating": "A+|A|B+|B|C+|C|D",
  "summary": "One sentence summary of the workout",
  "volume_analysis": "Analysis of total volume vs recent sessions",
  "intensity_notes": "Analysis of intensity/RPE",
  "progressive_overload": "How this session compares to previous ones",
  "recovery_recommendation": "What to do for recovery",
  "nutrition_window": "Post-workout nutrition suggestion",
  "next_workout_suggestion": "What to train next and when",
  "highlights": ["Positive observations"],
  "areas_to_improve": ["Constructive feedback"]
}`;

    const userMessage = `Completed workout session:
${JSON.stringify(sessionRes.data)}

Exercises performed:
${JSON.stringify(exercisesRes.data ?? [])}

Recent session history:
${JSON.stringify(recentRes.data ?? [])}

User: ${JSON.stringify(profileRes.data ?? {})}

Analyze this workout.`;

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

    const aiData = await response.json();
    const rawText = aiData.content[0].text;

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { summary: rawText };
      }
    }

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
