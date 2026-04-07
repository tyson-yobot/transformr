import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { frames_base64, exercise_name, user_experience } = await req.json();

    if (!frames_base64 || !Array.isArray(frames_base64) || frames_base64.length === 0) {
      return new Response(
        JSON.stringify({ error: "frames_base64 array is required with at least one frame" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `You are an expert exercise form analyst. Analyze the provided video frames of an exercise being performed.
Evaluate form quality, identify issues, and provide corrections.

ALWAYS respond with valid JSON in this exact format:
{
  "exercise_detected": "Exercise name",
  "form_score": 7.5,
  "overall_assessment": "Brief overall assessment",
  "issues": [
    {
      "body_part": "lower back",
      "issue": "Excessive rounding during the lift",
      "severity": "high",
      "frame_noticed": 3
    }
  ],
  "corrections": [
    {
      "priority": 1,
      "instruction": "Specific correction instruction",
      "cue": "Short verbal cue to remember"
    }
  ],
  "injury_risk": {
    "level": "moderate",
    "areas": ["lower back", "knees"],
    "recommendation": "Reduce weight and focus on form before progressing"
  },
  "positive_notes": ["What the user is doing well"]
}`;

    const imageContent = frames_base64.map(
      (frame: string, index: number) => [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: frame,
          },
        },
        {
          type: "text",
          text: `Frame ${index + 1} of ${frames_base64.length}`,
        },
      ]
    ).flat();

    imageContent.push({
      type: "text",
      text: `Exercise: ${exercise_name || "please identify"}. User experience level: ${user_experience || "unknown"}. Analyze form across all frames.`,
    } as any);

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
        exercise_detected: exercise_name || "unknown",
        form_score: 0,
        overall_assessment: aiText,
        issues: [],
        corrections: [],
        injury_risk: { level: "unknown", areas: [], recommendation: aiText },
        positive_notes: [],
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
