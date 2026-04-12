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
      type,
      weight,
      goals,
      recent_data,
      countdown,
    } = await req.json();

    const validTypes = [
      "morning_briefing",
      "evening_reflection",
      "workout_advice",
    ];
    if (!validTypes.includes(type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are TRANSFORMR AI Coach, a personalized fitness and life transformation coach.
You provide actionable, motivating, and specific advice based on the user's data.

Coaching type: ${type}

Guidelines by type:
- morning_briefing: Energizing start to the day, preview of goals, quick wins to target.
- evening_reflection: Review of the day's progress, celebrate wins, identify tomorrow's focus.
- workout_advice: Specific workout recommendations based on current stats and goals.

ALWAYS respond with valid JSON in this exact format:
{
  "message": "Main coaching message (2-4 sentences, personal and motivating)",
  "suggestions": ["Specific actionable suggestion 1", "Suggestion 2", "Suggestion 3"],
  "priority": "high|medium|low",
  "category": "fitness|nutrition|mindset|recovery|business"
}`;

    const userMessage = `User context:
- Current weight: ${weight || "not provided"}
- Goals: ${JSON.stringify(goals || {})}
- Recent data: ${JSON.stringify(recent_data || {})}
- Countdown/deadline: ${countdown || "not set"}
- Coaching type requested: ${type}

Provide personalized coaching advice.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        message: aiResponse,
        suggestions: [],
        priority: "medium",
        category: "fitness",
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
