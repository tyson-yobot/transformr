// =============================================================================
// TRANSFORMR -- AI Supplement Advisor (Budget-Aware + Evidence)
// Gathers the user's full context (profile, goals, training, nutrition, sleep,
// labs, current supplements, and budget) and produces tier-ranked,
// evidence-graded supplement recommendations that fit the user's budget.
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

interface RequestBody {
  budget_monthly?: number;
  focus?: string;
}

interface UserContext {
  profile: Record<string, unknown> | null;
  goals: unknown[];
  recentWorkouts: unknown[];
  recentMeals: unknown[];
  recentSleep: unknown[];
  recentMood: unknown[];
  currentSupplements: unknown[];
  labBiomarkers: unknown[];
  supplementBudget: number;
}

// ---------------------------------------------------------------------------
// Context gathering
// ---------------------------------------------------------------------------

async function fetchUserContext(
  supabase: SupabaseClient,
  userId: string,
  budgetOverride?: number,
): Promise<UserContext> {
  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 3600 * 1000,
  ).toISOString();

  const [
    profileRes,
    goalsRes,
    workoutsRes,
    mealsRes,
    sleepRes,
    moodRes,
    supplementsRes,
    biomarkersRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("goals")
      .select("title, category, target_value, current_value, unit, target_date")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(10),
    supabase
      .from("workout_sessions")
      .select("started_at, completed_at, total_volume, notes")
      .eq("user_id", userId)
      .gte("started_at", fourteenDaysAgo)
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("meal_logs")
      .select("logged_at, calories, protein_g, carbs_g, fat_g")
      .eq("user_id", userId)
      .gte("logged_at", fourteenDaysAgo)
      .order("logged_at", { ascending: false })
      .limit(30),
    supabase
      .from("sleep_logs")
      .select("date, duration_hours, quality_score")
      .eq("user_id", userId)
      .gte("date", fourteenDaysAgo.split("T")[0])
      .order("date", { ascending: false })
      .limit(14),
    supabase
      .from("mood_logs")
      .select("logged_at, mood, energy, stress, motivation")
      .eq("user_id", userId)
      .gte("logged_at", fourteenDaysAgo)
      .order("logged_at", { ascending: false })
      .limit(14),
    supabase
      .from("user_supplements")
      .select("name, dosage, timing, tier, priority, evidence_level, monthly_cost, category, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("priority", { ascending: true }),
    supabase
      .from("lab_biomarkers")
      .select("name, value, unit, flag, category, collected_at")
      .eq("user_id", userId)
      .order("collected_at", { ascending: false })
      .limit(40),
  ]);

  const profile = (profileRes.data ?? null) as Record<string, unknown> | null;
  const storedBudget = typeof profile?.supplement_budget_monthly === "number"
    ? profile.supplement_budget_monthly
    : 0;

  return {
    profile,
    goals: goalsRes.data ?? [],
    recentWorkouts: workoutsRes.data ?? [],
    recentMeals: mealsRes.data ?? [],
    recentSleep: sleepRes.data ?? [],
    recentMood: moodRes.data ?? [],
    currentSupplements: supplementsRes.data ?? [],
    labBiomarkers: biomarkersRes.data ?? [],
    supplementBudget: budgetOverride ?? (storedBudget as number),
  };
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(ctx: UserContext, focus: string): string {
  const profile = ctx.profile as {
    display_name?: string;
    sex?: string;
    birth_date?: string;
    height?: number;
    current_weight?: number;
    goal_weight?: number;
  } | null;

  const profileBlock = profile
    ? `User: ${profile.display_name ?? "unknown"}
Sex: ${profile.sex ?? "not provided"}
Birth date: ${profile.birth_date ?? "not provided"}
Height: ${profile.height ?? "not provided"}
Current weight: ${profile.current_weight ?? "not provided"}
Goal weight: ${profile.goal_weight ?? "not provided"}`
    : "Profile: not yet set up.";

  const budgetBlock = ctx.supplementBudget > 0
    ? `Monthly supplement budget: $${ctx.supplementBudget}. Total monthly cost of all "essential" + "recommended" supplements MUST NOT exceed this budget. If the budget is tight, prioritize essential tier first, then recommended, then optional.`
    : "No monthly budget set. Still recommend cost-effective options and include monthly_cost estimates.";

  const currentSuppsBlock = ctx.currentSupplements.length > 0
    ? `Current active supplements:\n${JSON.stringify(ctx.currentSupplements)}`
    : "No current supplements.";

  return `${COMPLIANCE_PREAMBLE}

You are the TRANSFORMR Supplement Advisor. You provide evidence-based, budget-aware supplement recommendations tailored to the user's profile, training, nutrition, sleep, mood, and lab data. You must:
- NEVER diagnose, treat, or cure any condition.
- NEVER recommend prescription drugs or specific brand names.
- ALWAYS frame suggestions as supportive wellness strategies.
- ALWAYS include evidence_level with a realistic assessment.
- ALWAYS include evidence_sources as an array of { "title": "...", "year": number, "type": "meta_analysis" | "rct" | "review" | "observational" | "expert_opinion" } objects.
- Rank recommendations by tier: essential > recommended > optional.
- Within each tier, rank by priority (1 = highest).
- RESPECT the user's budget — total recommended monthly cost should fit within it.
- Reference the user's REAL data when explaining why a supplement is recommended.

${profileBlock}

${budgetBlock}

Active goals: ${JSON.stringify(ctx.goals)}
Recent workouts (14d): ${JSON.stringify(ctx.recentWorkouts)}
Recent meals (14d): ${JSON.stringify(ctx.recentMeals)}
Recent sleep (14d): ${JSON.stringify(ctx.recentSleep)}
Recent mood + energy (14d): ${JSON.stringify(ctx.recentMood)}
Lab biomarkers (most recent): ${JSON.stringify(ctx.labBiomarkers)}
${currentSuppsBlock}

Focus area: ${focus}

RESPONSE FORMAT — respond with strict valid JSON, no prose, no markdown fences:
{
  "recommendations": [
    {
      "name": "Supplement Name",
      "category": "vitamin|mineral|protein|creatine|amino_acid|pre_workout|post_workout|sleep|adaptogen|omega|probiotic|other",
      "dosage": "Dosage string",
      "timing": "morning|pre_workout|post_workout|with_meals|evening|bedtime|as_needed",
      "frequency": "daily|twice_daily|as_needed|training_days",
      "tier": "essential|recommended|optional",
      "priority": 1,
      "evidence_level": "strong|moderate|emerging|anecdotal",
      "evidence_sources": [
        { "title": "Source title", "year": 2024, "type": "meta_analysis" }
      ],
      "monthly_cost": 15.00,
      "reason": "Personalized explanation referencing the user's actual data"
    }
  ],
  "interactions_warnings": [
    {
      "supplements": ["Name A", "Name B"],
      "warning": "Description",
      "severity": "high|medium|low"
    }
  ],
  "daily_schedule": {
    "morning": ["supplement names"],
    "pre_workout": [],
    "post_workout": [],
    "with_meals": [],
    "evening": [],
    "bedtime": []
  },
  "total_estimated_monthly_cost": 75.00,
  "budget_fit": true,
  "budget_notes": "Brief note about budget fit or where to cut if over"
}`;
}

// ---------------------------------------------------------------------------
// Claude call
// ---------------------------------------------------------------------------

async function callClaude(
  systemPrompt: string,
  userMessage: string,
): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
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
// Handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    const body = (await req.json()) as RequestBody;
    const focus = body.focus ?? "general wellness";

    const context = await fetchUserContext(
      supabase,
      user.id,
      body.budget_monthly,
    );
    const systemPrompt = buildSystemPrompt(context, focus);

    const { text: aiResponse, tokensIn, tokensOut } = await callClaude(
      systemPrompt,
      `Please analyze my complete profile and provide personalized, budget-aware supplement recommendations focused on: ${focus}. Return strict JSON only.`,
    );

    // Parse with fence tolerance
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/;
    const match = aiResponse.match(fenceRegex);
    const jsonText = match && match[1] ? match[1].trim() : aiResponse.trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      parsed = {
        recommendations: [],
        interactions_warnings: [],
        daily_schedule: {},
        total_estimated_monthly_cost: 0,
        budget_fit: false,
        budget_notes: "Unable to parse AI response.",
        raw_response: aiResponse,
      };
    }

    return new Response(
      JSON.stringify({
        ...parsed,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
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
