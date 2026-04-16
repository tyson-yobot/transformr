// =============================================================================
// TRANSFORMR -- Workout Narrator (Module 12)
// Real-time AI narration called after each set completion during a workout.
// Generates a spoken narration snippet, classifies the tip type, and
// recommends an evidence-based rest period for the next set.
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CoachingTone = "drill_sergeant" | "motivational" | "balanced" | "calm";
type TipType =
  | "form"
  | "motivation"
  | "adjustment"
  | "pr_celebration"
  | "rest_timing";

interface PreviousSet {
  reps: number;
  weight: number;
  rpe?: number;
}

interface NarratorRequestBody {
  sessionId: string;
  exerciseName: string;
  setNumber: number;
  repsCompleted: number;
  weightUsed: number;
  targetReps: number;
  targetWeight: number;
  previousSets: PreviousSet[];
  exercisePR?: number;
  coachingTone: CoachingTone;
}

interface NarratorResponse {
  narration: string;
  tipType: TipType;
  restSeconds: number;
}

interface ClaudeNarratorOutput {
  narration: string;
  tipType: TipType;
  restSecondsOverride?: number;
}

// ---------------------------------------------------------------------------
// Rest time calculation
// ---------------------------------------------------------------------------

const COMPOUND_KEYWORDS = [
  "squat",
  "deadlift",
  "bench",
  "overhead press",
  "ohp",
  "barbell row",
  "bent over row",
  "pull-up",
  "pullup",
  "chin-up",
  "chinup",
  "power clean",
  "clean",
  "snatch",
  "hip thrust",
  "romanian deadlift",
  "rdl",
];

function isCompoundExercise(exerciseName: string): boolean {
  const lower = exerciseName.toLowerCase();
  return COMPOUND_KEYWORDS.some((kw) => lower.includes(kw));
}

function calculateBaseRestSeconds(
  exerciseName: string,
  repsCompleted: number,
  targetReps: number,
): number {
  const compound = isCompoundExercise(exerciseName);
  // Base rest window
  let rest = compound ? 150 : 75; // midpoint of 120-180 and 60-90

  const repDelta = repsCompleted - targetReps;

  if (repDelta >= 2) {
    // Exceeded target — athlete is fresh; shorten rest slightly
    rest -= 15;
  } else if (repDelta <= -2) {
    // Missed target — needs more recovery
    rest += 30;
  }

  // Clamp to allowed range
  return Math.max(60, Math.min(300, rest));
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function toneDescription(tone: CoachingTone): string {
  switch (tone) {
    case "drill_sergeant":
      return 'Blunt, no-nonsense accountability. Short, direct sentences. No coddling. Example: "Weight felt heavy. Control the descent next set." Never cruel, always purposeful.';
    case "motivational":
      return 'High-energy hype. Celebrate the effort with genuine excitement. Example: "That was POWERFUL — you are absolutely crushing it!" Build the athlete up.';
    case "balanced":
      return "Data-driven, professional, neutral. Lead with numbers, follow with concise insight. No emotional language.";
    case "calm":
      return 'Gentle, patient, no pressure. Acknowledge effort over outcome. Example: "Nice steady pace on those reps. Let your breath settle before the next set."';
  }
}

function buildSystemPrompt(
  body: NarratorRequestBody,
  readinessScore: number | null,
  profileTone: CoachingTone,
): string {
  const effectiveTone: CoachingTone = body.coachingTone ?? profileTone;

  const repDelta = body.repsCompleted - body.targetReps;
  const repStatus =
    repDelta > 0
      ? `exceeded target by ${repDelta} rep(s)`
      : repDelta < 0
      ? `missed target by ${Math.abs(repDelta)} rep(s)`
      : "hit target exactly";

  const prContext =
    body.exercisePR != null
      ? `User's all-time PR for ${body.exerciseName}: ${body.exercisePR} lbs. Weight used this set: ${body.weightUsed} lbs.`
      : `No PR on record for ${body.exerciseName}.`;

  const previousSetsText =
    body.previousSets.length > 0
      ? body.previousSets
          .map(
            (s, i) =>
              `Set ${i + 1}: ${s.reps} reps @ ${s.weight} lbs${s.rpe != null ? ` (RPE ${s.rpe})` : ""}`,
          )
          .join("\n")
      : "This is the first set.";

  const readinessText =
    readinessScore != null
      ? `Today's readiness score: ${readinessScore}/100.`
      : "Readiness score: not available for today.";

  return `${COMPLIANCE_PREAMBLE}

You are TRANSFORMR's real-time workout narrator — a concise in-ear coach that speaks to the athlete immediately after each set. Your output is read aloud via text-to-speech, so keep it natural, energetic, and brief.

CURRENT COACHING TONE: ${effectiveTone}
Tone guidance: ${toneDescription(effectiveTone)}

WORKOUT CONTEXT:
- Exercise: ${body.exerciseName}
- Set ${body.setNumber} just completed
- Reps completed: ${body.repsCompleted} (target was ${body.targetReps}) — ${repStatus}
- Weight used: ${body.weightUsed} lbs (target: ${body.targetWeight} lbs)
- ${prContext}
- ${readinessText}

PREVIOUS SETS THIS EXERCISE:
${previousSetsText}

YOUR TASK:
Respond ONLY with a valid JSON object — no markdown, no prose, no code fences. The object must have exactly these fields:

{
  "narration": "<1-2 sentences spoken aloud, matching the coaching tone above>",
  "tipType": "<one of: form | motivation | adjustment | pr_celebration | rest_timing>",
  "restSecondsOverride": <optional integer 60-300, omit if you have no specific reason to deviate from the default>
}

TIP TYPE SELECTION GUIDE:
- "pr_celebration" — if the weight equals or exceeds their all-time PR
- "form" — if the previous set data or rep count suggests a form cue is the most useful next step
- "adjustment" — if they missed or significantly exceeded the target (suggest load/rep change)
- "rest_timing" — if readiness is low (<50) or they are clearly fatigued across sets
- "motivation" — default when performance is on track and the main need is encouragement

NARRATION RULES:
- 1-2 sentences maximum — this is spoken via TTS
- Do NOT say "rest" amounts in the narration (that is shown separately in the UI)
- Do NOT start with "Great job" or "Nice work" as the first words — vary the opener
- Reference actual numbers from the workout context
- Never claim to diagnose or treat anything; frame everything as performance coaching
- Do not include markdown, line breaks, or extra explanation outside the JSON`;
}

// ---------------------------------------------------------------------------
// Claude API call
// ---------------------------------------------------------------------------

async function callClaude(systemPrompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 256,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: "Generate the post-set narration now.",
        },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "";
  return text;
}

// ---------------------------------------------------------------------------
// Parse Claude's JSON output
// ---------------------------------------------------------------------------

function parseClaudeOutput(
  rawText: string,
  fallbackTipType: TipType,
): ClaudeNarratorOutput {
  // Strip potential markdown code fences
  const cleaned = rawText.replace(/```[a-z]*\n?/gi, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Claude deviated from JSON format — extract narration text as fallback
    return {
      narration: cleaned.slice(0, 200),
      tipType: fallbackTipType,
    };
  }

  const narration =
    typeof parsed.narration === "string" && parsed.narration.trim().length > 0
      ? parsed.narration.trim()
      : "Keep pushing — you're building strength with every set.";

  const validTipTypes: TipType[] = [
    "form",
    "motivation",
    "adjustment",
    "pr_celebration",
    "rest_timing",
  ];
  const tipType: TipType =
    typeof parsed.tipType === "string" &&
    validTipTypes.includes(parsed.tipType as TipType)
      ? (parsed.tipType as TipType)
      : fallbackTipType;

  const restSecondsOverride =
    typeof parsed.restSecondsOverride === "number" &&
    parsed.restSecondsOverride >= 60 &&
    parsed.restSecondsOverride <= 300
      ? parsed.restSecondsOverride
      : undefined;

  return { narration, tipType, restSecondsOverride };
}

// ---------------------------------------------------------------------------
// Derive a sensible fallback tip type without Claude
// ---------------------------------------------------------------------------

function deriveFallbackTipType(
  body: NarratorRequestBody,
): TipType {
  if (body.exercisePR != null && body.weightUsed >= body.exercisePR) {
    return "pr_celebration";
  }
  const repDelta = body.repsCompleted - body.targetReps;
  if (Math.abs(repDelta) >= 2) return "adjustment";
  return "motivation";
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth + Supabase client
    const supabase = createClient(
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
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate request body
    let body: NarratorRequestBody;
    try {
      body = (await req.json()) as NarratorRequestBody;
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Required field validation
    const required: Array<keyof NarratorRequestBody> = [
      "sessionId",
      "exerciseName",
      "setNumber",
      "repsCompleted",
      "weightUsed",
      "targetReps",
      "targetWeight",
      "coachingTone",
    ];
    for (const field of required) {
      if (body[field] == null) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Fetch today's readiness score and profile in parallel
    const today = new Date().toISOString().split("T")[0];

    const [readinessRes, profileRes] = await Promise.all([
      supabase
        .from("readiness_scores")
        .select("score")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("coaching_tone")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    const readinessScore: number | null =
      (readinessRes.data as { score: number } | null)?.score ?? null;

    const profileTone: CoachingTone =
      ((profileRes.data as { coaching_tone?: string } | null)
        ?.coaching_tone as CoachingTone) ?? "balanced";

    // Calculate base rest time before calling Claude
    const baseRestSeconds = calculateBaseRestSeconds(
      body.exerciseName,
      body.repsCompleted,
      body.targetReps,
    );

    // Build prompt and call Claude
    const systemPrompt = buildSystemPrompt(body, readinessScore, profileTone);

    let narration: string;
    let tipType: TipType;
    let restSeconds: number = baseRestSeconds;

    try {
      const rawText = await callClaude(systemPrompt);
      const fallbackTipType = deriveFallbackTipType(body);
      const parsed = parseClaudeOutput(rawText, fallbackTipType);

      narration = parsed.narration;
      tipType = parsed.tipType;

      // Honour Claude's override only if it is a valid range
      if (parsed.restSecondsOverride != null) {
        restSeconds = parsed.restSecondsOverride;
      }
    } catch (claudeErr) {
      console.error("[workout-narrator] Claude call failed:", claudeErr);
      // Graceful degradation — return a sensible default narration
      tipType = deriveFallbackTipType(body);
      narration =
        body.repsCompleted >= body.targetReps
          ? `${body.repsCompleted} reps at ${body.weightUsed} lbs — stay focused for the next set.`
          : `${body.repsCompleted} out of ${body.targetReps} target reps — note the fatigue and adjust if needed.`;
    }

    const responsePayload: NarratorResponse = {
      narration,
      tipType,
      restSeconds,
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[workout-narrator] Unhandled error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
