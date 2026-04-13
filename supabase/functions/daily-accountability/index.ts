// =============================================================================
// TRANSFORMR -- Daily Accountability Cron (Module 14)
// Runs 3x daily (9 AM, 2 PM, 8 PM user local time) to generate tone-adaptive
// AI accountability messages based on today's actual vs expected progress.
// Stores results in proactive_messages and inserts a push notification.
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

type CheckWindow = "morning" | "midday" | "evening";

function getCheckWindow(userHour: number): CheckWindow | null {
  if (userHour === 9) return "morning";
  if (userHour === 14) return "midday";
  if (userHour === 20) return "evening";
  return null;
}

function buildAccountabilityPrompt(
  window: CheckWindow,
  coachingTone: string,
  profile: Record<string, unknown>,
  todayData: Record<string, unknown>,
): string {
  const windowContext: Record<CheckWindow, string> = {
    morning: "It is 9 AM. This is the morning check-in — lay out the full plan for today and frame it according to the coaching tone.",
    midday:
      "It is 2 PM. This is the midday accountability check — review what has been done vs what is expected, and push based on the coaching tone. Be direct about gaps.",
    evening:
      "It is 8 PM. This is the evening accountability check — final push for anything not yet completed. Acknowledge what was accomplished and drive toward closing the day strong.",
  };

  return `${COMPLIANCE_PREAMBLE}

You are the TRANSFORMR daily accountability engine. Generate ONE powerful accountability message.

CURRENT CHECK WINDOW: ${windowContext[window]}

COACHING TONE: "${coachingTone}"
Apply this tone strictly throughout the entire message. See tone definitions above in the compliance preamble.

USER CONTEXT:
${JSON.stringify({ profile, today: todayData }, null, 2)}

RULES:
- Be specific — reference ACTUAL numbers from the data, not placeholders
- One message, direct and actionable, no longer than 4 sentences
- Adapt entirely to the coaching_tone — don't mix tones
- For midday/evening: explicitly call out what is NOT done yet
- For morning: lay out what needs to happen today
- Do NOT be generic — every sentence should reference real user data
- Use compliance-safe language (may support, based on your data, consider)

Return valid JSON only:
{
  "title": "Short punchy title (under 8 words)",
  "body": "The full accountability message (2-4 sentences, tone-adapted, data-specific)",
  "completion_pct": <number 0-100 representing estimated day completion>,
  "severity": "info|warning|critical"
}`;
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

    const now = new Date();
    const todayDateStr = now.toISOString().split("T")[0]!;

    const { data: profiles, error: profilesErr } = await supabase
      .from("profiles")
      .select(
        "id, display_name, timezone, gamification_style, daily_calorie_target, daily_protein_target, daily_water_target_oz, notification_preferences",
      );

    if (profilesErr) throw profilesErr;
    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, messages_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let messagesSent = 0;

    for (const profile of profiles) {
      const userId = profile.id as string;
      const tz = (profile.timezone as string) ?? "America/New_York";

      // Determine user's local time
      const userLocalTime = new Date(
        now.toLocaleString("en-US", { timeZone: tz }),
      );
      const userHour = userLocalTime.getHours();
      const window = getCheckWindow(userHour);

      if (!window) continue;

      const coachingTone =
        (profile.gamification_style as string) ?? "balanced";

      // Check if we already sent an accountability message for this window today
      const windowStart = new Date(userLocalTime);
      windowStart.setHours(userHour - 1, 0, 0, 0);
      const windowEnd = new Date(userLocalTime);
      windowEnd.setHours(userHour + 1, 0, 0, 0);

      const { count: windowCount } = await supabase
        .from("proactive_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("category", `accountability_${window}`)
        .gte("created_at", windowStart.toISOString())
        .lte("created_at", windowEnd.toISOString());

      if ((windowCount ?? 0) > 0) continue;

      // Fetch today's logged data in parallel
      const [mealsRes, habitsRes, habitCompletionsRes, workoutRes, waterRes] =
        await Promise.all([
          supabase
            .from("meal_logs")
            .select("calories, protein_g, logged_at")
            .eq("user_id", userId)
            .gte("logged_at", `${todayDateStr}T00:00:00`)
            .order("logged_at", { ascending: false }),

          supabase
            .from("habits")
            .select("id, name")
            .eq("user_id", userId)
            .eq("is_active", true),

          supabase
            .from("habit_completions")
            .select("habit_id")
            .eq("user_id", userId)
            .gte(
              "completed_at",
              `${todayDateStr}T00:00:00`,
            ),

          supabase
            .from("workout_sessions")
            .select("id, started_at, completed_at, total_volume")
            .eq("user_id", userId)
            .gte("started_at", `${todayDateStr}T00:00:00`)
            .limit(1),

          supabase
            .from("water_logs")
            .select("amount_oz")
            .eq("user_id", userId)
            .gte("logged_at", `${todayDateStr}T00:00:00`),
        ]);

      const todayMeals = mealsRes.data ?? [];
      const activeHabits = habitsRes.data ?? [];
      const completedHabitIds = new Set(
        (habitCompletionsRes.data ?? []).map(
          (c: { habit_id: string }) => c.habit_id,
        ),
      );
      const todayWorkout = workoutRes.data?.[0] ?? null;
      const waterLogs = waterRes.data ?? [];

      const caloriesLogged = todayMeals.reduce(
        (sum: number, m: { calories: number }) => sum + (m.calories ?? 0),
        0,
      );
      const proteinLogged = todayMeals.reduce(
        (sum: number, m: { protein_g: number }) => sum + (m.protein_g ?? 0),
        0,
      );
      const waterOzLogged = waterLogs.reduce(
        (sum: number, w: { amount_oz: number }) => sum + (w.amount_oz ?? 0),
        0,
      );
      const habitsCompleted = activeHabits.filter((h: { id: string }) =>
        completedHabitIds.has(h.id),
      ).length;
      const habitsIncomplete = activeHabits
        .filter((h: { id: string }) => !completedHabitIds.has(h.id))
        .map((h: { name: string }) => h.name);

      const todayData = {
        window,
        calories: {
          logged: Math.round(caloriesLogged),
          target: profile.daily_calorie_target ?? null,
          remaining:
            profile.daily_calorie_target != null
              ? Math.max(
                  0,
                  (profile.daily_calorie_target as number) - caloriesLogged,
                )
              : null,
        },
        protein: {
          logged: Math.round(proteinLogged),
          target: profile.daily_protein_target ?? null,
        },
        water: {
          oz_logged: Math.round(waterOzLogged),
          oz_target: profile.daily_water_target_oz ?? null,
        },
        habits: {
          completed: habitsCompleted,
          total: activeHabits.length,
          incomplete_names: habitsIncomplete.slice(0, 5),
        },
        workout: todayWorkout
          ? { logged: true, completed: !!todayWorkout.completed_at }
          : { logged: false, completed: false },
      };

      // Skip midday check if user is already at 80%+ completion
      if (window === "midday") {
        const completionFactors: number[] = [];
        if (
          profile.daily_calorie_target &&
          (profile.daily_calorie_target as number) > 0
        ) {
          completionFactors.push(
            Math.min(
              1,
              caloriesLogged / (profile.daily_calorie_target as number),
            ),
          );
        }
        if (activeHabits.length > 0) {
          completionFactors.push(habitsCompleted / activeHabits.length);
        }
        if (completionFactors.length > 0) {
          const avgCompletion =
            completionFactors.reduce((a, b) => a + b, 0) /
            completionFactors.length;
          if (avgCompletion >= 0.8) continue;
        }
      }

      // Skip evening if user already did a nightly check-in
      if (window === "evening") {
        const eveningStart = new Date(userLocalTime);
        eveningStart.setHours(18, 0, 0, 0);
        const { count: eveningCheckCount } = await supabase
          .from("proactive_messages")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("category", "nightly_check_in")
          .gte("created_at", eveningStart.toISOString());
        if ((eveningCheckCount ?? 0) > 0) continue;
      }

      const systemPrompt = buildAccountabilityPrompt(
        window,
        coachingTone,
        {
          name: profile.display_name,
          calorie_target: profile.daily_calorie_target,
          protein_target: profile.daily_protein_target,
          water_target_oz: profile.daily_water_target_oz,
          coaching_tone: coachingTone,
        },
        todayData,
      );

      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: AI_MODEL,
            max_tokens: 512,
            system: systemPrompt,
            messages: [
              {
                role: "user",
                content: `Generate today's ${window} accountability message for ${profile.display_name ?? "the user"}.`,
              },
            ],
          }),
        });

        const aiData = await response.json();
        const rawText =
          aiData.content?.[0]?.text ?? "";

        let parsed: {
          title: string;
          body: string;
          completion_pct: number;
          severity: string;
        };
        try {
          parsed = JSON.parse(rawText);
        } catch {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            continue;
          }
        }

        // Store in proactive_messages
        await supabase.from("proactive_messages").insert({
          user_id: userId,
          category: `accountability_${window}`,
          title: parsed.title ?? "Daily Check-In",
          body: parsed.body ?? rawText,
          severity: parsed.severity ?? "info",
          action_label: "Talk to Coach",
          action_route: "/(tabs)/coach",
          expires_at: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
        });

        // Push notification
        await supabase.from("notifications").insert({
          user_id: userId,
          type: `accountability_${window}`,
          title: parsed.title ?? "Daily Check-In",
          body:
            parsed.body.length > 100
              ? parsed.body.substring(0, 97) + "..."
              : parsed.body,
          scheduled_for: now.toISOString(),
          data: JSON.stringify({ route: "/(tabs)/dashboard" }),
        });

        messagesSent++;
      } catch {
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        processed: profiles.length,
        messages_sent: messagesSent,
        timestamp: now.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
