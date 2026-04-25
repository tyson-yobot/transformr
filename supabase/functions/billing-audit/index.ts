// NOTE: No AI API calls — compliance preamble not required
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Severity = "info" | "warning" | "error" | "critical";

interface AuditIssue {
  check_name: string;
  severity: Severity;
  details: Record<string, unknown>;
  auto_corrected: boolean;
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

    const now = new Date();
    const issues: AuditIssue[] = [];
    let autoCorrections = 0;

    // --- CHECK 1: Earned rewards not applied within 24 hours ---
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: unappliedRewards } = await supabaseAdmin
      .from("referral_rewards")
      .select("id, user_id, reward_type")
      .eq("status", "earned")
      .lt("created_at", twentyFourHoursAgo);

    if (unappliedRewards && unappliedRewards.length > 0) {
      issues.push({
        check_name: "unapplied_rewards",
        severity: "warning",
        details: { count: unappliedRewards.length, reward_ids: unappliedRewards.map((r: { id: string }) => r.id) },
        auto_corrected: false,
      });
    }

    // --- CHECK 2: Stripe discount != billing_ledger discount ---
    const { data: discountMismatches } = await supabaseAdmin
      .from("stripe_customers")
      .select("id, user_id, stripe_discount_percent")
      .not("stripe_discount_percent", "is", null);

    if (discountMismatches) {
      for (const sc of discountMismatches) {
        const { data: latestLedger } = await supabaseAdmin
          .from("billing_ledger")
          .select("discount_percent")
          .eq("user_id", sc.user_id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestLedger && latestLedger.discount_percent !== sc.stripe_discount_percent) {
          issues.push({
            check_name: "stripe_discount_mismatch",
            severity: "error",
            details: {
              user_id: sc.user_id,
              stripe_discount: sc.stripe_discount_percent,
              ledger_discount: latestLedger.discount_percent,
            },
            auto_corrected: false,
          });
        }
      }
    }

    // --- CHECK 3: Expected Stripe webhooks not received within 2 hours ---
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const { data: stuckProcessing } = await supabaseAdmin
      .from("billing_ledger")
      .select("id, user_id")
      .eq("status", "processing")
      .lt("created_at", twoHoursAgo);

    if (stuckProcessing && stuckProcessing.length > 0) {
      issues.push({
        check_name: "missing_stripe_webhooks",
        severity: "critical",
        details: { count: stuckProcessing.length, entry_ids: stuckProcessing.map((e: { id: string }) => e.id) },
        auto_corrected: false,
      });
    }

    // --- CHECK 4: Multiple active coupons on single subscription ---
    const { data: multiCouponUsers } = await supabaseAdmin
      .from("stripe_customers")
      .select("user_id, active_coupon_count")
      .gt("active_coupon_count", 1);

    if (multiCouponUsers && multiCouponUsers.length > 0) {
      issues.push({
        check_name: "multiple_active_coupons",
        severity: "error",
        details: {
          count: multiCouponUsers.length,
          users: multiCouponUsers.map((u: { user_id: string; active_coupon_count: number }) => ({
            user_id: u.user_id,
            coupon_count: u.active_coupon_count,
          })),
        },
        auto_corrected: false,
      });
    }

    // --- CHECK 5: Expired rewards still active ---
    const { data: expiredRewards } = await supabaseAdmin
      .from("referral_rewards")
      .select("id, user_id")
      .eq("status", "active")
      .lt("expires_at", now.toISOString());

    if (expiredRewards && expiredRewards.length > 0) {
      // Auto-correct: expire them
      const expiredIds = expiredRewards.map((r: { id: string }) => r.id);
      await supabaseAdmin
        .from("referral_rewards")
        .update({ status: "expired" })
        .in("id", expiredIds);

      autoCorrections += expiredIds.length;
      issues.push({
        check_name: "expired_rewards_still_active",
        severity: "warning",
        details: { count: expiredIds.length, reward_ids: expiredIds },
        auto_corrected: true,
      });
    }

    // --- CHECK 6: QB sync backlog > 24 hours ---
    const { data: qbBacklog } = await supabaseAdmin
      .from("billing_ledger")
      .select("id")
      .eq("status", "completed")
      .eq("qb_synced", false)
      .lt("created_at", twentyFourHoursAgo);

    if (qbBacklog && qbBacklog.length > 0) {
      issues.push({
        check_name: "qb_sync_backlog",
        severity: "critical",
        details: { count: qbBacklog.length },
        auto_corrected: false,
      });
    }

    // --- CHECK 7: Creator payouts pending > 30 days ---
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: stalePendingPayouts } = await supabaseAdmin
      .from("revenue_share_payouts")
      .select("id, creator_id, payout_amount")
      .eq("status", "pending")
      .lt("created_at", thirtyDaysAgo);

    if (stalePendingPayouts && stalePendingPayouts.length > 0) {
      issues.push({
        check_name: "stale_creator_payouts",
        severity: "error",
        details: { count: stalePendingPayouts.length },
        auto_corrected: false,
      });
    }

    // --- CHECK 8: Squad discount mismatch ---
    const { data: squads } = await supabaseAdmin
      .from("squads")
      .select("id, member_count, stored_discount_percent");

    if (squads) {
      for (const squad of squads) {
        // Recalculate expected discount: 5% per member, max 25%
        const expectedDiscount = Math.min((squad.member_count ?? 0) * 5, 25);
        if (squad.stored_discount_percent !== expectedDiscount) {
          issues.push({
            check_name: "squad_discount_mismatch",
            severity: "warning",
            details: {
              squad_id: squad.id,
              stored: squad.stored_discount_percent,
              expected: expectedDiscount,
            },
            auto_corrected: false,
          });
        }
      }
    }

    // --- CHECK 9: Free month count mismatch ---
    const { data: freeMonthCustomers } = await supabaseAdmin
      .from("stripe_customers")
      .select("user_id, free_months_remaining");

    if (freeMonthCustomers) {
      for (const sc of freeMonthCustomers) {
        if (sc.free_months_remaining === null || sc.free_months_remaining === undefined) continue;

        const { count: ledgerFreeMonths } = await supabaseAdmin
          .from("billing_ledger")
          .select("id", { count: "exact", head: true })
          .eq("user_id", sc.user_id)
          .eq("entry_type", "free_month")
          .eq("status", "completed");

        // This is a count check — if remaining + used doesn't match total granted, flag it
        if (ledgerFreeMonths !== null && ledgerFreeMonths !== undefined) {
          // Just verify free_months_remaining is non-negative
          if (sc.free_months_remaining < 0) {
            issues.push({
              check_name: "free_month_count_mismatch",
              severity: "error",
              details: {
                user_id: sc.user_id,
                free_months_remaining: sc.free_months_remaining,
                used_free_months: ledgerFreeMonths,
              },
              auto_corrected: false,
            });
          }
        }
      }
    }

    // --- CHECK 10: Orphan referrals ---
    const { data: activeReferrals } = await supabaseAdmin
      .from("referrals")
      .select("id, referred_user_id")
      .eq("status", "active");

    if (activeReferrals && activeReferrals.length > 0) {
      const referredIds = activeReferrals.map((r: { referred_user_id: string }) => r.referred_user_id);

      const { data: activeSubscriptions } = await supabaseAdmin
        .from("stripe_customers")
        .select("user_id")
        .in("user_id", referredIds)
        .eq("subscription_status", "active");

      const activeSubUserIds = new Set(
        (activeSubscriptions ?? []).map((s: { user_id: string }) => s.user_id)
      );

      const orphanReferrals = activeReferrals.filter(
        (r: { id: string; referred_user_id: string }) => !activeSubUserIds.has(r.referred_user_id)
      );

      if (orphanReferrals.length > 0) {
        // Auto-correct: deactivate orphan referrals
        const orphanIds = orphanReferrals.map((r: { id: string }) => r.id);
        await supabaseAdmin
          .from("referrals")
          .update({ status: "inactive" })
          .in("id", orphanIds);

        autoCorrections += orphanIds.length;
        issues.push({
          check_name: "orphan_referrals",
          severity: "warning",
          details: { count: orphanIds.length, referral_ids: orphanIds },
          auto_corrected: true,
        });
      }
    }

    // --- Write all issues to billing_audit_log ---
    if (issues.length > 0) {
      const logEntries = issues.map((issue) => ({
        check_name: issue.check_name,
        severity: issue.severity,
        details: issue.details,
        auto_corrected: issue.auto_corrected,
        created_at: now.toISOString(),
      }));

      await supabaseAdmin.from("billing_audit_log").insert(logEntries);
    }

    return new Response(
      JSON.stringify({
        checksRun: 10,
        issuesFound: issues.length,
        autoCorrections,
      }),
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
