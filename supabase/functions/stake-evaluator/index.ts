// =============================================================================
// TRANSFORMR — Stake Evaluator
// Runs daily via cron. Evaluates goals, captures holds on failure, cancels on pass.
// Uses payment_intent_id + capture/cancel (NOT create new intent on failure).
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Capture an existing hold — user FAILED the goal, charge them.
async function captureStakeHold(
  paymentIntentId: string,
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const response = await fetch(
      `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const data = await response.json();
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    return { success: true, status: data.status };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// Cancel an existing hold — user PASSED the goal, release their funds.
async function cancelStakeHold(
  paymentIntentId: string,
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const response = await fetch(
      `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const data = await response.json();
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    return { success: true, status: data.status };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

interface EvaluationResult {
  stake_id: string;
  user_id: string;
  goal_type: string;
  passed: boolean;
  evidence: Record<string, unknown>;
  payment_action: "captured" | "cancelled" | "skipped";
  payment_error: string | null;
  update_error: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let stakeId: string | null = null;
    try {
      const body = await req.json();
      stakeId = body.stake_id || null;
    } catch {
      // No body — cron run, evaluate all due stakes
    }

    // Fetch active stake_goals that are due for evaluation
    let query = supabaseAdmin
      .from("stake_goals")
      .select("*")
      .eq("status", "active")
      .lte("evaluation_date", new Date().toISOString());

    if (stakeId) {
      query = query.eq("id", stakeId);
    }

    const { data: stakes, error: stakesError } = await query;
    if (stakesError) throw stakesError;

    const evaluations: EvaluationResult[] = [];

    for (const stake of stakes ?? []) {
      const userId = stake.user_id as string;
      let passed = false;
      let evidence: Record<string, unknown> = {};

      switch (stake.goal_type as string) {
        case "weight": {
          const { data: latestWeight } = await supabaseAdmin
            .from("weight_logs")
            .select("weight_lbs")
            .eq("user_id", userId)
            .order("logged_at", { ascending: false })
            .limit(1)
            .single();

          const current = (latestWeight?.weight_lbs as number) ?? null;
          const target = stake.target_value as number;

          if (stake.goal_direction === "lose" || stake.goal_direction === "not_exceed") {
            passed = current !== null && current <= target;
          } else {
            passed = current !== null && current >= target;
          }
          evidence = { current_weight: current, target_weight: target };
          break;
        }

        case "workout_count": {
          const { count } = await supabaseAdmin
            .from("workout_sessions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("started_at", stake.start_date)
            .lte("started_at", stake.evaluation_date);

          passed = (count ?? 0) >= (stake.target_value as number);
          evidence = { workouts_completed: count, target: stake.target_value };
          break;
        }

        case "streak": {
          const { data: streakData } = await supabaseAdmin
            .from("habits")
            .select("current_streak")
            .eq("user_id", userId)
            .order("current_streak", { ascending: false })
            .limit(1)
            .single();

          passed = ((streakData?.current_streak as number) ?? 0) >= (stake.target_value as number);
          evidence = { current_streak: streakData?.current_streak, target: stake.target_value };
          break;
        }

        case "checkin_rate": {
          const startDate = new Date(stake.start_date as string);
          const endDate = new Date(stake.evaluation_date as string);
          const totalDays = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          );

          const { count } = await supabaseAdmin
            .from("daily_checkins")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("completed", true)
            .gte("date", stake.start_date)
            .lte("date", stake.evaluation_date);

          const rate = totalDays > 0 ? ((count ?? 0) / totalDays) * 100 : 0;
          passed = rate >= (stake.target_value as number);
          evidence = {
            checkins_completed: count,
            total_days: totalDays,
            rate_percent: Math.round(rate),
            target_percent: stake.target_value,
          };
          break;
        }

        default:
          evidence = { error: `Unknown goal type: ${stake.goal_type}` };
      }

      const paymentIntentId = stake.payment_intent_id as string | null;
      let paymentAction: EvaluationResult["payment_action"] = "skipped";
      let paymentError: string | null = null;

      if (paymentIntentId) {
        if (passed) {
          // Goal achieved — cancel the hold, user keeps their money
          const result = await cancelStakeHold(paymentIntentId);
          paymentAction = "cancelled";
          paymentError = result.error ?? null;
        } else {
          // Goal failed — capture the hold, charge the user
          const result = await captureStakeHold(paymentIntentId);
          paymentAction = "captured";
          paymentError = result.error ?? null;
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from("stake_goals")
        .update({
          status: passed ? "passed" : "failed",
          evaluated_at: new Date().toISOString(),
          evaluation_evidence: evidence,
        })
        .eq("id", stake.id);

      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        type: passed ? "stake_passed" : "stake_failed",
        title: passed ? "Goal Achieved! Stake Saved" : "Stake Lost",
        body: passed
          ? `You hit your ${stake.goal_type} goal! Your $${stake.stake_amount} stake hold has been released.`
          : `You missed your ${stake.goal_type} goal. Your $${stake.stake_amount} stake has been captured.`,
        data: { stake_id: stake.id, evidence, passed },
        scheduled_for: new Date().toISOString(),
      });

      evaluations.push({
        stake_id: stake.id as string,
        user_id: userId,
        goal_type: stake.goal_type as string,
        passed,
        evidence,
        payment_action: paymentAction,
        payment_error: paymentError,
        update_error: updateError?.message ?? null,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        evaluated: evaluations.length,
        evaluations,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
