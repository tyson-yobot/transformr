// =============================================================================
// TRANSFORMR -- Smart Notification Engine (Module 8)
// Cron job that evaluates 12 trigger rules per user and sends push
// notifications + inserts proactive_messages when conditions are met.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRule {
  id: string;
  user_id: string;
  trigger_type: string;
  is_enabled: boolean;
  cooldown_hours: number;
  custom_message: string | null;
  last_triggered_at: string | null;
}

interface TriggerResult {
  should_fire: boolean;
  title: string;
  body: string;
  category: string;
  severity: "info" | "warning" | "critical";
}

async function evaluateMissedWorkout(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<TriggerResult> {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("started_at", twoDaysAgo);

  return {
    should_fire: (count ?? 0) === 0,
    title: "Time to move",
    body: "You haven't logged a workout in 2+ days. Even a quick session supports your consistency goals.",
    category: "general",
    severity: "info",
  };
}

async function evaluateMissedMealLog(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<TriggerResult> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const now = new Date();
  const hourOfDay = now.getHours();

  // Only fire after 2pm if no meals logged today
  if (hourOfDay < 14) {
    return { should_fire: false, title: "", body: "", category: "", severity: "info" };
  }

  const { count } = await supabase
    .from("meal_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("logged_at", todayStart.toISOString());

  return {
    should_fire: (count ?? 0) === 0,
    title: "Log your meals",
    body: "No meals logged today. Tracking helps your AI coach give better recommendations.",
    category: "meal_gap",
    severity: "info",
  };
}

async function evaluateWaterReminder(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<TriggerResult> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("water_logs")
    .select("amount_oz")
    .eq("user_id", userId)
    .gte("logged_at", todayStart.toISOString());

  const totalOz = (data ?? []).reduce(
    (sum: number, entry: { amount_oz: number }) => sum + entry.amount_oz,
    0,
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_water_target_oz")
    .eq("id", userId)
    .maybeSingle();

  const target = (profile?.daily_water_target_oz as number) ?? 100;
  const pct = totalOz / Math.max(1, target);

  const now = new Date();
  if (now.getHours() < 12) {
    return { should_fire: false, title: "", body: "", category: "", severity: "info" };
  }

  return {
    should_fire: pct < 0.4,
    title: "Stay hydrated",
    body: `You've had ${Math.round(totalOz)} oz of water today (${Math.round(pct * 100)}% of your ${target} oz target). Time for a refill.`,
    category: "dehydration_risk",
    severity: pct < 0.2 ? "warning" : "info",
  };
}

async function evaluateSupplementReminder(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<TriggerResult> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: activeSups } = await supabase
    .from("user_supplements")
    .select("id, name")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!activeSups || activeSups.length === 0) {
    return { should_fire: false, title: "", body: "", category: "", severity: "info" };
  }

  const { data: todayLogs } = await supabase
    .from("user_supplement_logs")
    .select("supplement_id")
    .eq("user_id", userId)
    .gte("taken_at", todayStart.toISOString());

  const loggedIds = new Set(
    (todayLogs ?? []).map((l: { supplement_id: string }) => l.supplement_id),
  );
  const missed = activeSups.filter(
    (s: { id: string }) => !loggedIds.has(s.id),
  );

  if (missed.length === 0) {
    return { should_fire: false, title: "", body: "", category: "", severity: "info" };
  }

  const names = missed
    .slice(0, 3)
    .map((s: { name: string }) => s.name)
    .join(", ");
  const extra = missed.length > 3 ? ` +${missed.length - 3} more` : "";

  return {
    should_fire: true,
    title: "Supplement check-in",
    body: `Don't forget: ${names}${extra}. Tap to log.`,
    category: "supplement_reminder",
    severity: "info",
  };
}

async function evaluateSleepWindow(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<TriggerResult> {
  const { data: sleepLogs } = await supabase
    .from("sleep_logs")
    .select("duration_hours")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(3);

  const durations = (sleepLogs ?? []).map(
    (s: { duration_hours: number }) => s.duration_hours,
  );
  const avg =
    durations.length > 0
      ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
      : 8;

  const now = new Date();
  const hour = now.getHours();

  // Fire between 9-11pm if avg sleep is low
  return {
    should_fire: hour >= 21 && hour <= 23 && avg < 7,
    title: "Wind down soon",
    body: `Your recent sleep averages ${avg.toFixed(1)} hours. Heading to bed within the next hour may help improve your recovery.`,
    category: "general",
    severity: "info",
  };
}

async function evaluateStreakAtRisk(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<TriggerResult> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = todayStart.toISOString().split("T")[0]!;

  const { count } = await supabase
    .from("habit_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("date", today)
    .eq("completed", true);

  const now = new Date();
  return {
    should_fire: (count ?? 0) === 0 && now.getHours() >= 18,
    title: "Protect your streak",
    body: "No habits checked off today. There's still time to keep your streak alive.",
    category: "streak_risk",
    severity: "warning",
  };
}

async function evaluateWeightLoggedWeekly(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<TriggerResult> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("weight_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("date", sevenDaysAgo.split("T")[0]);

  return {
    should_fire: (count ?? 0) === 0,
    title: "Weekly weigh-in",
    body: "No weight logged this week. A quick weigh-in helps the AI track your trajectory more accurately.",
    category: "general",
    severity: "info",
  };
}

async function evaluateJournalPrompt(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<TriggerResult> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("journal_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", threeDaysAgo);

  return {
    should_fire: (count ?? 0) === 0,
    title: "Reflection time",
    body: "It's been a few days since your last journal entry. A quick reflection can help clarify your focus.",
    category: "general",
    severity: "info",
  };
}

async function evaluateGoalDeadline(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<TriggerResult> {
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!;
  const today = new Date().toISOString().split("T")[0]!;

  const { data: goals } = await supabase
    .from("goals")
    .select("title, target_date, current_value, target_value")
    .eq("user_id", userId)
    .eq("status", "active")
    .gte("target_date", today)
    .lte("target_date", sevenDaysOut)
    .limit(1);

  if (!goals || goals.length === 0) {
    return { should_fire: false, title: "", body: "", category: "", severity: "info" };
  }

  const goal = goals[0]!;
  const pct =
    (goal.target_value as number) > 0
      ? ((goal.current_value as number) / (goal.target_value as number)) * 100
      : 0;

  return {
    should_fire: true,
    title: `Goal deadline approaching`,
    body: `"${goal.title}" is due ${goal.target_date}. You're at ${Math.round(pct)}% — ${pct >= 80 ? "almost there!" : "time to push hard!"}`,
    category: pct >= 80 ? "goal_ahead" : "goal_behind",
    severity: pct < 50 ? "warning" : "info",
  };
}

async function evaluateMoodCheckIn(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<TriggerResult> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("mood_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("logged_at", todayStart.toISOString());

  const now = new Date();
  return {
    should_fire: (count ?? 0) === 0 && now.getHours() >= 10,
    title: "How are you feeling?",
    body: "A quick mood check-in helps the AI understand your energy and stress patterns.",
    category: "general",
    severity: "info",
  };
}

async function evaluateRecoveryDay(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<TriggerResult> {
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const { data: workouts } = await supabase
    .from("workout_sessions")
    .select("started_at")
    .eq("user_id", userId)
    .gte("started_at", fiveDaysAgo)
    .order("started_at", { ascending: false });

  const count = workouts?.length ?? 0;
  return {
    should_fire: count >= 5,
    title: "Recovery day suggested",
    body: `You've trained ${count} of the last 5 days. A rest day may support your recovery and long-term performance.`,
    category: "recovery_needed",
    severity: "info",
  };
}

const EVALUATORS: Record<
  string,
  (
    supabase: ReturnType<typeof createClient>,
    userId: string,
  ) => Promise<TriggerResult>
> = {
  missed_workout: evaluateMissedWorkout,
  missed_meal_log: evaluateMissedMealLog,
  water_reminder: evaluateWaterReminder,
  supplement_reminder: evaluateSupplementReminder,
  sleep_window: evaluateSleepWindow,
  streak_at_risk: evaluateStreakAtRisk,
  weight_logged_weekly: evaluateWeightLoggedWeekly,
  journal_prompt: evaluateJournalPrompt,
  goal_deadline_approaching: evaluateGoalDeadline,
  mood_check_in: evaluateMoodCheckIn,
  recovery_day: evaluateRecoveryDay,
  focus_session_reminder: async () => ({
    should_fire: false,
    title: "",
    body: "",
    category: "",
    severity: "info" as const,
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rules, error: rulesErr } = await supabase
      .from("smart_notification_rules")
      .select("*")
      .eq("is_enabled", true);

    if (rulesErr) throw rulesErr;
    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, notifications_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let notificationsSent = 0;
    const now = new Date();

    for (const rule of rules as NotificationRule[]) {
      // Check cooldown
      if (rule.last_triggered_at) {
        const lastTriggered = new Date(rule.last_triggered_at);
        const cooldownMs = rule.cooldown_hours * 60 * 60 * 1000;
        if (now.getTime() - lastTriggered.getTime() < cooldownMs) continue;
      }

      const evaluator = EVALUATORS[rule.trigger_type];
      if (!evaluator) continue;

      try {
        const result = await evaluator(supabase, rule.user_id);
        if (!result.should_fire) continue;

        const messageBody = rule.custom_message ?? result.body;

        await supabase.from("proactive_messages").insert({
          user_id: rule.user_id,
          category: result.category || "general",
          title: result.title,
          body: messageBody,
          severity: result.severity,
          expires_at: new Date(
            now.getTime() + rule.cooldown_hours * 60 * 60 * 1000,
          ).toISOString(),
        });

        await supabase
          .from("smart_notification_rules")
          .update({ last_triggered_at: now.toISOString() })
          .eq("id", rule.id);

        notificationsSent++;
      } catch {
        // Skip this rule on error
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        processed: rules.length,
        notifications_sent: notificationsSent,
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
