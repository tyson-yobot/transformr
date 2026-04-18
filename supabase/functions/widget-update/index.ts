// NOTE: No AI API calls — compliance preamble not required
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Support both cron (all users) and individual user
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
      userIds = (profiles || []).map((p: { id: string }) => p.id);
    }

    const today = new Date().toISOString().split("T")[0];
    const results: { user_id: string; [key: string]: unknown }[] = [];

    for (const userId of userIds) {
      // Fetch all widget data in parallel
      const [
        { data: countdown },
        { data: todayMeals },
        { data: streak },
        { data: readiness },
        { data: latestWeight },
        { data: goals },
        { data: todayWorkout },
      ] = await Promise.all([
        supabaseAdmin
          .from("user_goals")
          .select("title, target_date")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("target_date", { ascending: true })
          .limit(1)
          .single(),
        supabaseAdmin
          .from("meal_logs")
          .select("calories, protein_g, carbs_g, fat_g")
          .eq("user_id", userId)
          .gte("logged_at", `${today}T00:00:00`)
          .lte("logged_at", `${today}T23:59:59`),
        supabaseAdmin
          .from("streaks")
          .select("current_count, longest_count")
          .eq("user_id", userId)
          .eq("streak_type", "daily_checkin")
          .single(),
        supabaseAdmin
          .from("readiness_scores")
          .select("score, recommendation")
          .eq("user_id", userId)
          .eq("date", today)
          .single(),
        supabaseAdmin
          .from("weight_logs")
          .select("weight_lbs, logged_at")
          .eq("user_id", userId)
          .order("logged_at", { ascending: false })
          .limit(1)
          .single(),
        supabaseAdmin
          .from("user_goals")
          .select("title, target_value, current_value, target_date")
          .eq("user_id", userId)
          .eq("status", "active"),
        supabaseAdmin
          .from("workout_sessions")
          .select("id, workout_name, started_at")
          .eq("user_id", userId)
          .gte("started_at", `${today}T00:00:00`)
          .limit(1)
          .single(),
      ]);

      // Calculate macro totals for today
      interface MacroAcc { calories: number; protein_g: number; carbs_g: number; fat_g: number }
      const macroTotals = (todayMeals || []).reduce(
        (acc: MacroAcc, meal: MacroAcc) => ({
          calories: acc.calories + (meal.calories || 0),
          protein_g: acc.protein_g + (meal.protein_g || 0),
          carbs_g: acc.carbs_g + (meal.carbs_g || 0),
          fat_g: acc.fat_g + (meal.fat_g || 0),
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      );

      // Calculate countdown days
      let countdownData = null;
      if (countdown?.target_date) {
        const targetDate = new Date(countdown.target_date);
        const daysRemaining = Math.ceil(
          (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        countdownData = {
          title: countdown.title,
          target_date: countdown.target_date,
          days_remaining: Math.max(0, daysRemaining),
        };
      }

      const widgetData = {
        user_id: userId,
        date: today,
        countdown: countdownData,
        macros_today: macroTotals,
        meals_logged: (todayMeals || []).length,
        streak: {
          current: streak?.current_count || 0,
          longest: streak?.longest_count || 0,
        },
        readiness: {
          score: readiness?.score || null,
          recommendation: readiness?.recommendation || null,
        },
        current_weight: latestWeight?.weight_lbs || null,
        worked_out_today: !!todayWorkout,
        active_goals_count: (goals || []).length,
        updated_at: new Date().toISOString(),
      };

      // Upsert widget data
      const { error: upsertError } = await supabaseAdmin
        .from("widget_data")
        .upsert(widgetData, { onConflict: "user_id,date" });

      results.push({
        user_id: userId,
        success: !upsertError,
        error: upsertError?.message || null,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
