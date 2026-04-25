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

    // 1. Fetch all pending or active referrals
    const { data: referrals, error: referralsError } = await supabaseAdmin
      .from("referrals")
      .select("*")
      .in("status", ["pending", "active"]);

    if (referralsError) throw referralsError;

    let processed = 0;
    let activated = 0;
    let deactivated = 0;

    for (const referral of referrals || []) {
      processed++;

      // 2. Check if the referred user is still subscribed
      const { data: stripeCustomer, error: stripeError } = await supabaseAdmin
        .from("stripe_customers")
        .select("subscription_status, current_tier, user_id")
        .eq("user_id", referral.referred_id)
        .maybeSingle();

      if (stripeError) throw stripeError;

      const isSubscribed =
        stripeCustomer?.subscription_status === "active" ||
        stripeCustomer?.subscription_status === "trialing";

      // 3. Count activity in last 30 days using daily_checkins as a proxy
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activityCount, error: activityError } = await supabaseAdmin
        .from("daily_checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", referral.referred_id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

      if (activityError) throw activityError;

      const activity30d = activityCount ?? 0;

      // 4. Update consecutive_months — increment if still subscribed this month
      let consecutiveMonths = referral.consecutive_months ?? 0;
      if (isSubscribed) {
        consecutiveMonths++;
      } else {
        consecutiveMonths = 0;
      }

      // Determine new status
      let newStatus = referral.status;
      let qualifiedAt = referral.qualified_at;

      // 6. If subscription cancelled → inactive
      if (!isSubscribed) {
        if (referral.status !== "inactive") {
          newStatus = "inactive";
          deactivated++;
        }
      }
      // 5. If consecutive_months >= 2 AND activity_count_30d >= 3 → active
      else if (consecutiveMonths >= 2 && activity30d >= 3) {
        if (referral.status !== "active") {
          newStatus = "active";
          qualifiedAt = new Date().toISOString();
          activated++;
        }
      }

      // Persist referral updates
      const { error: updateError } = await supabaseAdmin
        .from("referrals")
        .update({
          is_subscribed: isSubscribed,
          consecutive_months: consecutiveMonths,
          activity_count_30d: activity30d,
          last_active_at: activity30d > 0 ? new Date().toISOString() : referral.last_active_at,
          status: newStatus,
          qualified_at: qualifiedAt,
          subscription_tier: stripeCustomer?.current_tier ?? referral.subscription_tier,
        })
        .eq("id", referral.id);

      if (updateError) throw updateError;

      // 7. If status changed, recalculate referrer's Transformation Circle tier
      if (newStatus !== referral.status) {
        const { data: tierData, error: tierError } = await supabaseAdmin.rpc(
          "get_referral_tier",
          { check_user: referral.referrer_id }
        );

        if (tierError) throw tierError;

        // 8. If tier qualifies for a reward, create a referral_rewards entry
        const tierRow = tierData?.[0];
        if (tierRow && tierRow.tier_name !== "none") {
          // Check if a reward for this tier already exists to avoid duplicates
          const { data: existingReward, error: rewardCheckError } =
            await supabaseAdmin
              .from("referral_rewards")
              .select("id")
              .eq("user_id", referral.referrer_id)
              .eq("source", "transformation_circle")
              .eq("tier_granted", tierRow.tier_name)
              .maybeSingle();

          if (rewardCheckError) throw rewardCheckError;

          if (!existingReward) {
            const rewardDescriptions: Record<string, { description: string; freeMonths: number }> = {
              pro_month: {
                description: "Transformation Circle: 3 active referrals — 1 free month of Pro",
                freeMonths: 1,
              },
              elite_month: {
                description: "Transformation Circle: 5 active referrals — 1 free month of Elite",
                freeMonths: 1,
              },
              partners_month: {
                description: "Transformation Circle: 10 active referrals — 1 free month of Partners",
                freeMonths: 1,
              },
              lifetime_pro: {
                description: "Transformation Circle: 25 active referrals — Lifetime Pro access",
                freeMonths: 0,
              },
            };

            const rewardInfo = rewardDescriptions[tierRow.tier_name];
            if (rewardInfo) {
              const { error: insertRewardError } = await supabaseAdmin
                .from("referral_rewards")
                .insert({
                  user_id: referral.referrer_id,
                  reward_type: "tier_unlock",
                  source: "transformation_circle",
                  description: rewardInfo.description,
                  free_months: rewardInfo.freeMonths,
                  tier_granted: tierRow.tier_name,
                  status: "earned",
                  triggered_by_referral_id: referral.id,
                  triggered_by_milestone: `circle_${tierRow.tier_name}`,
                });

              if (insertRewardError) throw insertRewardError;
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ processed, activated, deactivated }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
