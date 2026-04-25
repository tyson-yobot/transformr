import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplyFreeMonths {
  action: "apply";
  userId: string;
  rewardId: string;
  type: "free_months";
  months: number;
  tier: string;
}

interface ApplySquadDiscount {
  action: "apply";
  userId: string;
  rewardId: string;
  type: "squad_discount";
  percent: number;
  squadId: string;
}

interface ApplyLifetimePro {
  action: "apply";
  userId: string;
  rewardId: string;
  type: "lifetime_pro";
}

interface ApplyGiftRedeem {
  action: "apply";
  userId: string;
  giftId: string;
  type: "gift_redeem";
  months: number;
  tier: string;
}

interface RemoveDiscount {
  action: "remove_discount";
  userId: string;
  squadId: string;
}

type RequestBody =
  | ApplyFreeMonths
  | ApplySquadDiscount
  | ApplyLifetimePro
  | ApplyGiftRedeem
  | RemoveDiscount;

async function stripeRequest(
  path: string,
  method: string,
  body?: Record<string, string>
): Promise<Record<string, unknown>> {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  if (body) {
    options.body = new URLSearchParams(body).toString();
  }

  const res = await fetch(`https://api.stripe.com/v1${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Stripe API error: ${data.error?.message ?? JSON.stringify(data)}`
    );
  }

  return data;
}

async function getStripeCustomerId(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ customerId: string; subscriptionId: string }> {
  const { data, error } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error(`No Stripe customer found for user ${userId}`);
  }

  return {
    customerId: data.stripe_customer_id,
    subscriptionId: data.stripe_subscription_id,
  };
}

async function createAndApplyCoupon(
  subscriptionId: string,
  couponParams: Record<string, string>
): Promise<string> {
  const coupon = await stripeRequest("/coupons", "POST", couponParams);
  const couponId = coupon.id as string;

  await stripeRequest(`/subscriptions/${subscriptionId}`, "POST", {
    coupon: couponId,
  });

  return couponId;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: RequestBody = await req.json();

    if (body.action === "remove_discount") {
      return await handleRemoveDiscount(supabase, body);
    }

    if (body.action === "apply") {
      return await handleApply(supabase, body);
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleApply(
  supabase: ReturnType<typeof createClient>,
  body: ApplyFreeMonths | ApplySquadDiscount | ApplyLifetimePro | ApplyGiftRedeem
): Promise<Response> {
  // Validate reward exists and is earned (gift_redeem uses giftId instead of rewardId)
  if (body.type !== "gift_redeem") {
    const { data: reward, error: rewardError } = await supabase
      .from("referral_rewards")
      .select("id, status")
      .eq("id", body.rewardId)
      .eq("status", "earned")
      .single();

    if (rewardError || !reward) {
      return new Response(
        JSON.stringify({ error: "Reward not found or not in earned status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  const { customerId, subscriptionId } = await getStripeCustomerId(
    supabase,
    body.userId
  );

  let couponId: string;
  let discountPercent: number | null = null;
  let freeMonths: number | null = null;

  switch (body.type) {
    case "free_months": {
      couponId = await createAndApplyCoupon(subscriptionId, {
        percent_off: "100",
        duration: "repeating",
        duration_in_months: String(body.months),
        metadata_user_id: body.userId,
        metadata_reward_id: body.rewardId,
      });
      freeMonths = body.months;
      break;
    }

    case "squad_discount": {
      couponId = await createAndApplyCoupon(subscriptionId, {
        percent_off: String(body.percent),
        duration: "forever",
        metadata_user_id: body.userId,
        metadata_squad_id: body.squadId,
      });
      discountPercent = body.percent;
      break;
    }

    case "lifetime_pro": {
      couponId = await createAndApplyCoupon(subscriptionId, {
        percent_off: "100",
        duration: "forever",
        metadata_user_id: body.userId,
        metadata_reward_id: body.rewardId,
      });
      discountPercent = 100;
      break;
    }

    case "gift_redeem": {
      couponId = await createAndApplyCoupon(subscriptionId, {
        percent_off: "100",
        duration: "repeating",
        duration_in_months: String(body.months),
        metadata_user_id: body.userId,
        metadata_gift_id: body.giftId,
      });
      freeMonths = body.months;
      break;
    }

    default:
      return new Response(
        JSON.stringify({ error: "Invalid reward type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
  }

  // Update billing_ledger status to processing
  await supabase
    .from("billing_ledger")
    .update({ status: "processing" })
    .eq("user_id", body.userId);

  // Update referral_rewards status to applied (skip for gift_redeem)
  if (body.type !== "gift_redeem") {
    await supabase
      .from("referral_rewards")
      .update({
        status: "applied",
        applied_at: new Date().toISOString(),
      })
      .eq("id", (body as ApplyFreeMonths | ApplySquadDiscount | ApplyLifetimePro).rewardId);
  }

  // Update stripe_customers with coupon info
  const customerUpdate: Record<string, unknown> = {
    active_coupon_id: couponId,
  };

  if (discountPercent !== null) {
    customerUpdate.active_discount_percent = discountPercent;
  }

  if (freeMonths !== null) {
    customerUpdate.free_months_remaining = freeMonths;
  }

  await supabase
    .from("stripe_customers")
    .update(customerUpdate)
    .eq("user_id", body.userId);

  return new Response(
    JSON.stringify({ success: true, couponId }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleRemoveDiscount(
  supabase: ReturnType<typeof createClient>,
  body: RemoveDiscount
): Promise<Response> {
  const { customerId, subscriptionId } = await getStripeCustomerId(
    supabase,
    body.userId
  );

  // Remove the discount from the subscription
  await stripeRequest(
    `/subscriptions/${subscriptionId}`,
    "POST",
    { coupon: "" }
  );

  // Clear coupon info from stripe_customers
  await supabase
    .from("stripe_customers")
    .update({
      active_coupon_id: null,
      active_discount_percent: null,
    })
    .eq("user_id", body.userId);

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
