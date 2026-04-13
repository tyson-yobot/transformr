// NOTE: No AI API calls — compliance preamble not required
// =============================================================================
// TRANSFORMR -- AI Pattern Detector (Module 7)
// Pure-math pattern detection engine. No AI API calls — runs statistical
// analysis on user data to detect plateaus, overtraining, sleep debt, etc.
// Inserts results into ai_predictions table.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WeightEntry {
  date: string;
  weight: number;
}
interface WorkoutEntry {
  started_at: string;
  total_volume: number;
  duration_minutes: number;
}
interface SleepEntry {
  date: string;
  duration_hours: number;
  quality_score: number;
}
interface MealEntry {
  logged_at: string;
  calories: number;
  protein_g: number;
}
interface HabitEntry {
  date: string;
  completed: boolean;
}

interface Prediction {
  category: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  confidence: number;
  data_points: Record<string, unknown>;
  action_label: string | null;
  action_route: string | null;
  expires_at: string | null;
}

function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 3) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i]!;
    sumXY += i * values[i]!;
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function detectWeightPlateau(weights: WeightEntry[]): Prediction | null {
  if (weights.length < 10) return null;
  const vals = weights.map((w) => w.weight);
  const recent14 = vals.slice(0, 14);
  const slope = Math.abs(linearSlope(recent14));
  const sd = stdDev(recent14);

  if (slope < 0.02 && sd < 1.5 && recent14.length >= 10) {
    return {
      category: "weight_stall",
      title: "Weight plateau detected",
      body: `Your weight has been stable at ~${avg(recent14).toFixed(1)} lbs for the past ${recent14.length} days (±${sd.toFixed(1)} lbs). Consider adjusting calories or activity if this doesn't align with your goal.`,
      severity: "info",
      confidence: Math.min(0.9, 0.5 + (recent14.length - 10) * 0.04),
      data_points: {
        avg_weight: avg(recent14),
        std_dev: sd,
        slope,
        days: recent14.length,
      },
      action_label: "Review nutrition",
      action_route: "/(tabs)/nutrition",
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    };
  }
  return null;
}

function detectOvertraining(workouts: WorkoutEntry[]): Prediction | null {
  if (workouts.length < 7) return null;
  const recent7 = workouts.slice(0, 7);
  const sessions = recent7.length;

  if (sessions >= 6) {
    const volumes = recent7.map((w) => w.total_volume);
    const trend = linearSlope(volumes);

    if (trend < -50) {
      return {
        category: "overtraining",
        title: "Possible overtraining pattern",
        body: `You've trained ${sessions} of the last 7 days with declining volume (${trend.toFixed(0)} lbs/session trend). Your body may benefit from a rest day to optimize recovery.`,
        severity: "warning",
        confidence: 0.7,
        data_points: {
          sessions_7d: sessions,
          volume_trend: trend,
          avg_volume: avg(volumes),
        },
        action_label: "View recovery tips",
        action_route: "/(tabs)/fitness",
        expires_at: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      };
    }
  }
  return null;
}

function detectPRApproaching(workouts: WorkoutEntry[]): Prediction | null {
  if (workouts.length < 5) return null;
  const volumes = workouts.map((w) => w.total_volume).filter((v) => v > 0);
  if (volumes.length < 5) return null;

  const trend = linearSlope(volumes);
  const maxVol = Math.max(...volumes);
  const recentAvg = avg(volumes.slice(0, 3));

  if (trend > 100 && recentAvg > maxVol * 0.9) {
    return {
      category: "pr_approaching",
      title: "New PR within reach",
      body: `Your training volume is trending up (+${trend.toFixed(0)} lbs/session). You're within 10% of your personal best volume. Keep pushing — a PR may be around the corner.`,
      severity: "info",
      confidence: 0.65,
      data_points: {
        volume_trend: trend,
        max_volume: maxVol,
        recent_avg: recentAvg,
      },
      action_label: "View workout history",
      action_route: "/(tabs)/fitness/progress",
      expires_at: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    };
  }
  return null;
}

function detectSleepDebt(sleepLogs: SleepEntry[]): Prediction | null {
  if (sleepLogs.length < 5) return null;
  const durations = sleepLogs.slice(0, 7).map((s) => s.duration_hours);
  const avgSleep = avg(durations);

  if (avgSleep < 6.5) {
    const deficit = (7.5 - avgSleep) * durations.length;
    return {
      category: "sleep_debt",
      title: "Sleep debt accumulating",
      body: `You've averaged ${avgSleep.toFixed(1)} hours/night over the past ${durations.length} days. That's ~${deficit.toFixed(0)} hours below recommended levels. This may impact recovery and performance.`,
      severity: avgSleep < 5.5 ? "critical" : "warning",
      confidence: 0.8,
      data_points: {
        avg_hours: avgSleep,
        total_deficit: deficit,
        days: durations.length,
      },
      action_label: "Sleep tips",
      action_route: "/(tabs)/goals/sleep",
      expires_at: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    };
  }
  return null;
}

function detectCalorieDeficit(
  meals: MealEntry[],
  target: number,
): Prediction | null {
  if (meals.length < 7 || target <= 0) return null;

  // Group by day
  const byDay: Record<string, number> = {};
  for (const m of meals) {
    const day = m.logged_at.split("T")[0]!;
    byDay[day] = (byDay[day] ?? 0) + m.calories;
  }

  const dailyTotals = Object.values(byDay);
  if (dailyTotals.length < 3) return null;

  const avgCals = avg(dailyTotals);
  const deficitPct = (target - avgCals) / target;

  if (deficitPct > 0.25) {
    return {
      category: "calorie_deficit_risk",
      title: "Significant calorie deficit detected",
      body: `Your average daily intake is ~${Math.round(avgCals)} cal (${Math.round(deficitPct * 100)}% below your ${target} cal target). Prolonged deficits over 25% may impact energy and recovery.`,
      severity: deficitPct > 0.4 ? "critical" : "warning",
      confidence: 0.75,
      data_points: {
        avg_calories: avgCals,
        target,
        deficit_pct: deficitPct,
        days_tracked: dailyTotals.length,
      },
      action_label: "View nutrition",
      action_route: "/(tabs)/nutrition",
      expires_at: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    };
  }
  return null;
}

function detectStreakRisk(habits: HabitEntry[]): Prediction | null {
  if (habits.length < 3) return null;
  const recent3 = habits.slice(0, 3);
  const missed = recent3.filter((h) => !h.completed).length;

  if (missed >= 2) {
    return {
      category: "streak_risk",
      title: "Habit streak at risk",
      body: `You've missed ${missed} of your last 3 habit check-ins. Getting back on track today can preserve your momentum.`,
      severity: "warning",
      confidence: 0.7,
      data_points: { missed_last_3: missed },
      action_label: "Check in now",
      action_route: "/(tabs)/goals/habits",
      expires_at: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    };
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all active user IDs
    const { data: users, error: usersErr } = await supabase
      .from("profiles")
      .select("id, daily_calorie_target");
    if (usersErr) throw usersErr;
    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, predictions: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    let totalPredictions = 0;

    for (const user of users) {
      const userId = user.id as string;
      const calTarget = (user.daily_calorie_target as number) ?? 0;

      const [weightsRes, workoutsRes, sleepRes, mealsRes, habitsRes] =
        await Promise.all([
          supabase
            .from("weight_logs")
            .select("date, weight")
            .eq("user_id", userId)
            .gte("date", thirtyDaysAgo.split("T")[0])
            .order("date", { ascending: false })
            .limit(30),
          supabase
            .from("workout_sessions")
            .select("started_at, total_volume, duration_minutes")
            .eq("user_id", userId)
            .gte("started_at", thirtyDaysAgo)
            .order("started_at", { ascending: false })
            .limit(14),
          supabase
            .from("sleep_logs")
            .select("date, duration_hours, quality_score")
            .eq("user_id", userId)
            .gte("date", thirtyDaysAgo.split("T")[0])
            .order("date", { ascending: false })
            .limit(14),
          supabase
            .from("meal_logs")
            .select("logged_at, calories, protein_g")
            .eq("user_id", userId)
            .gte("logged_at", thirtyDaysAgo)
            .order("logged_at", { ascending: false })
            .limit(60),
          supabase
            .from("habit_logs")
            .select("date, completed")
            .eq("user_id", userId)
            .gte("date", thirtyDaysAgo.split("T")[0])
            .order("date", { ascending: false })
            .limit(14),
        ]);

      const weights = (weightsRes.data ?? []) as WeightEntry[];
      const workouts = (workoutsRes.data ?? []) as WorkoutEntry[];
      const sleep = (sleepRes.data ?? []) as SleepEntry[];
      const meals = (mealsRes.data ?? []) as MealEntry[];
      const habits = (habitsRes.data ?? []) as HabitEntry[];

      const detectors: Array<() => Prediction | null> = [
        () => detectWeightPlateau(weights),
        () => detectOvertraining(workouts),
        () => detectPRApproaching(workouts),
        () => detectSleepDebt(sleep),
        () => detectCalorieDeficit(meals, calTarget),
        () => detectStreakRisk(habits),
      ];

      const predictions: Prediction[] = [];
      for (const detect of detectors) {
        const result = detect();
        if (result) predictions.push(result);
      }

      if (predictions.length === 0) continue;

      // Check for existing active predictions to avoid duplicates
      const { data: existing } = await supabase
        .from("ai_predictions")
        .select("category")
        .eq("user_id", userId)
        .eq("is_acknowledged", false)
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        );

      const existingCategories = new Set(
        (existing ?? []).map((e: { category: string }) => e.category),
      );

      const newPredictions = predictions.filter(
        (p) => !existingCategories.has(p.category),
      );

      if (newPredictions.length > 0) {
        const rows = newPredictions.map((p) => ({
          user_id: userId,
          ...p,
        }));

        await supabase.from("ai_predictions").insert(rows);
        totalPredictions += rows.length;
      }
    }

    return new Response(
      JSON.stringify({
        processed: users.length,
        predictions: totalPredictions,
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
