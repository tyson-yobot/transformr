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

async function callClaude(systemPrompt: string, userMessage: string) {
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
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await response.json();
  return data.content[0].text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { enrollment_id } = await req.json();
    if (!enrollment_id) {
      return new Response(
        JSON.stringify({ error: "enrollment_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role client for broader read access across related tables
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Load the enrollment with challenge definition
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from("challenge_enrollments")
      .select(`
        id,
        user_id,
        challenge_id,
        started_at,
        target_end_date,
        status,
        current_day,
        restart_count,
        configuration,
        challenge_definitions (
          id,
          name,
          slug,
          description,
          duration_days,
          category,
          rules,
          restart_on_failure,
          difficulty,
          estimated_daily_time_minutes
        )
      `)
      .eq("id", enrollment_id)
      .eq("user_id", user.id)
      .single();

    if (enrollError || !enrollment) {
      return new Response(
        JSON.stringify({ error: "Enrollment not found or access denied" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const challenge = enrollment.challenge_definitions as any;

    // 2. Load daily logs for this enrollment
    const { data: dailyLogs } = await supabaseAdmin
      .from("challenge_daily_logs")
      .select("day_number, date, tasks_completed, all_tasks_completed, auto_verified, notes")
      .eq("enrollment_id", enrollment_id)
      .order("day_number", { ascending: true });

    // 3. Compute progress stats from daily logs
    const totalLogged = (dailyLogs || []).length;
    const completedDays = (dailyLogs || []).filter(
      (l: any) => l.all_tasks_completed
    ).length;
    const incompleteDays = totalLogged - completedDays;

    // Identify which tasks have been missed most
    const taskMissCount: Record<string, number> = {};
    const tasks = challenge.rules?.tasks || [];
    for (const log of dailyLogs || []) {
      const tc = log.tasks_completed as Record<string, boolean>;
      for (const task of tasks) {
        if (!tc[task.id]) {
          taskMissCount[task.id] = (taskMissCount[task.id] || 0) + 1;
        }
      }
    }

    // Get the last 7 days of logs for recent context
    const recentLogs = (dailyLogs || []).slice(-7);

    // Determine recent misses (last 7 days)
    const recentMisses: Record<string, number> = {};
    for (const log of recentLogs) {
      const tc = log.tasks_completed as Record<string, boolean>;
      for (const task of tasks) {
        if (!tc[task.id]) {
          recentMisses[task.id] = (recentMisses[task.id] || 0) + 1;
        }
      }
    }

    // 4. Build the task summary for the AI
    const taskSummary = tasks.map((t: any) => ({
      id: t.id,
      label: t.label,
      type: t.type,
      total_misses: taskMissCount[t.id] || 0,
      recent_misses_7d: recentMisses[t.id] || 0,
    }));

    // 5. Calculate days remaining and percent complete
    const daysRemaining = challenge.duration_days - enrollment.current_day + 1;
    const percentComplete = Math.round(
      ((enrollment.current_day - 1) / challenge.duration_days) * 100
    );

    // 6. Build the prompt
    const systemPrompt = COMPLIANCE_PREAMBLE + "\n\n" + `You are the TRANSFORMR Challenge Coach, an AI that provides personalized coaching for users doing structured transformation challenges.

You have deep knowledge of popular challenges like 75 Hard, Couch to 5K, Whole30, and others. You understand the psychological aspects of habit formation, dealing with failure and restarts, and building momentum.

Your coaching style:
- Direct and honest, but encouraging
- Reference specific data points (missed tasks, streaks, restart history)
- Provide actionable, concrete suggestions (not vague platitudes)
- Adapt tone to the situation: celebratory for milestones, firm for repeated misses, compassionate for restarts
- Keep messages concise and impactful (2-5 sentences for the main message)

ALWAYS respond with valid JSON in this exact format:
{
  "message": "Main coaching message tailored to the user's current situation",
  "suggestions": ["Specific actionable tip 1", "Tip 2", "Tip 3"],
  "focus_area": "The one task or habit the user should focus on most right now",
  "motivation_level": "high|medium|low",
  "risk_of_failure": "high|medium|low",
  "milestone_note": "Optional note if the user is near a milestone (e.g., halfway, final week) or null"
}`;

    const userMessage = `Challenge: ${challenge.name}
Description: ${challenge.description}
Difficulty: ${challenge.difficulty}
Duration: ${challenge.duration_days} days
Restart on failure: ${challenge.restart_on_failure ? "Yes (strict mode)" : "No"}
Category: ${challenge.category}

User progress:
- Current day: ${enrollment.current_day} of ${challenge.duration_days}
- Days remaining: ${daysRemaining}
- Percent complete: ${percentComplete}%
- Restart count: ${enrollment.restart_count || 0}
- Started on: ${enrollment.started_at}
- Target end date: ${enrollment.target_end_date}

Daily task breakdown:
${taskSummary
  .map(
    (t: any) =>
      `- ${t.label} (${t.type}): missed ${t.total_misses} times total, ${t.recent_misses_7d} times in the last 7 days`
  )
  .join("\n")}

Completed days: ${completedDays} of ${totalLogged} logged
Incomplete days: ${incompleteDays}

Last 7 days detail:
${recentLogs
  .map(
    (l: any) =>
      `Day ${l.day_number} (${l.date}): ${l.all_tasks_completed ? "ALL COMPLETE" : "INCOMPLETE"} - ${JSON.stringify(l.tasks_completed)}`
  )
  .join("\n")}

Provide personalized coaching for this user right now.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        message: aiResponse,
        suggestions: [],
        focus_area: "overall consistency",
        motivation_level: "medium",
        risk_of_failure: "medium",
        milestone_note: null,
      };
    }

    // Add context metadata to the response
    parsed.context = {
      challenge_name: challenge.name,
      current_day: enrollment.current_day,
      duration_days: challenge.duration_days,
      percent_complete: percentComplete,
      restart_count: enrollment.restart_count || 0,
    };

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
