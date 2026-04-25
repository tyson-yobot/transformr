// =============================================================================
// TRANSFORMR — Squad Discount Evaluator
// Runs monthly via cron. Evaluates active squads, calculates group discount
// tiers based on member count and consecutive active months, and applies
// Stripe coupons when the discount tier changes.
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Discount tier calculation
// ---------------------------------------------------------------------------
function getDiscountPercent(activeMemberCount: number): number {
  if (activeMemberCount >= 7) return 40;
  if (activeMemberCount >= 5) return 30;
  if (activeMemberCount >= 3) return 20;
  return 0;
}

// ---------------------------------------------------------------------------
// Stripe helpers
// ---------------------------------------------------------------------------

/** Create a Stripe coupon for the given percent off. Returns coupon id. */
async function createStripeCoupon(
  percentOff: number,
  squadName: string,
): Promise<{ couponId: string | null; error: string | null }> {
  try {
    const params = new URLSearchParams();
    params.append("percent_off", String(percentOff));
    params.append("duration", "repeating");
    params.append("duration_in_months", "1");
    params.append("name", `Squad Discount – ${squadName} (${percentOff}%)`);

    const response = await fetch("https://api.stripe.com/v1/coupons", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = await response.json();
    if (data.error) {
      return { couponId: null, error: data.error.message };
    }
    return { couponId: data.id, error: null };
  } catch (err) {
    return {
      couponId: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Apply a coupon to a Stripe subscription. */
async function applyDiscountToSubscription(
  subscriptionId: string,
  couponId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const params = new URLSearchParams();
    params.append("coupon", couponId);

    const response = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );
    const data = await response.json();
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Remove discount from a Stripe subscription (set coupon to empty). */
async function removeDiscountFromSubscription(
  subscriptionId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}/discount`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        },
      },
    );
    // 200 on success, or already no discount
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error?.message ?? "Unknown error" };
    }
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Fetch all active squads
    const { data: squads, error: squadsError } = await supabaseAdmin
      .from("squads")
      .select("*")
      .eq("is_active", true);

    if (squadsError) {
      throw new Error(`Failed to fetch squads: ${squadsError.message}`);
    }

    let squadsProcessed = 0;
    let discountsUpdated = 0;

    for (const squad of squads ?? []) {
      squadsProcessed++;

      // 2a. Get squad members joined with their stripe customer records
      const { data: members, error: membersError } = await supabaseAdmin
        .from("squad_members")
        .select(`
          id,
          user_id,
          is_active,
          consecutive_months,
          joined_at
        `)
        .eq("squad_id", squad.id)
        .eq("is_active", true);

      if (membersError) {
        console.error(
          `Error fetching members for squad ${squad.id}: ${membersError.message}`,
        );
        continue;
      }

      const activeMembers = members ?? [];
      const totalMemberCount = activeMembers.length;

      // 2b. For each active member, check if they have an active Stripe subscription
      const memberUserIds = activeMembers.map((m) => m.user_id);

      const { data: stripeCustomers, error: stripeError } = await supabaseAdmin
        .from("stripe_customers")
        .select("user_id, stripe_customer_id, stripe_subscription_id, subscription_status")
        .in("user_id", memberUserIds.length > 0 ? memberUserIds : ["__none__"])
        .eq("subscription_status", "active");

      if (stripeError) {
        console.error(
          `Error fetching stripe customers for squad ${squad.id}: ${stripeError.message}`,
        );
        continue;
      }

      const activeSubscribedMembers = stripeCustomers ?? [];
      const activeSubscribedCount = activeSubscribedMembers.length;

      // 2c. Check if ALL members have been active for 3+ consecutive months
      const allMembersQualified =
        activeMembers.length > 0 &&
        activeMembers.every((m) => m.consecutive_months >= 3);

      // Update consecutive_months_all_active on the squad
      const newConsecutiveMonths = allMembersQualified
        ? (squad.consecutive_months_all_active ?? 0) + 1
        : 0;

      // 2d. Calculate discount tier (only if all members qualify)
      const newDiscountPercent = allMembersQualified
        ? getDiscountPercent(activeSubscribedCount)
        : 0;

      const previousDiscount = Number(squad.current_discount_percent ?? 0);
      const discountChanged = newDiscountPercent !== previousDiscount;

      // 2e. If discount changed, apply to each member's Stripe subscription
      if (discountChanged) {
        // Create a coupon if the new discount is > 0
        let couponId: string | null = null;

        if (newDiscountPercent > 0) {
          const couponResult = await createStripeCoupon(
            newDiscountPercent,
            squad.name,
          );
          if (couponResult.error) {
            console.error(
              `Failed to create coupon for squad ${squad.id}: ${couponResult.error}`,
            );
            continue;
          }
          couponId = couponResult.couponId;
        }

        // Apply or remove discount for each subscribed member
        for (const sc of activeSubscribedMembers) {
          if (!sc.stripe_subscription_id) continue;

          if (newDiscountPercent > 0 && couponId) {
            const applyResult = await applyDiscountToSubscription(
              sc.stripe_subscription_id,
              couponId,
            );
            if (applyResult.error) {
              console.error(
                `Failed to apply discount for user ${sc.user_id}: ${applyResult.error}`,
              );
            }
          } else {
            // Discount dropped to 0, remove existing discount
            const removeResult = await removeDiscountFromSubscription(
              sc.stripe_subscription_id,
            );
            if (removeResult.error) {
              console.error(
                `Failed to remove discount for user ${sc.user_id}: ${removeResult.error}`,
              );
            }
          }

          // Create billing_ledger entry tracking the discount change
          const { error: ledgerError } = await supabaseAdmin
            .from("billing_ledger")
            .insert({
              user_id: sc.user_id,
              event_type: "squad_discount_change",
              gross_amount: 0,
              discount_amount: 0,
              net_amount: 0,
              currency: "usd",
              squad_discount: newDiscountPercent,
              squad_id: squad.id,
              stripe_customer_id: sc.stripe_customer_id,
              stripe_subscription_id: sc.stripe_subscription_id,
              stripe_coupon_id: couponId,
              status: "completed",
              created_by: "squad-discount-evaluator",
              notes: `Squad discount changed from ${previousDiscount}% to ${newDiscountPercent}% for squad "${squad.name}"`,
              processed_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
            });

          if (ledgerError) {
            console.error(
              `Failed to create ledger entry for user ${sc.user_id}: ${ledgerError.message}`,
            );
          }
        }

        discountsUpdated++;
      }

      // 2f. Update squads table with current counts and discount
      const { error: updateError } = await supabaseAdmin
        .from("squads")
        .update({
          member_count: totalMemberCount,
          active_member_count: activeSubscribedCount,
          current_discount_percent: newDiscountPercent,
          consecutive_months_all_active: newConsecutiveMonths,
        })
        .eq("id", squad.id);

      if (updateError) {
        console.error(
          `Failed to update squad ${squad.id}: ${updateError.message}`,
        );
      }

      // Increment consecutive_months for each active member
      for (const member of activeMembers) {
        const { error: memberUpdateError } = await supabaseAdmin
          .from("squad_members")
          .update({
            consecutive_months: (member.consecutive_months ?? 0) + 1,
          })
          .eq("id", member.id);

        if (memberUpdateError) {
          console.error(
            `Failed to update member ${member.id} consecutive_months: ${memberUpdateError.message}`,
          );
        }
      }
    }

    const summary = { squadsProcessed, discountsUpdated };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
