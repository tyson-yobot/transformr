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

    const {
      front_image_base64,
      side_image_base64,
      back_image_base64,
      previous_analysis,
      current_weight,
      height,
    } = await req.json();

    if (!front_image_base64) {
      return new Response(
        JSON.stringify({ error: "At least front_image_base64 is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are a body composition analysis AI. Analyze progress photos to estimate body composition and track changes.
Be encouraging but honest. Focus on visible muscle development and fat distribution changes.

${previous_analysis ? `Previous analysis for comparison: ${JSON.stringify(previous_analysis)}` : "No previous analysis available."}

ALWAYS respond with valid JSON in this exact format:
{
  "estimated_body_fat_percentage": 18.5,
  "body_fat_range": {"low": 17, "high": 20},
  "muscle_development": {
    "upper_body": "moderate",
    "core": "developing",
    "lower_body": "strong",
    "overall": "good"
  },
  "visible_changes": [
    "Description of visible change from previous"
  ],
  "body_composition_notes": "Overall assessment of current physique",
  "areas_of_progress": ["shoulder definition", "waist reduction"],
  "focus_areas": ["chest development", "core definition"],
  "recommendations": [
    "Specific recommendation based on current physique"
  ],
  "estimated_lean_mass_lbs": 155,
  "confidence": 0.7
}`;

    const imageContent: any[] = [];

    imageContent.push(
      {
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: front_image_base64 },
      },
      { type: "text", text: "Front view" }
    );

    if (side_image_base64) {
      imageContent.push(
        {
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: side_image_base64 },
        },
        { type: "text", text: "Side view" }
      );
    }

    if (back_image_base64) {
      imageContent.push(
        {
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: back_image_base64 },
        },
        { type: "text", text: "Back view" }
      );
    }

    imageContent.push({
      type: "text",
      text: `Analyze body composition. Current weight: ${current_weight || "unknown"}. Height: ${height || "unknown"}. Provide detailed assessment.`,
    });

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
        messages: [{ role: "user", content: imageContent }],
      }),
    });

    const data = await response.json();
    const aiText = data.content[0].text;

    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch {
      parsed = {
        estimated_body_fat_percentage: null,
        body_fat_range: { low: null, high: null },
        muscle_development: { upper_body: "unknown", core: "unknown", lower_body: "unknown", overall: "unknown" },
        visible_changes: [],
        body_composition_notes: aiText,
        areas_of_progress: [],
        focus_areas: [],
        recommendations: [],
        estimated_lean_mass_lbs: null,
        confidence: 0,
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
