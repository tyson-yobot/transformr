// =============================================================================
// TRANSFORMR -- AI Chat Coach
// Full-context conversational coach. Gathers the user's profile, goals,
// training load, nutrition, sleep, supplements, lab results, business metrics,
// and streaks before every reply. Every response is prefaced with the
// compliance preamble and uses safe wellness language.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { COMPLIANCE_PREAMBLE } from "../_shared/compliance.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const AI_MODEL = "claude-sonnet-4-20250514";
const HISTORY_LIMIT = 20;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Request + response types
// ---------------------------------------------------------------------------

interface ChatRequestBody {
  conversation_id?: string | null;
  message: string;
  topic?:
    | "general"
    | "training"
    | "nutrition"
    | "supplements"
    | "sleep"
    | "mindset"
    | "business"
    | "goals"
    | "labs"
    | "recovery";
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface UserContext {
  profile: Record<string, unknown> | null;
  goals: unknown[];
  weightLogs: unknown[];
  recentWorkouts: unknown[];
  recentMeals: unknown[];
  recentSleep: unknown[];
  recentMood: unknown[];
  supplements: unknown[];
  businessMetrics: unknown[];
  dailyCheckins: unknown[];
  streakDays: number;
  countdown: {
    title: string;
    target_date: string;
    days_remaining: number;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((b.getTime() - a.getTime()) / msPerDay);
}

async function fetchUserContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserContext> {
  const nowIso = new Date().toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000)
    .toISOString();

  // Supplements table is created in a later migration (Module 3). Query it
  // defensively so the chat coach works both before and after that migration lands.
  const supplementsPromise = supabase
    .from("user_supplements")
    .select("name, dosage, timing, tier, priority")
    .eq("user_id", userId)
    .eq("is_active", true)
    .then(
      (res) => res,
      () => ({ data: [], error: null }),
    );

  const [
    profileRes,
    goalsRes,
    weightLogsRes,
    workoutSessionsRes,
    mealLogsRes,
    sleepLogsRes,
    moodLogsRes,
    supplementsRes,
    businessMetricsRes,
    dailyCheckinsRes,
    habitsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("goals")
      .select("id, title, status, target_date, start_date, icon, category, target_value, current_value, unit")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("target_date", { ascending: true }),
    supabase
      .from("weight_logs")
      .select("logged_at, weight")
      .eq("user_id", userId)
      .gte("logged_at", fourteenDaysAgo)
      .order("logged_at", { ascending: false })
      .limit(14),
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
    supplementsPromise,
    supabase
      .from("business_metrics")
      .select("date, revenue, clients, hours_worked")
      .eq("user_id", userId)
      .gte("date", fourteenDaysAgo.split("T")[0])
      .order("date", { ascending: false })
      .limit(14),
    supabase
      .from("daily_checkins")
      .select("date, day_score, habits_completed, habits_total, sleep_hours, mood_average, workouts_completed")
      .eq("user_id", userId)
      .gte("date", fourteenDaysAgo.split("T")[0])
      .order("date", { ascending: false })
      .limit(7),
    supabase
      .from("habits")
      .select("name, current_streak, longest_streak, is_active")
      .eq("user_id", userId)
      .eq("is_active", true),
  ]);

  const goals = goalsRes.data ?? [];
  const firstGoalWithTarget = goals.find(
    (g: { target_date: string | null }) => !!g.target_date,
  ) as { title: string; target_date: string } | undefined;

  const countdown = firstGoalWithTarget
    ? {
        title: firstGoalWithTarget.title,
        target_date: firstGoalWithTarget.target_date,
        days_remaining: daysBetween(
          new Date(nowIso),
          new Date(firstGoalWithTarget.target_date),
        ),
      }
    : null;

  const habits = (habitsRes.data ?? []) as Array<{ current_streak: number }>;
  const streakDays = habits.length === 0
    ? 0
    : Math.max(...habits.map((h) => h.current_streak ?? 0));

  return {
    profile: profileRes.data ?? null,
    goals,
    weightLogs: weightLogsRes.data ?? [],
    recentWorkouts: workoutSessionsRes.data ?? [],
    recentMeals: mealLogsRes.data ?? [],
    recentSleep: sleepLogsRes.data ?? [],
    recentMood: moodLogsRes.data ?? [],
    supplements: supplementsRes.data ?? [],
    businessMetrics: businessMetricsRes.data ?? [],
    dailyCheckins: dailyCheckinsRes.data ?? [],
    streakDays,
    countdown,
  };
}

function buildSystemPrompt(topic: string, context: UserContext): string {
  const profile = context.profile as
    | {
        display_name?: string;
        current_weight?: number;
        goal_weight?: number;
        gamification_style?: string;
        height?: number;
        sex?: string;
        birth_date?: string;
      }
    | null;

  const profileBlock = profile
    ? `User: ${profile.display_name ?? "unknown"}
Current weight: ${profile.current_weight ?? "not logged"}
Goal weight: ${profile.goal_weight ?? "not set"}
Sex: ${profile.sex ?? "not provided"}
Height: ${profile.height ?? "not provided"}
Gamification style: ${profile.gamification_style ?? "supportive"}`
    : "Profile: not yet set up.";

  const countdownBlock = context.countdown
    ? `Primary countdown: ${context.countdown.title} — ${context.countdown.days_remaining} days to ${context.countdown.target_date}`
    : "No active countdown goal.";

  const goalsBlock = context.goals.length > 0
    ? `Active goals:\n${JSON.stringify(context.goals)}`
    : "No active goals.";

  const streakBlock = `Current best habit streak: ${context.streakDays} days`;

  const dataBlock = `Recent data snapshot (last 14 days):
- weight_logs: ${JSON.stringify(context.weightLogs)}
- workouts: ${JSON.stringify(context.recentWorkouts)}
- meals: ${JSON.stringify(context.recentMeals)}
- sleep: ${JSON.stringify(context.recentSleep)}
- mood: ${JSON.stringify(context.recentMood)}
- supplements: ${JSON.stringify(context.supplements)}
- business: ${JSON.stringify(context.businessMetrics)}
- daily_checkins: ${JSON.stringify(context.dailyCheckins)}`;

  const topicFocus = `Current conversation topic: ${topic}. Stay on topic unless the user pivots.`;

  return `${COMPLIANCE_PREAMBLE}

You are TRANSFORMR AI Coach — the user's personal wellness coach inside the TRANSFORMR app. You have full access to the user's data below. Every reply MUST reference the user's real numbers. Do not give generic advice.

${topicFocus}

${profileBlock}

${countdownBlock}

${streakBlock}

${goalsBlock}

${dataBlock}

RESPONSE FORMAT:
- Respond in natural, warm conversational prose (not JSON).
- Keep replies focused and actionable. 2-5 short paragraphs max.
- When you give 2-4 concrete next steps, format them as a bulleted list starting each line with "- ".
- Reference the user's actual data ("your sleep averaged 6.4h this week", not "prioritize sleep").
- If the user asks about supplements, labs, or anything health-related, include the matching wellness disclaimer language.
- Never claim to diagnose, treat, or cure. Always use supportive wellness phrasing.`;
}

function extractSuggestions(text: string): string[] {
  const lines = text.split("\n");
  const bullets: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      bullets.push(trimmed.slice(2).trim());
    } else if (/^\d+[.)]\s/.test(trimmed)) {
      bullets.push(trimmed.replace(/^\d+[.)]\s/, "").trim());
    }
  }
  return bullets.slice(0, 6);
}

function pickDisclaimer(
  topic: string,
  text: string,
): "supplement" | "lab" | "nutrition" | "workout" | "sleep" | "general" | null {
  const lower = text.toLowerCase();
  if (topic === "supplements" || lower.includes("supplement")) return "supplement";
  if (topic === "labs" || lower.includes("lab result") || lower.includes("biomarker")) return "lab";
  if (topic === "nutrition" || lower.includes("macro") || lower.includes("calorie")) return "nutrition";
  if (topic === "training" || lower.includes("workout") || lower.includes("lift")) return "workout";
  if (topic === "sleep" || lower.includes("sleep")) return "sleep";
  return "general";
}

async function callClaude(
  systemPrompt: string,
  messages: ClaudeMessage[],
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
      max_tokens: 2048,
      system: systemPrompt,
      messages,
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

    const body = (await req.json()) as ChatRequestBody;
    if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const topic = body.topic ?? "general";

    // Upsert or create conversation
    let conversationId = body.conversation_id ?? null;
    if (!conversationId) {
      const { data: newConvo, error: convErr } = await supabase
        .from("ai_chat_conversations")
        .insert({
          user_id: user.id,
          topic,
          title: body.message.slice(0, 60),
        })
        .select("id")
        .single();
      if (convErr || !newConvo) {
        throw new Error(convErr?.message ?? "Failed to create conversation");
      }
      conversationId = newConvo.id as string;
    }

    // Load chat history (most recent first, then reverse for chronological order)
    const { data: historyRows, error: historyErr } = await supabase
      .from("ai_chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    if (historyErr) {
      throw new Error(`Failed to load history: ${historyErr.message}`);
    }

    const history = ((historyRows ?? []) as ChatMessage[])
      .reverse()
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map<ClaudeMessage>((m) => ({ role: m.role, content: m.content }));

    // Add the new user message at the end
    history.push({ role: "user", content: body.message });

    // Gather full user context
    const context = await fetchUserContext(supabase, user.id);
    const systemPrompt = buildSystemPrompt(topic, context);

    // Persist the user message first so it survives even if Claude fails
    const { error: userMsgErr } = await supabase
      .from("ai_chat_messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content: body.message,
      });

    if (userMsgErr) {
      throw new Error(`Failed to save user message: ${userMsgErr.message}`);
    }

    // Call Claude
    const { text: reply, tokensIn, tokensOut } = await callClaude(
      systemPrompt,
      history,
    );
    const latencyMs = Date.now() - startedAt;

    const suggestions = extractSuggestions(reply);
    const disclaimerType = pickDisclaimer(topic, reply);

    // Persist the assistant reply
    const { data: savedAssistant, error: assistantErr } = await supabase
      .from("ai_chat_messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "assistant",
        content: reply,
        suggestions,
        disclaimer_type: disclaimerType,
        context_snapshot: {
          topic,
          countdown: context.countdown,
          streak_days: context.streakDays,
          goal_count: context.goals.length,
        },
        model: AI_MODEL,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        latency_ms: latencyMs,
      })
      .select("id, created_at")
      .single();

    if (assistantErr || !savedAssistant) {
      throw new Error(
        `Failed to save assistant message: ${assistantErr?.message ?? "unknown"}`,
      );
    }

    return new Response(
      JSON.stringify({
        conversation_id: conversationId,
        message_id: savedAssistant.id,
        role: "assistant",
        content: reply,
        suggestions,
        disclaimer_type: disclaimerType,
        created_at: savedAssistant.created_at,
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
