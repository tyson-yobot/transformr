import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      max_tokens: 1024,
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
      mood,
      streak_count,
      progress,
      recent_achievements,
      daily_quote_mode,
    } = await req.json();

    const validTypes = [
      "encouragement",
      "accountability",
      "celebration",
      "challenge",
    ];
    const motivationType = validTypes.includes(type) ? type : "encouragement";

    const systemPrompt = `You are a motivational coach for a body-and-business transformation app.
Your tone adapts based on the motivation type:
- encouragement: Warm, supportive, empathetic. For when the user is struggling.
- accountability: Direct, firm but fair. For when the user is slacking.
- celebration: Enthusiastic, proud. For when the user achieves something.
- challenge: Bold, provocative. Push the user to their next level.

${daily_quote_mode ? "This is DAILY QUOTE MODE. Provide a short, powerful quote with brief context." : ""}

ALWAYS respond with valid JSON in this exact format:
{
  "headline": "Short punchy headline (max 10 words)",
  "message": "Main motivational message (2-4 sentences, personal and powerful)",
  "action_prompt": "One specific thing to do right now",
  "type": "${motivationType}",
  "intensity": 1-10,
  ${daily_quote_mode ? '"quote": "The motivational quote", "quote_author": "Author name",' : ""}
  "emoji_mood": "fire|muscle|brain|heart|star|trophy"
}`;

    const userMessage = `User state:
- Current mood: ${mood || "unknown"}
- Current streak: ${streak_count || 0} days
- Recent progress: ${JSON.stringify(progress || {})}
- Recent achievements: ${JSON.stringify(recent_achievements || [])}
- Motivation type: ${motivationType}
${daily_quote_mode ? "- Mode: Daily quote" : ""}

Generate personalized motivation.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        headline: "Keep Going",
        message: aiResponse,
        action_prompt: "Take one step forward right now.",
        type: motivationType,
        intensity: 5,
        emoji_mood: "fire",
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
