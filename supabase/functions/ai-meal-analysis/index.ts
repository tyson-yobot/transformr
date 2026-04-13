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

    const { image_base64, meal_type, dietary_context } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "image_base64 is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are a nutrition analysis AI. Analyze the food photo and identify all visible foods.
For each food item, estimate macronutrients based on visible portion sizes.

ALWAYS respond with valid JSON in this exact format:
{
  "foods": [
    {
      "name": "Food item name",
      "portion_estimate": "estimated portion size",
      "confidence": 0.85,
      "calories": 250,
      "protein_g": 20,
      "carbs_g": 30,
      "fat_g": 8,
      "fiber_g": 3
    }
  ],
  "totals": {
    "calories": 500,
    "protein_g": 40,
    "carbs_g": 60,
    "fat_g": 16,
    "fiber_g": 6
  },
  "suggestions": ["Suggestion for improving this meal's macro balance"],
  "meal_quality_score": 7.5
}`;

    const userContent = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: image_base64,
        },
      },
      {
        type: "text",
        text: `Analyze this meal photo. Meal type: ${meal_type || "unknown"}. Dietary context: ${dietary_context || "none provided"}. Identify all foods and estimate macros.`,
      },
    ];

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
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await response.json();
    const aiText = data.content[0].text;

    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch {
      parsed = {
        foods: [],
        totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
        suggestions: [aiText],
        meal_quality_score: 0,
      };
    }

    return new Response(JSON.stringify(parsed), {
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
