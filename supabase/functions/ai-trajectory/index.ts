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

    const {
      current_stats,
      goals,
      history,
      projection_weeks,
    } = await req.json();

    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are a future trajectory simulator for a body-and-business transformation app.
Given the user's current stats, goals, and historical data, generate two detailed future projections.

Projection period: ${projection_weeks || 12} weeks.

ALWAYS respond with valid JSON in this exact format:
{
  "current_path": {
    "description": "What happens if the user continues current patterns",
    "weight_projection": [{"week": 1, "weight": 200}, {"week": 4, "weight": 198}],
    "fitness_projection": {"strength_change": "-5%", "endurance_change": "0%", "body_fat_change": "+1%"},
    "revenue_projection": [{"week": 1, "revenue": 5000}, {"week": 4, "revenue": 5100}],
    "mood_trajectory": "declining",
    "risk_factors": ["Burnout risk", "Plateau likely"]
  },
  "optimal_path": {
    "description": "What happens with full commitment to the plan",
    "weight_projection": [{"week": 1, "weight": 200}, {"week": 4, "weight": 195}],
    "fitness_projection": {"strength_change": "+15%", "endurance_change": "+20%", "body_fat_change": "-3%"},
    "revenue_projection": [{"week": 1, "revenue": 5000}, {"week": 4, "revenue": 6500}],
    "mood_trajectory": "improving",
    "milestones": ["First visible abs by week 8", "Revenue target hit by week 10"]
  },
  "key_differences": [
    {
      "area": "fitness|business|health|mindset",
      "current_outcome": "Description of current path outcome",
      "optimal_outcome": "Description of optimal path outcome",
      "impact": "Why this difference matters"
    }
  ],
  "actionable_changes": [
    {
      "change": "Specific behavior change",
      "effort": "low|medium|high",
      "impact": "high|medium|low",
      "start_today": true
    }
  ],
  "motivation_hook": "A compelling one-liner about the gap between the two futures"
}`;

    const userMessage = `Current stats: ${JSON.stringify(current_stats || {})}
Goals: ${JSON.stringify(goals || {})}
Recent history (last 4 weeks): ${JSON.stringify(history || {})}
Projection period: ${projection_weeks || 12} weeks

Generate two future trajectories: current path vs optimal path.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        current_path: { description: aiResponse },
        optimal_path: { description: "Unable to parse" },
        key_differences: [],
        actionable_changes: [],
        motivation_hook: "",
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
