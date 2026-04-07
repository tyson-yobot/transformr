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
      meal_plan,
      dietary_restrictions,
      budget,
      household_size,
      existing_pantry,
    } = await req.json();

    const systemPrompt = `You are a smart grocery list generator. Create organized, efficient grocery lists from meal plans.
Consider dietary restrictions, budget constraints, and what the user already has.

ALWAYS respond with valid JSON:
{
  "aisles": [
    {
      "name": "Produce",
      "items": [
        {
          "name": "Chicken breast",
          "quantity": "3 lbs",
          "estimated_cost": 12.00,
          "notes": "Look for family pack for better value",
          "meals_used_in": ["Monday dinner", "Wednesday lunch"]
        }
      ]
    }
  ],
  "budget_alternatives": [
    {
      "original": "Salmon fillet",
      "alternative": "Canned wild salmon",
      "savings": 8.00,
      "nutrition_impact": "Similar protein and omega-3s"
    }
  ],
  "estimated_total": 85.00,
  "budget_status": "under_budget|on_budget|over_budget",
  "shopping_tips": ["Buy in bulk for items used multiple times", "Check store flyer for sales"],
  "items_already_have": ["Items from pantry that are covered"]
}`;

    const userMessage = `Meal plan: ${JSON.stringify(meal_plan || {})}
Dietary restrictions: ${JSON.stringify(dietary_restrictions || [])}
Weekly budget: $${budget || "no limit"}
Household size: ${household_size || 1}
Items already in pantry: ${JSON.stringify(existing_pantry || [])}

Generate an organized grocery list.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        aisles: [],
        budget_alternatives: [],
        estimated_total: 0,
        budget_status: "unknown",
        shopping_tips: [],
        items_already_have: [],
        raw_response: aiResponse,
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
