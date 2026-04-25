// NOTE: No AI API calls — compliance preamble not required
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TierThreshold {
  minReferrals: number;
  name: string;
  revenueSharePercent: number;
}

const CREATOR_TIERS: TierThreshold[] = [
  { minReferrals: 50, name: "gold", revenueSharePercent: 25 },
  { minReferrals: 25, name: "silver", revenueSharePercent: 20 },
  { minReferrals: 10, name: "standard", revenueSharePercent: 15 },
];

function determineCreatorTier(activeReferralCount: number): TierThreshold | null {
  for (const tier of CREATOR_TIERS) {
    if (activeReferralCount >= tier.minReferrals) {
      return tier;
    }
  }
  return null;
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

    // Determine previous month date range
    const now = new Date();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const prevMonthStartISO = prevMonthStart.toISOString();
    const prevMonthEndISO = prevMonthEnd.toISOString();

    // Fetch all creator profiles
    const { data: creators, error: creatorsError } = await supabaseAdmin
      .from("creator_profiles")
      .select("*");

    if (creatorsError) {
      return new Response(
        JSON.stringify({ error: creatorsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let creatorsProcessed = 0;
    let totalPayoutsCreated = 0;

    for (const creator of creators ?? []) {
      // Query active referrals for this creator
      const { data: referrals, error: referralsError } = await supabaseAdmin
        .from("referrals")
        .select("referred_user_id")
        .eq("referrer_id", creator.user_id)
        .eq("status", "active");

      if (referralsError) {
        continue;
      }

      const activeReferralCount = referrals?.length ?? 0;
      const referredUserIds = (referrals ?? []).map((r: { referred_user_id: string }) => r.referred_user_id);

      // Sum billing_ledger payments from previous month for referred users
      let totalRevenue = 0;
      if (referredUserIds.length > 0) {
        const { data: payments, error: paymentsError } = await supabaseAdmin
          .from("billing_ledger")
          .select("amount")
          .in("user_id", referredUserIds)
          .eq("status", "completed")
          .gte("created_at", prevMonthStartISO)
          .lte("created_at", prevMonthEndISO);

        if (!paymentsError && payments) {
          totalRevenue = payments.reduce(
            (sum: number, p: { amount: number }) => sum + (p.amount ?? 0),
            0
          );
        }
      }

      // Determine tier and revenue share
      const tier = determineCreatorTier(activeReferralCount);
      const revenueSharePercent = tier?.revenueSharePercent ?? creator.revenue_share_percent ?? 15;
      const payoutAmount = (totalRevenue * revenueSharePercent) / 100;

      // Create payout entry if there is revenue
      if (payoutAmount > 0) {
        const { error: payoutError } = await supabaseAdmin
          .from("revenue_share_payouts")
          .insert({
            creator_id: creator.user_id,
            period_start: prevMonthStartISO,
            period_end: prevMonthEndISO,
            gross_revenue: totalRevenue,
            revenue_share_percent: revenueSharePercent,
            payout_amount: payoutAmount,
            status: "pending",
          });

        if (!payoutError) {
          totalPayoutsCreated++;
        }
      }

      // Update creator profile
      const updateFields: Record<string, unknown> = {
        pending_payout: (creator.pending_payout ?? 0) + payoutAmount,
        active_referral_count: activeReferralCount,
      };

      if (tier) {
        updateFields.tier = tier.name;
        updateFields.revenue_share_percent = tier.revenueSharePercent;
      }

      await supabaseAdmin
        .from("creator_profiles")
        .update(updateFields)
        .eq("user_id", creator.user_id);

      creatorsProcessed++;
    }

    return new Response(
      JSON.stringify({ creatorsProcessed, totalPayoutsCreated }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
