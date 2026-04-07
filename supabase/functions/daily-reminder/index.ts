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

    const now = new Date();
    const currentHour = now.getUTCHours();

    // Fetch all users with their notification preferences
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, timezone, notification_preferences");

    if (profilesError) throw profilesError;

    const notifications: any[] = [];

    for (const profile of profiles || []) {
      const prefs = profile.notification_preferences || {};
      const tz = profile.timezone || "America/New_York";

      // Calculate user's local hour (simplified offset approach)
      const userTime = new Date(
        now.toLocaleString("en-US", { timeZone: tz })
      );
      const userHour = userTime.getHours();

      // Wake-up reminder (default 6 AM)
      const wakeHour = prefs.wake_reminder_hour ?? 6;
      if (userHour === wakeHour && prefs.wake_reminder !== false) {
        notifications.push({
          user_id: profile.id,
          type: "wake_up",
          title: "Rise and Grind",
          body: `Good morning ${profile.display_name || ""}! Time to start your transformation day.`,
          scheduled_for: now.toISOString(),
        });
      }

      // Meal reminders (default: 8, 12, 18)
      const mealHours = prefs.meal_reminder_hours ?? [8, 12, 18];
      if (mealHours.includes(userHour) && prefs.meal_reminders !== false) {
        const mealNames: Record<number, string> = { 8: "breakfast", 12: "lunch", 18: "dinner" };
        const mealName = mealNames[userHour] || "meal";
        notifications.push({
          user_id: profile.id,
          type: "meal_reminder",
          title: `Time to log ${mealName}`,
          body: `Don't forget to track your ${mealName}. Every meal counts!`,
          scheduled_for: now.toISOString(),
        });
      }

      // Gym reminder (based on workout schedule)
      const gymHour = prefs.gym_reminder_hour ?? 17;
      if (userHour === gymHour && prefs.gym_reminder !== false) {
        // Check if today is a workout day
        const dayOfWeek = userTime.getDay();
        const workoutDays = prefs.workout_days ?? [1, 2, 3, 4, 5]; // Mon-Fri default
        if (workoutDays.includes(dayOfWeek)) {
          notifications.push({
            user_id: profile.id,
            type: "gym_reminder",
            title: "Gym Time",
            body: "Your workout is waiting. Show up and put in the work!",
            scheduled_for: now.toISOString(),
          });
        }
      }

      // Sleep reminder (default 10 PM)
      const sleepHour = prefs.sleep_reminder_hour ?? 22;
      if (userHour === sleepHour && prefs.sleep_reminder !== false) {
        notifications.push({
          user_id: profile.id,
          type: "sleep_reminder",
          title: "Wind Down Time",
          body: "Start your bedtime routine. Good sleep fuels tomorrow's gains.",
          scheduled_for: now.toISOString(),
        });
      }
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("notifications")
        .insert(notifications);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: notifications.length,
        timestamp: now.toISOString(),
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
