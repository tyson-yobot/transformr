// =============================================================================
// TRANSFORMR -- Budget-Aware AI Grocery List (Module 5)
// Generates organized grocery lists with estimated costs per item, running
// totals, and budget-swap suggestions when over budget.
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

interface CallClaudeResult {
  text: string;
  tokens_in: number;
  tokens_out: number;
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
): Promise<CallClaudeResult> {
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
  return {
    text: data.content[0].text,
    tokens_in: data.usage?.input_tokens ?? 0,
    tokens_out: data.usage?.output_tokens ?? 0,
  };
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
      },
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

    const body = await req.json();
    const {
      meal_plan,
      dietary_restrictions,
      budget_override,
      household_size,
      existing_pantry,
    } = body;

    // Fetch profile for budget
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("weekly_grocery_budget_usd")
      .eq("id", user.id)
      .maybeSingle();

    const weeklyBudget =
      typeof budget_override === "number"
        ? budget_override
        : typeof profile?.weekly_grocery_budget_usd === "number"
          ? (profile.weekly_grocery_budget_usd as number)
          : 0;

    const systemPrompt =
      COMPLIANCE_PREAMBLE +
      "\n\n" +
      `You are a smart, budget-aware grocery list generator for TRANSFORMR. Create organized grocery lists from meal plans with accurate cost estimates per item, aisle subtotals, and a running total.

When the total exceeds the user's budget, suggest specific budget-friendly swaps that preserve nutrition.

ALWAYS respond with valid JSON matching this exact structure:
{
  "aisles": [
    {
      "name": "Produce",
      "items": [
        {
          "name": "Broccoli",
          "quantity": "3 heads",
          "estimated_cost": 4.50,
          "notes": "Look for crowns — less waste",
          "meals_used_in": ["Monday dinner", "Wednesday lunch"]
        }
      ],
      "aisle_subtotal": 18.50
    }
  ],
  "estimated_total": 85.00,
  "budget_status": "under_budget|on_budget|over_budget",
  "budget_swap_suggestions": [
    {
      "original": "Salmon fillet ($14)",
      "alternative": "Canned wild salmon ($4)",
      "savings": 10.00,
      "nutrition_impact": "Similar protein and omega-3s, less visual appeal"
    }
  ],
  "shopping_tips": ["Buy family pack chicken for better per-lb price"],
  "items_already_have": ["Items from pantry that are covered"]
}

Budget rules:
- under_budget: total is ≤90% of budget
- on_budget: total is 90-105% of budget
- over_budget: total is >105% of budget
- If over_budget, MUST include at least 3 swap suggestions that would bring it under
- Sort aisles in logical store-walk order: Produce → Meat → Dairy → Grains → Canned → Frozen → Snacks → Beverages → Other
- Include aisle_subtotal for each aisle
- estimated_cost per item should reflect US grocery store averages (2024-2025 pricing)`;

    const userMessage = `Meal plan: ${JSON.stringify(meal_plan ?? {})}
Dietary restrictions: ${JSON.stringify(dietary_restrictions ?? [])}
Weekly budget: $${weeklyBudget > 0 ? weeklyBudget : "not set (still estimate costs accurately)"}
Household size: ${household_size ?? 1}
Items already in pantry: ${JSON.stringify(existing_pantry ?? [])}

Generate an organized, budget-aware grocery list with costs for every item.`;

    const result = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = {
          aisles: [],
          estimated_total: 0,
          budget_status: "unknown",
          budget_swap_suggestions: [],
          shopping_tips: [],
          items_already_have: [],
          raw_response: result.text,
        };
      }
    }

    parsed.budget_usd = weeklyBudget;
    parsed.tokens_in = result.tokens_in;
    parsed.tokens_out = result.tokens_out;

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
