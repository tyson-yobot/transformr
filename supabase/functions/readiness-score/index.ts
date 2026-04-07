import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function calculateReadinessScore(params: {
  sleepHours: number | null;
  sleepQuality: number | null;
  mood: number | null;
  restDaysSinceLastWorkout: number;
  recentTrainingLoad: number;
  soreness: number | null;
  stress: number | null;
  hrv: number | null;
  rhr: number | null;
}): { score: number; factors: any; recommendation: string } {
  let totalWeight = 0;
  let weightedSum = 0;
  const factors: any = {};

  // Sleep duration (0-10 scale, weight: 25%)
  if (params.sleepHours != null) {
    const sleepScore = Math.min(10, Math.max(0, (params.sleepHours / 8) * 10));
    weightedSum += sleepScore * 25;
    totalWeight += 25;
    factors.sleep_duration = { score: Math.round(sleepScore * 10) / 10, hours: params.sleepHours };
  }

  // Sleep quality (0-10 scale, weight: 15%)
  if (params.sleepQuality != null) {
    weightedSum += params.sleepQuality * 15;
    totalWeight += 15;
    factors.sleep_quality = { score: params.sleepQuality };
  }

  // Mood (0-10 scale, weight: 15%)
  if (params.mood != null) {
    weightedSum += params.mood * 15;
    totalWeight += 15;
    factors.mood = { score: params.mood };
  }

  // Recovery time (weight: 15%)
  const recoveryScore = Math.min(10, params.restDaysSinceLastWorkout * 3.3);
  weightedSum += recoveryScore * 15;
  totalWeight += 15;
  factors.recovery = { score: Math.round(recoveryScore * 10) / 10, rest_days: params.restDaysSinceLastWorkout };

  // Training load (inverse, weight: 10%)
  const loadScore = Math.max(0, 10 - params.recentTrainingLoad / 10);
  weightedSum += loadScore * 10;
  totalWeight += 10;
  factors.training_load = { score: Math.round(loadScore * 10) / 10 };

  // Soreness (inverse, weight: 10%)
  if (params.soreness != null) {
    const sorenessScore = 10 - params.soreness;
    weightedSum += sorenessScore * 10;
    totalWeight += 10;
    factors.soreness = { score: Math.round(sorenessScore * 10) / 10, raw: params.soreness };
  }

  // Stress (inverse, weight: 10%)
  if (params.stress != null) {
    const stressScore = 10 - params.stress;
    weightedSum += stressScore * 10;
    totalWeight += 10;
    factors.stress = { score: Math.round(stressScore * 10) / 10, raw: params.stress };
  }

  const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 5;

  let recommendation: string;
  if (score >= 8) {
    recommendation = "Peak readiness. Go hard today - push for PRs!";
  } else if (score >= 6) {
    recommendation = "Good readiness. Proceed with normal training.";
  } else if (score >= 4) {
    recommendation = "Moderate readiness. Consider reducing volume by 20-30%.";
  } else {
    recommendation = "Low readiness. Active recovery or rest day recommended.";
  }

  return { score, factors, recommendation };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Support both cron (all users) and individual user request
    let userIds: string[] = [];
    try {
      const body = await req.json();
      if (body.user_id) {
        userIds = [body.user_id];
      }
    } catch {
      // No body
    }

    if (userIds.length === 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id");
      userIds = (profiles || []).map((p: any) => p.id);
    }

    const today = new Date().toISOString().split("T")[0];
    const results: any[] = [];

    for (const userId of userIds) {
      // Fetch latest sleep log
      const { data: sleepLog } = await supabaseAdmin
        .from("sleep_logs")
        .select("hours, quality_score")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      // Fetch latest mood
      const { data: moodLog } = await supabaseAdmin
        .from("mood_logs")
        .select("score")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(1)
        .single();

      // Fetch latest workout date
      const { data: lastWorkout } = await supabaseAdmin
        .from("workout_sessions")
        .select("started_at")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      const restDays = lastWorkout
        ? Math.floor(
            (Date.now() - new Date(lastWorkout.started_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 3;

      // Calculate recent training load (sessions in last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: recentSessions } = await supabaseAdmin
        .from("workout_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("started_at", weekAgo.toISOString());

      // Fetch daily checkin for soreness/stress
      const { data: checkin } = await supabaseAdmin
        .from("daily_checkins")
        .select("soreness, stress_level")
        .eq("user_id", userId)
        .eq("date", today)
        .single();

      const readiness = calculateReadinessScore({
        sleepHours: sleepLog?.hours || null,
        sleepQuality: sleepLog?.quality_score || null,
        mood: moodLog?.score || null,
        restDaysSinceLastWorkout: restDays,
        recentTrainingLoad: (recentSessions || 0) * 15,
        soreness: checkin?.soreness || null,
        stress: checkin?.stress_level || null,
        hrv: null,
        rhr: null,
      });

      // Store readiness score
      const { error: upsertError } = await supabaseAdmin
        .from("readiness_scores")
        .upsert(
          {
            user_id: userId,
            date: today,
            score: readiness.score,
            factors: readiness.factors,
            recommendation: readiness.recommendation,
            calculated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,date" }
        );

      results.push({
        user_id: userId,
        score: readiness.score,
        recommendation: readiness.recommendation,
        error: upsertError?.message || null,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
        date: today,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
