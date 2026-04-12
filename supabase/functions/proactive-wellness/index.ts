// =============================================================================
// TRANSFORMR -- Proactive Wellness Cron (Module 7)
// Daily job that generates AI-powered proactive wellness messages. Uses Claude
// to synthesize patterns across all user data and insert actionable nudges.
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: users, error: usersErr } = await supabase
      .from("profiles")
      .select("id, display_name, daily_calorie_target, daily_protein_target, goal_weight, goal_direction");
    if (usersErr) throw usersErr;
    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, messages_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let messagesSent = 0;

    for (const user of users) {
      const userId = user.id as string;

      // Check if we already sent a proactive message today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from("proactive_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .neq("category", "reorder")
        .neq("category", "supplement_reminder")
        .gte("created_at", todayStart.toISOString());

      if ((todayCount ?? 0) >= 2) continue; // Max 2 AI messages per day

      const [workoutsRes, mealsRes, sleepRes, moodRes, goalsRes] =
        await Promise.all([
          supabase
            .from("workout_sessions")
            .select("started_at, total_volume")
            .eq("user_id", userId)
            .gte("started_at", sevenDaysAgo)
            .order("started_at", { ascending: false })
            .limit(7),
          supabase
            .from("meal_logs")
            .select("logged_at, calories, protein_g")
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
            .select("logged_at, mood, energy, stress")
            .eq("user_id", userId)
            .gte("logged_at", sevenDaysAgo)
            .order("logged_at", { ascending: false })
            .limit(7),
          supabase
            .from("goals")
            .select("title, category, target_value, current_value, target_date")
            .eq("user_id", userId)
            .eq("status", "active")
            .limit(5),
        ]);

      const contextSummary = {
        profile: {
          name: user.display_name,
          calorie_target: user.daily_calorie_target,
          protein_target: user.daily_protein_target,
          goal_weight: user.goal_weight,
          goal_direction: user.goal_direction,
        },
        workouts_7d: workoutsRes.data ?? [],
        meals_7d: mealsRes.data ?? [],
        sleep_7d: sleepRes.data ?? [],
        mood_7d: moodRes.data ?? [],
        active_goals: goalsRes.data ?? [],
      };

      const systemPrompt =
        COMPLIANCE_PREAMBLE +
        "\n\n" +
        `You are the TRANSFORMR proactive wellness engine. Generate ONE personalized nudge based on the user's recent data patterns.

Rules:
- Be specific — reference actual numbers
- Be actionable — suggest one concrete next step
- Use compliance-safe language
- Choose the most impactful insight from the data
- Return valid JSON: { "category": "plateau|overtraining|pr_approaching|weight_stall|calorie_deficit_risk|sleep_debt|streak_risk|goal_ahead|goal_behind|recovery_needed|general", "title": "Short title", "body": "2-3 sentence insight with data", "severity": "info|warning|critical", "action_label": "Button text or null" }`;

      const userMessage = `User data (past 7 days): ${JSON.stringify(contextSummary)}

Generate one proactive wellness nudge.`;

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
            messages: [{ role: "user", content: userMessage }],
          }),
        });

        const aiData = await response.json();
        const rawText = aiData.content[0].text;

        let parsed;
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

        await supabase.from("proactive_messages").insert({
          user_id: userId,
          category: parsed.category ?? "general",
          title: parsed.title ?? "Wellness Insight",
          body: parsed.body ?? rawText,
          severity: parsed.severity ?? "info",
          action_label: parsed.action_label ?? null,
          expires_at: new Date(
            Date.now() + 2 * 24 * 3600 * 1000,
          ).toISOString(),
        });

        messagesSent++;
      } catch {
        // Skip this user on AI error
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        processed: users.length,
        messages_sent: messagesSent,
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
