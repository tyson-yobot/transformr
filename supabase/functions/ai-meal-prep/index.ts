// =============================================================================
// TRANSFORMR -- Budget-Aware AI Meal Prep (Module 5)
// Generates tiered meal prep plans (Good / Better / Best) that respect the
// user's weekly grocery budget. Includes full user context + compliance.
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
      max_tokens: 8192,
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

async function gatherUserContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
) {
  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [profileRes, goalsRes, mealsRes, workoutsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("goals")
      .select("title, category, target_value, current_value, unit, target_date")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(10),
    supabase
      .from("meal_logs")
      .select("logged_at, calories, protein_g, carbs_g, fat_g")
      .eq("user_id", userId)
      .gte("logged_at", fourteenDaysAgo)
      .order("logged_at", { ascending: false })
      .limit(30),
    supabase
      .from("workout_sessions")
      .select("started_at, completed_at, total_volume, notes")
      .eq("user_id", userId)
      .gte("started_at", fourteenDaysAgo)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const profile = (profileRes.data ?? null) as Record<string, unknown> | null;
  return {
    profile,
    goals: goalsRes.data ?? [],
    recentMeals: mealsRes.data ?? [],
    recentWorkouts: workoutsRes.data ?? [],
    weeklyGroceryBudget:
      typeof profile?.weekly_grocery_budget_usd === "number"
        ? (profile.weekly_grocery_budget_usd as number)
        : 0,
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
      macro_targets,
      dietary_restrictions,
      meals_per_day,
      prep_time_hours,
      cooking_skill,
      equipment,
      flavor_preferences,
      budget_override,
    } = body;

    const ctx = await gatherUserContext(supabaseClient, user.id);
    const weeklyBudget =
      typeof budget_override === "number"
        ? budget_override
        : ctx.weeklyGroceryBudget;

    const macros = macro_targets ?? {
      calories: ctx.profile?.daily_calorie_target ?? 2000,
      protein_g: ctx.profile?.daily_protein_target ?? 150,
      carbs_g: ctx.profile?.daily_carb_target ?? 200,
      fat_g: ctx.profile?.daily_fat_target ?? 65,
    };

    const systemPrompt =
      COMPLIANCE_PREAMBLE +
      "\n\n" +
      `You are a budget-aware meal prep planning AI for TRANSFORMR. You generate THREE tiers of weekly meal prep plans — Good (budget-friendly), Better (quality upgrade), and Best (premium) — so the user can choose based on their budget.

USER CONTEXT:
- Profile: ${JSON.stringify(ctx.profile ?? {})}
- Active goals: ${JSON.stringify(ctx.goals)}
- Recent meals (14d): ${JSON.stringify(ctx.recentMeals)}
- Recent workouts (14d): ${JSON.stringify(ctx.recentWorkouts)}
- Weekly grocery budget: $${weeklyBudget > 0 ? weeklyBudget : "not set (estimate reasonable costs)"}

TIER DEFINITIONS:
- Good: Budget-friendly staples (chicken thighs, rice, frozen veggies, eggs, oats). Maximizes nutrition per dollar. Target ~60-70% of budget.
- Better: Quality upgrade (chicken breast, quinoa, fresh produce, greek yogurt). Better variety and taste. Target ~85-100% of budget.
- Best: Premium ingredients (salmon, grass-fed beef, organic produce, specialty items). Optimal nutrition and variety. May exceed budget.

ALWAYS respond with valid JSON matching this exact structure:
{
  "tiers": [
    {
      "tier": "good",
      "tier_label": "Good — Budget Friendly",
      "description": "...",
      "estimated_weekly_cost": 65.00,
      "meals": [
        {
          "name": "Meal name",
          "meal_type": "breakfast|lunch|dinner|snack",
          "servings": 5,
          "per_serving_macros": { "calories": 450, "protein_g": 40, "carbs_g": 45, "fat_g": 12 },
          "ingredients": [{ "name": "Chicken thigh", "quantity": "2.5 lbs", "estimated_cost": 6.50 }],
          "instructions": ["Step 1", "Step 2"],
          "prep_time_minutes": 15,
          "cook_time_minutes": 25,
          "storage": "Glass containers, refrigerate up to 5 days",
          "reheat": "Microwave 2-3 minutes",
          "container_label": "Protein - Chicken"
        }
      ],
      "prep_day_schedule": {
        "total_time_hours": 3.0,
        "steps": [
          { "order": 1, "task": "Start rice cooker", "duration_minutes": 5, "parallel_note": "While rice cooks, prep chicken" }
        ]
      },
      "daily_plan": {
        "monday": { "breakfast": "Meal A", "lunch": "Meal B", "dinner": "Meal C", "snacks": ["Meal D"] },
        "tuesday": { "breakfast": "Meal A", "lunch": "Meal B", "dinner": "Meal C", "snacks": ["Meal D"] }
      },
      "weekly_macro_average": { "calories": 2100, "protein_g": 180, "carbs_g": 200, "fat_g": 65 }
    }
  ],
  "container_plan": { "containers_needed": 15, "labeling": ["Label format suggestions"] },
  "cost_comparison_notes": ["Good saves $X vs Better by using...", "Best adds premium protein sources..."]
}

Generate all 7 days (monday-sunday) in each daily_plan. Include ${meals_per_day || 4} meals per day. Match macro targets as closely as possible.`;

    const userMessage = `Macro targets: ${JSON.stringify(macros)}
Dietary restrictions: ${JSON.stringify(dietary_restrictions ?? [])}
Meals per day: ${meals_per_day ?? 4}
Available prep time: ${prep_time_hours ?? 3} hours
Cooking skill: ${cooking_skill ?? "intermediate"}
Kitchen equipment: ${JSON.stringify(equipment ?? ["oven", "stovetop", "microwave"])}
Flavor preferences: ${JSON.stringify(flavor_preferences ?? [])}
Weekly grocery budget: $${weeklyBudget > 0 ? weeklyBudget : "not set"}

Generate a complete tiered weekly meal prep plan with Good, Better, and Best options.`;

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
          tiers: [],
          container_plan: { containers_needed: 0, labeling: [] },
          cost_comparison_notes: [],
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
