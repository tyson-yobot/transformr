// =============================================================================
// TRANSFORMR -- AI Screen Insight Generator (Module 6)
// Generates a short, contextual AI micro-insight for a specific screen.
// Caches the result in ai_screen_insights with a 4-hour cooldown.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { COMPLIANCE_PREAMBLE } from "../_shared/compliance.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const AI_MODEL = "claude-sonnet-4-20250514";
const COOLDOWN_HOURS = 4;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCREEN_PROMPTS: Record<string, string> = {
  dashboard:
    "Give a brief, personalized daily insight based on the user's overall data — weight trend, workout consistency, nutrition, sleep, mood. One actionable sentence.",
  "fitness/index":
    "Provide one quick training insight — e.g. suggest rest if overtraining detected, praise consistency, or flag a muscle group that's been neglected.",
  "fitness/progress":
    "Highlight one notable trend in their fitness progress — strength gains, consistency patterns, or a plateau to address.",
  "fitness/form-check":
    "Give one form-related tip based on their recent workout patterns — which exercises might benefit from form review.",
  "nutrition/index":
    "Provide a quick nutrition insight — are they hitting macro targets? Missing meals? Consistent calorie intake?",
  "nutrition/analytics":
    "Identify one pattern in their nutrition data — macro ratios, meal timing, calorie variance, or nutrient gaps.",
  "nutrition/supplements":
    "Give one supplement-stack insight — timing optimization, potential gaps, or interactions to watch.",
  "nutrition/meal-prep":
    "Suggest one meal prep optimization based on their macro targets, budget, and past meal patterns.",
  "goals/index":
    "Provide one goal-progress insight — which goal is on track, which needs attention, any upcoming deadlines.",
  "goals/habits":
    "Identify one habit pattern — longest streak, most-missed habit, or a correlation between habits and outcomes.",
  "goals/sleep":
    "Give one sleep insight — trend in duration/quality, correlation with workout performance or mood.",
  "goals/mood":
    "Highlight one mood pattern — trending direction, correlation with sleep/exercise/nutrition.",
  "goals/journal":
    "Offer one reflective prompt based on recent journal themes or life events.",
  "goals/challenges":
    "Give one challenge insight — progress toward active challenges, motivation based on recent performance.",
  "goals/business/index":
    "Provide one business insight — revenue trend, customer growth, or a metric that needs attention.",
  "goals/finance/index":
    "Give one finance insight — spending trend, budget adherence, or net worth trajectory.",
  "profile/index":
    "Give one overall wellness insight — summarize their current trajectory across all tracked dimensions.",
  "profile/achievements":
    "Highlight an upcoming achievement they're close to earning, or celebrate a recent one.",
};

interface ContextData {
  profile: Record<string, unknown> | null;
  goals: unknown[];
  recentWorkouts: unknown[];
  recentMeals: unknown[];
  recentSleep: unknown[];
  recentMood: unknown[];
}

async function gatherContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<ContextData> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [profileRes, goalsRes, workoutsRes, mealsRes, sleepRes, moodRes] =
    await Promise.all([
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
        .gte("started_at", sevenDaysAgo)
        .order("started_at", { ascending: false })
        .limit(7),
      supabase
        .from("meal_logs")
        .select("logged_at, calories, protein_g, carbs_g, fat_g")
        .eq("user_id", userId)
        .gte("logged_at", sevenDaysAgo)
        .order("logged_at", { ascending: false })
        .limit(21),
      supabase
        .from("sleep_logs")
        .select("date, duration_hours, quality_score")
        .eq("user_id", userId)
        .gte("date", sevenDaysAgo.split("T")[0])
        .order("date", { ascending: false })
        .limit(7),
      supabase
        .from("mood_logs")
        .select("logged_at, mood, energy, stress, motivation")
        .eq("user_id", userId)
        .gte("logged_at", sevenDaysAgo)
        .order("logged_at", { ascending: false })
        .limit(7),
    ]);

  return {
    profile: (profileRes.data ?? null) as Record<string, unknown> | null,
    goals: goalsRes.data ?? [],
    recentWorkouts: workoutsRes.data ?? [],
    recentMeals: mealsRes.data ?? [],
    recentSleep: sleepRes.data ?? [],
    recentMood: moodRes.data ?? [],
  };
}

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

    const { screen_key, force_refresh } = await req.json();

    if (!screen_key || typeof screen_key !== "string") {
      return new Response(
        JSON.stringify({ error: "screen_key is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check cache unless force refresh
    if (!force_refresh) {
      const cutoff = new Date(
        Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000,
      ).toISOString();

      const { data: cached } = await supabase
        .from("ai_screen_insights")
        .select("insight, category, refreshed_at")
        .eq("user_id", user.id)
        .eq("screen_key", screen_key)
        .gte("refreshed_at", cutoff)
        .maybeSingle();

      if (cached) {
        return new Response(
          JSON.stringify({
            insight: cached.insight,
            category: cached.category,
            screen_key,
            cached: true,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Generate fresh insight
    const screenPrompt =
      SCREEN_PROMPTS[screen_key] ??
      "Give one brief, personalized insight relevant to this screen based on the user's data.";

    const ctx = await gatherContext(supabase, user.id);

    const systemPrompt =
      COMPLIANCE_PREAMBLE +
      "\n\n" +
      `You are the TRANSFORMR AI insight engine. Generate a SINGLE short, personalized micro-insight (1-2 sentences max, under 200 characters preferred) for a specific screen in the app.

Rules:
- Reference actual numbers from the user's data
- Be specific, not generic
- Use safe compliance language (may support, research suggests, consider)
- Match the screen context
- Return valid JSON: { "insight": "Your insight text", "category": "fitness|nutrition|sleep|mood|goals|business|finance|general" }`;

    const userMessage = `Screen: ${screen_key}
Screen-specific guidance: ${screenPrompt}

User context:
- Profile: ${JSON.stringify(ctx.profile ?? {})}
- Active goals: ${JSON.stringify(ctx.goals)}
- Recent workouts (7d): ${JSON.stringify(ctx.recentWorkouts)}
- Recent meals (7d): ${JSON.stringify(ctx.recentMeals)}
- Recent sleep (7d): ${JSON.stringify(ctx.recentSleep)}
- Recent mood (7d): ${JSON.stringify(ctx.recentMood)}

Generate one micro-insight for this screen.`;

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
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const aiData = await response.json();
    const rawText: string = aiData.content[0].text ?? "";

    // Strip markdown code fences that Claude sometimes wraps JSON in
    function extractInsight(text: string): { insight: string; category: string } {
      const attempts = [
        text.trim(),
        // Strip ```json ... ``` or ``` ... ```
        text.trim().replace(/^```(?:json)?\s*/s, "").replace(/\s*```\s*$/s, "").trim(),
      ];
      for (const attempt of attempts) {
        if (attempt.startsWith("{")) {
          try {
            const parsed = JSON.parse(attempt);
            if (typeof parsed.insight === "string") {
              return {
                insight: parsed.insight,
                category: typeof parsed.category === "string" ? parsed.category : "general",
              };
            }
          } catch { /* not valid JSON */ }
        }
      }
      // No JSON found — use stripped plain text as insight
      const plain = text.trim().replace(/^```(?:json)?\s*/s, "").replace(/\s*```\s*$/s, "").trim();
      return { insight: plain || text.trim(), category: "general" };
    }

    const { insight, category } = extractInsight(rawText);

    // Upsert cache
    await supabase.from("ai_screen_insights").upsert(
      {
        user_id: user.id,
        screen_key,
        insight,
        category,
        refreshed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,screen_key" },
    );

    return new Response(
      JSON.stringify({
        insight,
        category,
        screen_key,
        cached: false,
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
