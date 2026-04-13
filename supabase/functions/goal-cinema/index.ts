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
      system: COMPLIANCE_PREAMBLE + "\n\n" + systemPrompt,
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

    const userId = user.id;

    // Fetch user data for the cinema experience
    const [
      { data: profile },
      { data: weightLogs },
      { data: prs },
      { data: achievements },
      { data: streak },
      { data: goals },
    ] = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("id", userId).single(),
      supabaseClient.from("weight_logs").select("weight_lbs, logged_at").eq("user_id", userId).order("logged_at").limit(100),
      supabaseClient.from("personal_records").select("*").eq("user_id", userId).order("achieved_at", { ascending: false }).limit(10),
      supabaseClient.from("user_achievements").select("*, achievement_id").eq("user_id", userId).order("earned_at", { ascending: false }).limit(10),
      supabaseClient.from("streaks").select("current_count, longest_count").eq("user_id", userId).eq("streak_type", "daily_checkin").single(),
      supabaseClient.from("user_goals").select("*").eq("user_id", userId).eq("status", "active"),
    ]);

    const systemPrompt = `You are creating a motivational "Goal Cinema" slideshow experience. Generate slide data for an immersive, cinematic review of the user's transformation journey.
Each slide should be emotionally engaging and visually descriptive. This is like a personal highlight reel.

ALWAYS respond with valid JSON:
{
  "title": "Your Transformation Story",
  "total_slides": 8,
  "slides": [
    {
      "order": 1,
      "type": "intro|stat|comparison|achievement|pr|quote|future|outro",
      "headline": "Bold headline text",
      "subtext": "Supporting detail text",
      "stat_value": "185 lbs",
      "stat_label": "Starting Weight",
      "background_mood": "epic|calm|energetic|reflective|triumphant",
      "animation": "fade_in|slide_up|zoom|counter",
      "duration_seconds": 5,
      "comparison": {
        "before": "Starting value or state",
        "after": "Current value or state",
        "change": "+15% stronger"
      }
    }
  ],
  "soundtrack_mood": "inspirational_buildup",
  "closing_message": "Personalized motivational closing",
  "share_summary": "Short text summary for sharing"
}`;

    const userData = {
      profile: profile || {},
      weight_journey: weightLogs || [],
      recent_prs: prs || [],
      achievements: achievements || [],
      streak: streak || { current_count: 0, longest_count: 0 },
      active_goals: goals || [],
    };

    const userMessage = `Create a Goal Cinema experience from this user data:
${JSON.stringify(userData)}

Generate 6-10 cinematic slides highlighting their journey, progress, and future.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        title: "Your Journey",
        slides: [],
        closing_message: aiResponse,
        share_summary: "",
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
