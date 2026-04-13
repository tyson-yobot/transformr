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

    const { image_base64, dietary_goals, restrictions } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "image_base64 is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are a restaurant menu nutrition analyst. Analyze the menu photo and identify all menu items.
For each item, estimate macronutrients based on typical restaurant preparation.

User dietary goals: ${JSON.stringify(dietary_goals || {})}
Dietary restrictions: ${JSON.stringify(restrictions || [])}

ALWAYS respond with valid JSON in this exact format:
{
  "restaurant_type": "Type of cuisine detected",
  "items": [
    {
      "name": "Menu item name",
      "description": "Brief description",
      "estimated_calories": 650,
      "estimated_protein_g": 35,
      "estimated_carbs_g": 45,
      "estimated_fat_g": 28,
      "diet_friendly": true,
      "recommendation": "good_choice|okay|avoid",
      "modification_tips": ["Ask for dressing on the side"]
    }
  ],
  "top_picks": ["Best item name for your goals"],
  "items_to_avoid": ["Item name - reason"],
  "ordering_strategy": "Brief strategy for eating at this restaurant while hitting macros"
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
        text: "Analyze this restaurant menu. Identify all items and estimate their nutritional content.",
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
        max_tokens: 4096,
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
        restaurant_type: "unknown",
        items: [],
        top_picks: [],
        items_to_avoid: [],
        ordering_strategy: aiText,
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
