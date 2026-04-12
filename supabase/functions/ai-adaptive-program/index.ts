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
      current_program,
      recent_sessions,
      readiness_score,
      pain_reports,
      goals,
      weeks_on_program,
    } = await req.json();

    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are an adaptive workout programming AI. Analyze recent performance and adjust the program.
Apply progressive overload principles while accounting for recovery, readiness, and pain.

Key principles:
- If all sets completed with good form: increase weight 2.5-5lbs next session
- If RPE consistently below 7: increase volume or weight
- If RPE consistently above 9: reduce volume, maintain intensity
- If pain reported: substitute exercise, reduce load
- Low readiness: reduce volume by 20-30%, maintain key compounds
- Deload every 4-6 weeks

ALWAYS respond with valid JSON:
{
  "program_adjustments": [
    {
      "exercise": "Exercise name",
      "previous": {"weight": 185, "sets": 4, "reps": 8},
      "adjusted": {"weight": 190, "sets": 4, "reps": 8},
      "reason": "Completed all sets at RPE 7, progressive overload",
      "change_type": "increase|decrease|substitute|maintain"
    }
  ],
  "substitutions": [
    {
      "original": "Barbell back squat",
      "replacement": "Leg press",
      "reason": "Lower back pain reported",
      "temporary": true
    }
  ],
  "session_modifications": {
    "volume_adjustment": "+10%|-20%|maintain",
    "intensity_adjustment": "+5lbs|maintain|-10%",
    "rest_periods": "As programmed|Increase by 30s|Decrease by 15s"
  },
  "readiness_based_plan": {
    "readiness_score": 7,
    "recommendation": "Full session|Modified session|Active recovery|Rest day",
    "warmup_modifications": "Additional mobility work for affected areas"
  },
  "progressive_overload_status": {
    "on_track": true,
    "weeks_since_increase": 1,
    "next_progression_target": "Add 5lbs to squat next week",
    "plateau_detected": false
  },
  "deload_recommendation": {
    "needed": false,
    "weeks_until_deload": 2,
    "deload_protocol": "50% volume, 80% intensity for 1 week"
  },
  "next_session": {
    "focus": "Lower body strength",
    "estimated_duration_minutes": 60,
    "exercises": [
      {
        "name": "Exercise",
        "sets": 4,
        "reps": "6-8",
        "weight": 190,
        "rest_seconds": 180,
        "notes": "Focus on depth"
      }
    ]
  }
}`;

    const userMessage = `Current program: ${JSON.stringify(current_program || {})}
Recent sessions (last 2 weeks): ${JSON.stringify(recent_sessions || [])}
Today's readiness score: ${readiness_score || "not measured"}
Pain reports: ${JSON.stringify(pain_reports || [])}
Goals: ${JSON.stringify(goals || {})}
Weeks on current program: ${weeks_on_program || 0}

Analyze performance and generate adjusted program.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        program_adjustments: [],
        substitutions: [],
        session_modifications: {},
        readiness_based_plan: {},
        progressive_overload_status: {},
        deload_recommendation: {},
        next_session: {},
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
