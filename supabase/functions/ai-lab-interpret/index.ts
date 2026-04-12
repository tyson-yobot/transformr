// =============================================================================
// TRANSFORMR -- AI Lab Interpreter
// Accepts a base64-encoded image (or PDF page) of a user's lab work, extracts
// biomarkers with Claude vision, and returns a wellness-framed interpretation.
// Writes the interpretation + biomarkers back to the database and updates the
// parent lab_uploads row to status='complete'. Every response is prefaced with
// the compliance preamble and uses reference-range language only.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
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

interface InterpretRequest {
  upload_id: string;
  image_base64: string;
  mime_type: "image/jpeg" | "image/png" | "image/webp";
  collected_at?: string;
  lab_name?: string;
}

type BiomarkerCategory =
  | "metabolic"
  | "lipid"
  | "hormone"
  | "thyroid"
  | "vitamin"
  | "mineral"
  | "inflammation"
  | "liver"
  | "kidney"
  | "blood_count"
  | "other";

type BiomarkerFlag =
  | "low"
  | "normal"
  | "high"
  | "optimal"
  | "suboptimal"
  | "unknown";

interface ParsedBiomarker {
  name: string;
  category: BiomarkerCategory;
  value: number | null;
  unit: string | null;
  reference_low: number | null;
  reference_high: number | null;
  flag: BiomarkerFlag;
  trend_note: string | null;
}

interface ParsedInterpretation {
  overall_summary: string;
  wellness_score: number;
  highlights: string[];
  concerns: string[];
  lifestyle_suggestions: string[];
  follow_up_questions: string[];
  biomarkers: ParsedBiomarker[];
}

// ---------------------------------------------------------------------------
// User context for personalized wellness framing
// ---------------------------------------------------------------------------

interface UserContext {
  profile: {
    display_name?: string;
    sex?: string;
    birth_date?: string;
    height?: number;
    current_weight?: number;
    goal_weight?: number;
  } | null;
  goals: unknown[];
  recentSleep: unknown[];
  recentMood: unknown[];
  previousBiomarkers: Array<{
    name: string;
    value: number | null;
    flag: string | null;
    collected_at: string | null;
  }>;
}

async function fetchUserContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserContext> {
  const [profileRes, goalsRes, sleepRes, moodRes, markersRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("goals")
      .select("title, category, target_value, current_value, unit, target_date")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(10),
    supabase
      .from("sleep_logs")
      .select("date, duration_hours, quality_score")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(7),
    supabase
      .from("mood_logs")
      .select("logged_at, mood, energy, stress")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(7),
    supabase
      .from("lab_biomarkers")
      .select("name, value, flag, collected_at")
      .eq("user_id", userId)
      .order("collected_at", { ascending: false })
      .limit(40),
  ]);

  return {
    profile: profileRes.data ?? null,
    goals: goalsRes.data ?? [],
    recentSleep: sleepRes.data ?? [],
    recentMood: moodRes.data ?? [],
    previousBiomarkers: (markersRes.data ?? []) as UserContext["previousBiomarkers"],
  };
}

// ---------------------------------------------------------------------------
// System prompt construction
// ---------------------------------------------------------------------------

function buildSystemPrompt(context: UserContext): string {
  const profile = context.profile;
  const profileBlock = profile
    ? `User profile:
- Name: ${profile.display_name ?? "not provided"}
- Sex: ${profile.sex ?? "not provided"}
- Birth date: ${profile.birth_date ?? "not provided"}
- Height: ${profile.height ?? "not provided"}
- Current weight: ${profile.current_weight ?? "not provided"}
- Goal weight: ${profile.goal_weight ?? "not provided"}`
    : "User profile: not yet set up.";

  const goalsBlock = context.goals.length > 0
    ? `Active wellness goals:\n${JSON.stringify(context.goals)}`
    : "No active wellness goals set.";

  const sleepBlock = context.recentSleep.length > 0
    ? `Recent sleep (7 days): ${JSON.stringify(context.recentSleep)}`
    : "No recent sleep data.";

  const moodBlock = context.recentMood.length > 0
    ? `Recent mood + energy (7 days): ${JSON.stringify(context.recentMood)}`
    : "No recent mood data.";

  const priorMarkersBlock = context.previousBiomarkers.length > 0
    ? `Prior biomarker history (most recent first, up to 40): ${JSON.stringify(context.previousBiomarkers)}`
    : "No prior biomarker history available.";

  return `${COMPLIANCE_PREAMBLE}

You are the TRANSFORMR Lab Work Interpreter. Your job is to read a photo or scan of a lab report and translate the numbers into supportive, wellness-focused observations. You must:
- NEVER diagnose, treat, or cure any condition.
- NEVER recommend medication, dosing, or the cessation of any medication.
- ALWAYS use language like "outside the typical reference range", "within optimal wellness range", "a supportive lifestyle strategy is...", "consider discussing with your licensed clinician".
- ALWAYS remind the user that wellness data is not a substitute for professional medical advice.
- Reference the user's real profile, goals, and history below when framing observations.
- If you cannot read a value with confidence, mark it as flag: "unknown" and explain why in trend_note.

${profileBlock}

${goalsBlock}

${sleepBlock}

${moodBlock}

${priorMarkersBlock}

RESPONSE FORMAT -- respond with strict valid JSON, no prose, no markdown fences:
{
  "overall_summary": "2-4 sentence wellness-framed summary",
  "wellness_score": 0-100 integer representing overall wellness range alignment (not a diagnosis),
  "highlights": ["positive wellness observations in natural language"],
  "concerns": ["wellness-framed observations worth discussing with a clinician"],
  "lifestyle_suggestions": ["supportive lifestyle, nutrition, sleep, movement suggestions"],
  "follow_up_questions": ["questions the user could bring to their clinician"],
  "biomarkers": [
    {
      "name": "LDL Cholesterol",
      "category": "lipid",
      "value": 112,
      "unit": "mg/dL",
      "reference_low": 0,
      "reference_high": 100,
      "flag": "high",
      "trend_note": "slightly above typical reference range"
    }
  ]
}

category MUST be one of: metabolic, lipid, hormone, thyroid, vitamin, mineral, inflammation, liver, kidney, blood_count, other.
flag MUST be one of: low, normal, high, optimal, suboptimal, unknown.
If a field is not visible on the report, use null for numeric fields.`;
}

// ---------------------------------------------------------------------------
// Claude vision call
// ---------------------------------------------------------------------------

async function callClaudeVision(
  systemPrompt: string,
  imageBase64: string,
  mimeType: string,
  labName: string | undefined,
  collectedAt: string | undefined,
): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
  const userContent = [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType,
        data: imageBase64,
      },
    },
    {
      type: "text",
      text: `Please interpret this lab report. Lab name: ${labName ?? "unknown"}. Collection date: ${collectedAt ?? "unknown"}. Return strict JSON only.`,
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

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";
  const tokensIn = data.usage?.input_tokens ?? 0;
  const tokensOut = data.usage?.output_tokens ?? 0;
  return { text, tokensIn, tokensOut };
}

// ---------------------------------------------------------------------------
// JSON parsing with tolerance for accidental markdown fences
// ---------------------------------------------------------------------------

function parseInterpretation(raw: string): ParsedInterpretation {
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = raw.match(fenceRegex);
  const jsonText = match && match[1] ? match[1].trim() : raw.trim();

  const parsed = JSON.parse(jsonText) as Partial<ParsedInterpretation>;

  const biomarkers: ParsedBiomarker[] = Array.isArray(parsed.biomarkers)
    ? parsed.biomarkers.map((b) => ({
        name: typeof b.name === "string" ? b.name : "Unknown marker",
        category: isCategory(b.category) ? b.category : "other",
        value: typeof b.value === "number" ? b.value : null,
        unit: typeof b.unit === "string" ? b.unit : null,
        reference_low: typeof b.reference_low === "number" ? b.reference_low : null,
        reference_high: typeof b.reference_high === "number" ? b.reference_high : null,
        flag: isFlag(b.flag) ? b.flag : "unknown",
        trend_note: typeof b.trend_note === "string" ? b.trend_note : null,
      }))
    : [];

  return {
    overall_summary: typeof parsed.overall_summary === "string"
      ? parsed.overall_summary
      : "Unable to generate a wellness summary from this report.",
    wellness_score: typeof parsed.wellness_score === "number"
      ? Math.min(100, Math.max(0, Math.round(parsed.wellness_score)))
      : 0,
    highlights: Array.isArray(parsed.highlights)
      ? parsed.highlights.filter((h): h is string => typeof h === "string")
      : [],
    concerns: Array.isArray(parsed.concerns)
      ? parsed.concerns.filter((c): c is string => typeof c === "string")
      : [],
    lifestyle_suggestions: Array.isArray(parsed.lifestyle_suggestions)
      ? parsed.lifestyle_suggestions.filter((s): s is string => typeof s === "string")
      : [],
    follow_up_questions: Array.isArray(parsed.follow_up_questions)
      ? parsed.follow_up_questions.filter((q): q is string => typeof q === "string")
      : [],
    biomarkers,
  };
}

function isCategory(value: unknown): value is BiomarkerCategory {
  return (
    value === "metabolic" ||
    value === "lipid" ||
    value === "hormone" ||
    value === "thyroid" ||
    value === "vitamin" ||
    value === "mineral" ||
    value === "inflammation" ||
    value === "liver" ||
    value === "kidney" ||
    value === "blood_count" ||
    value === "other"
  );
}

function isFlag(value: unknown): value is BiomarkerFlag {
  return (
    value === "low" ||
    value === "normal" ||
    value === "high" ||
    value === "optimal" ||
    value === "suboptimal" ||
    value === "unknown"
  );
}

const LAB_DISCLAIMER =
  "This interpretation is for general wellness and educational purposes only. It is not a diagnosis and it is not a substitute for professional medical advice. Please review your results with a licensed clinician before making any changes to medication, supplementation, or treatment.";

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
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

    const body = (await req.json()) as InterpretRequest;

    if (!body.upload_id || !body.image_base64 || !body.mime_type) {
      return new Response(
        JSON.stringify({
          error: "upload_id, image_base64, and mime_type are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Mark the upload as processing so the UI can reflect state immediately
    const { error: processingErr } = await supabase
      .from("lab_uploads")
      .update({ status: "processing" })
      .eq("id", body.upload_id)
      .eq("user_id", user.id);

    if (processingErr) {
      throw new Error(`Failed to mark upload as processing: ${processingErr.message}`);
    }

    // Gather user context + build prompt
    const context = await fetchUserContext(supabase, user.id);
    const systemPrompt = buildSystemPrompt(context);

    let interpretation: ParsedInterpretation;
    let tokensIn = 0;
    let tokensOut = 0;

    try {
      const result = await callClaudeVision(
        systemPrompt,
        body.image_base64,
        body.mime_type,
        body.lab_name,
        body.collected_at,
      );
      tokensIn = result.tokensIn;
      tokensOut = result.tokensOut;
      interpretation = parseInterpretation(result.text);
    } catch (aiError) {
      await supabase
        .from("lab_uploads")
        .update({ status: "failed" })
        .eq("id", body.upload_id)
        .eq("user_id", user.id);
      throw aiError;
    }

    const latencyMs = Date.now() - startedAt;

    // Persist the interpretation
    const { data: savedInterp, error: interpErr } = await supabase
      .from("lab_interpretations")
      .insert({
        upload_id: body.upload_id,
        user_id: user.id,
        overall_summary: interpretation.overall_summary,
        wellness_score: interpretation.wellness_score,
        highlights: interpretation.highlights,
        concerns: interpretation.concerns,
        lifestyle_suggestions: interpretation.lifestyle_suggestions,
        follow_up_questions: interpretation.follow_up_questions,
        disclaimer_text: LAB_DISCLAIMER,
        model: AI_MODEL,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        latency_ms: latencyMs,
      })
      .select("id")
      .single();

    if (interpErr || !savedInterp) {
      await supabase
        .from("lab_uploads")
        .update({ status: "failed" })
        .eq("id", body.upload_id)
        .eq("user_id", user.id);
      throw new Error(
        `Failed to save interpretation: ${interpErr?.message ?? "unknown"}`,
      );
    }

    // Persist individual biomarkers
    if (interpretation.biomarkers.length > 0) {
      const biomarkerRows = interpretation.biomarkers.map((b) => ({
        upload_id: body.upload_id,
        interpretation_id: savedInterp.id,
        user_id: user.id,
        name: b.name,
        category: b.category,
        value: b.value,
        unit: b.unit,
        reference_low: b.reference_low,
        reference_high: b.reference_high,
        flag: b.flag,
        trend_note: b.trend_note,
        collected_at: body.collected_at ?? null,
      }));

      const { error: biomarkerErr } = await supabase
        .from("lab_biomarkers")
        .insert(biomarkerRows);

      if (biomarkerErr) {
        throw new Error(
          `Failed to save biomarkers: ${biomarkerErr.message}`,
        );
      }
    }

    // Mark the upload complete
    const { error: completeErr } = await supabase
      .from("lab_uploads")
      .update({ status: "complete" })
      .eq("id", body.upload_id)
      .eq("user_id", user.id);

    if (completeErr) {
      throw new Error(`Failed to mark upload complete: ${completeErr.message}`);
    }

    return new Response(
      JSON.stringify({
        upload_id: body.upload_id,
        interpretation_id: savedInterp.id,
        overall_summary: interpretation.overall_summary,
        wellness_score: interpretation.wellness_score,
        highlights: interpretation.highlights,
        concerns: interpretation.concerns,
        lifestyle_suggestions: interpretation.lifestyle_suggestions,
        follow_up_questions: interpretation.follow_up_questions,
        biomarker_count: interpretation.biomarkers.length,
        disclaimer_text: LAB_DISCLAIMER,
        latency_ms: latencyMs,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
