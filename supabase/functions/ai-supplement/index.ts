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
      goals,
      current_diet,
      activity_level,
      current_supplements,
      health_conditions,
      age,
      sex,
    } = await req.json();

    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are a supplement recommendation AI. Provide evidence-based supplement recommendations.
IMPORTANT: Always include a disclaimer that this is not medical advice and users should consult a healthcare provider.

ALWAYS respond with valid JSON:
{
  "recommendations": [
    {
      "name": "Supplement name",
      "purpose": "Why this supplement for this user",
      "dosage": "Recommended dosage",
      "timing": "When to take it",
      "priority": "essential|recommended|optional",
      "evidence_level": "strong|moderate|emerging",
      "estimated_monthly_cost": 15.00
    }
  ],
  "interactions_warnings": [
    {
      "supplements": ["Supplement A", "Supplement B"],
      "warning": "Description of interaction or warning",
      "severity": "high|medium|low"
    }
  ],
  "daily_schedule": {
    "morning": ["Supplement with breakfast"],
    "pre_workout": ["Supplement 30min before"],
    "post_workout": ["Supplement within 30min after"],
    "evening": ["Supplement with dinner"],
    "bedtime": ["Supplement before sleep"]
  },
  "total_estimated_monthly_cost": 75.00,
  "disclaimer": "This is not medical advice. Consult a healthcare provider before starting any supplement regimen."
}`;

    const userMessage = `User profile:
- Goals: ${JSON.stringify(goals || {})}
- Current diet summary: ${JSON.stringify(current_diet || {})}
- Activity level: ${activity_level || "moderate"}
- Current supplements: ${JSON.stringify(current_supplements || [])}
- Health conditions: ${JSON.stringify(health_conditions || [])}
- Age: ${age || "not provided"}
- Sex: ${sex || "not provided"}

Provide personalized supplement recommendations.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        recommendations: [],
        interactions_warnings: [],
        daily_schedule: {},
        total_estimated_monthly_cost: 0,
        disclaimer: "This is not medical advice. Consult a healthcare provider before starting any supplement regimen.",
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
