// NOTE: No AI API calls — compliance preamble not required
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function chargeStake(
  paymentMethodId: string,
  customerId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; charge_id?: string; error?: string }> {
  try {
    const response = await fetch(
      "https://api.stripe.com/v1/payment_intents",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          amount: String(Math.round(amount * 100)),
          currency: "usd",
          customer: customerId,
          payment_method: paymentMethodId,
          confirm: "true",
          off_session: "true",
          description,
        }).toString(),
      }
    );
    const data = await response.json();
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    return { success: true, charge_id: data.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
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

    // Optionally evaluate a specific stake
    let stakeId: string | null = null;
    try {
      const body = await req.json();
      stakeId = body.stake_id || null;
    } catch {
      // No body
    }

    // Fetch stakes that are due for evaluation
    let query = supabaseAdmin
      .from("stakes")
      .select("*")
      .eq("status", "active")
      .lte("evaluation_date", new Date().toISOString());

    if (stakeId) {
      query = query.eq("id", stakeId);
    }

    const { data: stakes, error: stakesError } = await query;
    if (stakesError) throw stakesError;

    const evaluations: any[] = [];

    for (const stake of stakes || []) {
      const userId = stake.user_id;

      // Evaluate criteria based on goal type
      let passed = false;
      let evidence: any = {};

      switch (stake.goal_type) {
        case "weight": {
          const { data: latestWeight } = await supabaseAdmin
            .from("weight_logs")
            .select("weight_lbs")
            .eq("user_id", userId)
            .order("logged_at", { ascending: false })
            .limit(1)
            .single();

          const currentWeight = latestWeight?.weight_lbs;
          const targetWeight = stake.target_value;

          if (stake.goal_direction === "lose") {
            passed = currentWeight != null && currentWeight <= targetWeight;
          } else {
            passed = currentWeight != null && currentWeight >= targetWeight;
          }
          evidence = { current_weight: currentWeight, target_weight: targetWeight };
          break;
        }

        case "workout_count": {
          const { count } = await supabaseAdmin
            .from("workout_sessions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("started_at", stake.start_date)
            .lte("started_at", stake.evaluation_date);

          passed = (count || 0) >= stake.target_value;
          evidence = { workouts_completed: count, target: stake.target_value };
          break;
        }

        case "streak": {
          const { data: streakData } = await supabaseAdmin
            .from("streaks")
            .select("current_count")
            .eq("user_id", userId)
            .eq("streak_type", "daily_checkin")
            .single();

          passed = (streakData?.current_count || 0) >= stake.target_value;
          evidence = { current_streak: streakData?.current_count, target: stake.target_value };
          break;
        }

        case "checkin_rate": {
          const startDate = new Date(stake.start_date);
          const endDate = new Date(stake.evaluation_date);
          const totalDays = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          const { count } = await supabaseAdmin
            .from("daily_checkins")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("completed", true)
            .gte("date", stake.start_date)
            .lte("date", stake.evaluation_date);

          const rate = totalDays > 0 ? ((count || 0) / totalDays) * 100 : 0;
          passed = rate >= stake.target_value;
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

      let chargeResult = null;

      // If failed, trigger Stripe charge
      if (!passed && stake.stripe_payment_method_id && stake.stripe_customer_id) {
        chargeResult = await chargeStake(
          stake.stripe_payment_method_id,
          stake.stripe_customer_id,
          stake.amount,
          `TRANSFORMR stake charge: Failed ${stake.goal_type} goal`
        );
      }

      // Update stake status
      const { error: updateError } = await supabaseAdmin
        .from("stakes")
        .update({
          status: passed ? "passed" : "failed",
          evaluated_at: new Date().toISOString(),
          evaluation_evidence: evidence,
          charge_id: chargeResult?.charge_id || null,
        })
        .eq("id", stake.id);

      // Notify user
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        type: passed ? "stake_passed" : "stake_failed",
        title: passed ? "Goal Achieved! Stake Saved" : "Stake Lost",
        body: passed
          ? `You hit your ${stake.goal_type} goal! Your $${stake.amount} stake is safe.`
          : `You missed your ${stake.goal_type} goal. $${stake.amount} has been charged.`,
        data: { stake_id: stake.id, evidence, passed },
        scheduled_for: new Date().toISOString(),
      });

      evaluations.push({
        stake_id: stake.id,
        user_id: userId,
        goal_type: stake.goal_type,
        passed,
        evidence,
        charged: !passed && chargeResult?.success === true,
        charge_error: chargeResult?.error || null,
        update_error: updateError?.message || null,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        evaluated: evaluations.length,
        evaluations,
        timestamp: new Date().toISOString(),
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
