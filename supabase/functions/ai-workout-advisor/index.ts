// =============================================================================
// TRANSFORMR -- AI Workout Advisor (Module 12)
// Mid-workout Edge Function that analyzes completed sets and recommends the
// next set's weight/reps using Claude + progressive overload principles.
// Flags high-RPE or volume-drop scenarios for rest recommendations.
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
// Interfaces
// ---------------------------------------------------------------------------

interface CompletedSet {
  weight: number;
  reps: number;
  rpe?: number;
}

interface RecentSession {
  date: string;
  maxWeight: number;
  totalVolume: number;
}

interface WorkoutAdvisorInput {
  userId: string;
  exerciseId: string;
  exerciseName: string;
  completedSets: CompletedSet[];
  userGoal: "strength" | "hypertrophy" | "endurance";
  recentSessions?: RecentSession[];
}

interface SetRecommendation {
  recommendedWeight: number;
  recommendedReps: number;
  recommendedRpe: number;
  rationale: string;
  warningFlag?: string;
}

// ---------------------------------------------------------------------------
// Warning detection
// ---------------------------------------------------------------------------

function detectWarnings(sets: CompletedSet[]): string | undefined {
  if (sets.length === 0) return undefined;

  // Check for high RPE
  const lastSet = sets[sets.length - 1];
  if (lastSet?.rpe !== undefined && lastSet.rpe >= 9) {
    return "RPE 9+ detected — your last set was very demanding. Consider reducing weight or taking extra rest before the next set.";
  }

  // Check for volume drop (>20% from peak)
  if (sets.length >= 3) {
    const peakVolume = Math.max(...sets.map((s) => s.weight * s.reps));
    const lastVolume = (lastSet?.weight ?? 0) * (lastSet?.reps ?? 0);
    if (peakVolume > 0 && (peakVolume - lastVolume) / peakVolume > 0.2) {
      return "Volume has dropped >20% from your peak set — this may indicate fatigue. Listen to your body.";
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const input = (await req.json()) as WorkoutAdvisorInput;

    const {
      userId,
      exerciseId,
      exerciseName,
      completedSets,
      userGoal,
      recentSessions,
    } = input;

    if (!userId || !exerciseId || !exerciseName || !completedSets) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch recent history from DB if not provided
    let sessionHistory = recentSessions;
    if (!sessionHistory || sessionHistory.length === 0) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 3600 * 1000,
      ).toISOString();

      const { data: sessions } = await supabase
        .from("workout_set_logs")
        .select("logged_at, weight, reps")
        .eq("user_id", userId)
        .eq("exercise_id", exerciseId)
        .gte("logged_at", thirtyDaysAgo)
        .order("logged_at", { ascending: false })
        .limit(30);

      if (sessions && sessions.length > 0) {
        // Group by session date
        const byDate = new Map<
          string,
          { maxWeight: number; totalVolume: number }
        >();
        for (const s of sessions as Array<{
          logged_at: string;
          weight: number;
          reps: number;
        }>) {
          const date = s.logged_at.split("T")[0]!;
          const existing = byDate.get(date) ?? {
            maxWeight: 0,
            totalVolume: 0,
          };
          existing.maxWeight = Math.max(existing.maxWeight, s.weight);
          existing.totalVolume += s.weight * s.reps;
          byDate.set(date, existing);
        }
        sessionHistory = [...byDate.entries()].map(([date, agg]) => ({
          date,
          maxWeight: agg.maxWeight,
          totalVolume: agg.totalVolume,
        }));
      }
    }

    // Detect warnings before sending to AI
    const warningFromData = detectWarnings(completedSets);

    // Build context for Claude
    const setsText = completedSets
      .map(
        (s, i) =>
          `Set ${i + 1}: ${s.weight}kg × ${s.reps} reps${s.rpe !== undefined ? ` @ RPE ${s.rpe}` : ""}`,
      )
      .join("\n");

    const historyText =
      sessionHistory && sessionHistory.length > 0
        ? sessionHistory
            .slice(0, 5)
            .map(
              (s) =>
                `${s.date}: max ${s.maxWeight}kg, volume ${s.totalVolume}kg`,
            )
            .join("\n")
        : "No recent history available";

    const systemPrompt =
      COMPLIANCE_PREAMBLE +
      `

You are the TRANSFORMR AI Workout Advisor. Based on the user's completed sets and training history, recommend the optimal next set.

PROGRESSIVE OVERLOAD PRINCIPLES:
- Strength goal: prioritize weight increases when RPE allows (target RPE 7-8). Rep range 3-6.
- Hypertrophy goal: balance weight and volume. Target RPE 7-8.5. Rep range 8-12.
- Endurance goal: prioritize reps over weight. Target RPE 6-7. Rep range 12-20.

RULES:
- Never recommend more than 5% weight increase per set
- If RPE was 9+ last set, recommend same weight or 2.5-5% decrease
- If volume dropped >20%, recommend rest or significant reduction
- Be specific — reference actual numbers
- Respond with ONLY valid JSON, no markdown, no extra text

RESPONSE FORMAT:
{
  "recommendedWeight": <number, kg>,
  "recommendedReps": <number>,
  "recommendedRpe": <number 1-10>,
  "rationale": "<2-3 sentence explanation referencing their data>",
  "warningFlag": "<string or null>"
}`;

    const userMessage = `Exercise: ${exerciseName}
Training goal: ${userGoal}

Today's sets so far:
${setsText}

Recent session history (last 30 days):
${historyText}

Recommend the next set.`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const aiData = await aiRes.json();
    const rawText = aiData?.content?.[0]?.text as string | undefined;

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "AI response was empty" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: SetRecommendation;
    try {
      parsed = JSON.parse(rawText) as SetRecommendation;
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(
          JSON.stringify({ error: "AI returned unparseable response" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      parsed = JSON.parse(jsonMatch[0]) as SetRecommendation;
    }

    // Merge data-layer warning with any AI-detected warning
    const finalWarning =
      warningFromData ??
      (parsed.warningFlag && parsed.warningFlag !== "null"
        ? parsed.warningFlag
        : undefined);

    const recommendation: SetRecommendation = {
      recommendedWeight: Number(parsed.recommendedWeight) || 0,
      recommendedReps: Number(parsed.recommendedReps) || 0,
      recommendedRpe: Number(parsed.recommendedRpe) || 7,
      rationale: parsed.rationale ?? "",
      warningFlag: finalWarning,
    };

    return new Response(JSON.stringify(recommendation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
