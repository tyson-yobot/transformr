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
      macro_targets,
      dietary_restrictions,
      meals_per_day,
      prep_time_hours,
      cooking_skill,
      equipment,
      flavor_preferences,
    } = await req.json();

    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are a meal prep planning AI. Generate a complete weekly meal prep plan optimized for macros.
Include recipes, step-by-step batch cooking instructions, and container organization.

ALWAYS respond with valid JSON:
{
  "prep_day_schedule": {
    "total_time_hours": 3.5,
    "steps": [
      {
        "order": 1,
        "task": "Start rice cooker with 4 cups brown rice",
        "duration_minutes": 5,
        "parallel_note": "While rice cooks, prep vegetables"
      }
    ]
  },
  "meals": [
    {
      "name": "Meal name",
      "type": "breakfast|lunch|dinner|snack",
      "servings": 5,
      "per_serving_macros": {
        "calories": 450,
        "protein_g": 40,
        "carbs_g": 45,
        "fat_g": 12
      },
      "ingredients": [
        {"item": "Chicken breast", "amount": "2.5 lbs"}
      ],
      "instructions": ["Step 1", "Step 2"],
      "storage": "Glass containers, refrigerate up to 5 days",
      "reheat": "Microwave 2-3 minutes"
    }
  ],
  "daily_plan": {
    "monday": {"breakfast": "Meal A", "lunch": "Meal B", "dinner": "Meal C", "snacks": ["Meal D"]},
    "tuesday": {"breakfast": "Meal A", "lunch": "Meal B", "dinner": "Meal C", "snacks": ["Meal D"]}
  },
  "container_plan": {
    "containers_needed": 15,
    "labeling": ["Label format suggestions"]
  },
  "grocery_list_summary": {
    "proteins": ["3 lbs chicken breast"],
    "carbs": ["4 cups brown rice"],
    "vegetables": ["2 heads broccoli"],
    "other": ["Olive oil"]
  },
  "weekly_macro_average": {
    "calories": 2100,
    "protein_g": 180,
    "carbs_g": 200,
    "fat_g": 65
  }
}`;

    const userMessage = `Macro targets: ${JSON.stringify(macro_targets || {})}
Dietary restrictions: ${JSON.stringify(dietary_restrictions || [])}
Meals per day: ${meals_per_day || 4}
Available prep time: ${prep_time_hours || 3} hours
Cooking skill: ${cooking_skill || "intermediate"}
Kitchen equipment: ${JSON.stringify(equipment || ["oven", "stovetop", "microwave"])}
Flavor preferences: ${JSON.stringify(flavor_preferences || [])}

Generate a complete weekly meal prep plan.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        prep_day_schedule: { total_time_hours: 0, steps: [] },
        meals: [],
        daily_plan: {},
        container_plan: { containers_needed: 0, labeling: [] },
        grocery_list_summary: {},
        weekly_macro_average: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
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
