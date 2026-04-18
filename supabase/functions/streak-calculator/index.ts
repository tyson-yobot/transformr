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

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id");

    if (profilesError) throw profilesError;

    const results: { user_id: string; current_streak?: number; longest_streak?: number; error?: string }[] = [];
    const today = new Date().toISOString().split("T")[0];

    for (const profile of profiles || []) {
      const userId = profile.id;

      // Fetch daily checkins ordered by date descending
      const { data: checkins, error: checkinsError } = await supabaseAdmin
        .from("daily_checkins")
        .select("date, completed")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(365);

      if (checkinsError) {
        results.push({ user_id: userId, error: checkinsError.message });
        continue;
      }

      // Calculate current streak
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let streakBroken = false;

      if (checkins && checkins.length > 0) {
        const sortedDates = checkins
          .filter((c: { date: string; completed: boolean }) => c.completed)
          .map((c: { date: string; completed: boolean }) => c.date)
          .sort()
          .reverse();

        // Check consecutive days from today backwards
        const todayDate = new Date(today);
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(todayDate);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split("T")[0];

          if (sortedDates.includes(dateStr)) {
            if (!streakBroken) {
              currentStreak++;
            }
            tempStreak++;
          } else {
            streakBroken = true;
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
            tempStreak = 0;
          }
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      }

      // Fetch existing streak record
      const { data: existingStreak } = await supabaseAdmin
        .from("streaks")
        .select("*")
        .eq("user_id", userId)
        .eq("streak_type", "daily_checkin")
        .single();

      const previousStreak = existingStreak?.current_count || 0;

      // Upsert streak
      const { error: upsertError } = await supabaseAdmin
        .from("streaks")
        .upsert(
          {
            user_id: userId,
            streak_type: "daily_checkin",
            current_count: currentStreak,
            longest_count: longestStreak,
            last_activity_date: today,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,streak_type" }
        );

      if (upsertError) {
        results.push({ user_id: userId, error: upsertError.message });
        continue;
      }

      // Trigger streak protection alert if streak is at risk
      const streakAtRisk = previousStreak > 0 && currentStreak === 0;
      if (streakAtRisk) {
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          type: "streak_protection",
          title: "Streak at Risk!",
          body: `Your ${previousStreak}-day streak is about to break! Complete today's checkin to keep it alive.`,
          priority: "high",
          scheduled_for: new Date().toISOString(),
        });
      }

      results.push({
        user_id: userId,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        streak_at_risk: streakAtRisk,
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
