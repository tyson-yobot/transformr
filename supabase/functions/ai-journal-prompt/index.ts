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
      action,
      today_activities,
      journal_entry,
      recent_entries,
    } = await req.json();

    const validActions = ["generate_prompt", "analyze_entry", "coaching_response"];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${validActions.join(", ")}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let systemPrompt: string;
    let userMessage: string;

    if (action === "generate_prompt") {
      systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You generate contextual journal prompts based on the user's activities today.
Prompts should be reflective, growth-oriented, and relevant to their transformation journey.

ALWAYS respond with valid JSON:
{
  "prompts": [
    {"prompt": "The journal prompt question", "category": "fitness|nutrition|mindset|business|gratitude", "depth": "quick|medium|deep"}
  ],
  "theme_of_the_day": "A theme connecting today's activities",
  "reflection_focus": "What to pay attention to while journaling"
}`;
      userMessage = `Today's activities: ${JSON.stringify(today_activities || {})}
Recent journal entries (for variety): ${JSON.stringify(recent_entries || [])}
Generate 3-5 contextual journal prompts.`;
    } else if (action === "analyze_entry") {
      systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You analyze journal entries to find patterns, themes, and growth insights.

ALWAYS respond with valid JSON:
{
  "themes": ["theme1", "theme2"],
  "emotional_tone": "positive|neutral|negative|mixed",
  "energy_level": "high|medium|low",
  "patterns": ["Recurring pattern noticed"],
  "growth_indicators": ["Signs of growth or progress"],
  "concern_flags": ["Any concerning patterns, if any"],
  "summary": "Brief summary of the entry's key insights"
}`;
      userMessage = `Journal entry to analyze: ${journal_entry}
Recent entries for pattern comparison: ${JSON.stringify(recent_entries || [])}`;
    } else {
      systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You provide coaching responses to journal entries. Be empathetic, insightful, and action-oriented.
Reference specific things the user wrote. Help them see new perspectives.

ALWAYS respond with valid JSON:
{
  "response": "Your coaching response (3-5 sentences, warm and insightful)",
  "key_insight": "The most important thing you noticed",
  "question_to_consider": "A follow-up question for deeper reflection",
  "action_suggestion": "One small action based on what they wrote",
  "affirmation": "A personal affirmation based on their entry"
}`;
      userMessage = `Journal entry: ${journal_entry}
Context from recent entries: ${JSON.stringify(recent_entries || [])}
Provide a coaching response.`;
    }

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = { raw_response: aiResponse, action };
    }

    return new Response(JSON.stringify({ action, ...parsed }), {
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
