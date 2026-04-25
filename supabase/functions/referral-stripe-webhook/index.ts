// NOTE: No AI API calls — compliance preamble not required
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const sigPart = parts.find((p) => p.startsWith("v1="));

    if (!timestampPart || !sigPart) return false;

    const timestamp = timestampPart.split("=")[1];
    const expectedSig = sigPart.split("=")[1];

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );
    const computedSig = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSig === expectedSig;
  } catch {
    return false;
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

    const body = await req.text();
    const stripeSignature = req.headers.get("stripe-signature");

    if (!stripeSignature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isValid = await verifyStripeSignature(body, stripeSignature, STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const event = JSON.parse(body);
    const eventType = event.type;
    const eventData = event.data.object;

    // --- invoice.payment_succeeded ---
    if (eventType === "invoice.payment_succeeded") {
      const stripeCustomerId = eventData.customer;
      const amountPaid = eventData.amount_paid;
      const invoiceId = eventData.id;

      // Find user by stripe customer ID
      const { data: stripeCustomer } = await supabaseAdmin
        .from("stripe_customers")
        .select("user_id, referrer_id, free_months_remaining")
        .eq("stripe_customer_id", stripeCustomerId)
        .maybeSingle();

      if (!stripeCustomer) {
        return new Response(JSON.stringify({ received: true, skipped: "unknown_customer" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update billing_ledger to completed
      await supabaseAdmin
        .from("billing_ledger")
        .update({ status: "completed", stripe_invoice_id: invoiceId })
        .eq("user_id", stripeCustomer.user_id)
        .eq("status", "processing")
        .order("created_at", { ascending: false })
        .limit(1);

      // If user has a referrer, calculate revenue share
      if (stripeCustomer.referrer_id && amountPaid > 0) {
        // Look up creator's revenue share percent
        const { data: creatorProfile } = await supabaseAdmin
          .from("creator_profiles")
          .select("revenue_share_percent")
          .eq("user_id", stripeCustomer.referrer_id)
          .maybeSingle();

        const revenueSharePercent = creatorProfile?.revenue_share_percent ?? 15;
        const shareAmount = Math.round((amountPaid * revenueSharePercent) / 100);

        if (shareAmount > 0) {
          await supabaseAdmin.from("billing_ledger").insert({
            user_id: stripeCustomer.referrer_id,
            entry_type: "revenue_share",
            amount: shareAmount,
            status: "pending",
            description: `Revenue share from referral (${revenueSharePercent}%)`,
            related_user_id: stripeCustomer.user_id,
          });
        }
      }

      // Decrement free_months_remaining if applicable
      if (stripeCustomer.free_months_remaining && stripeCustomer.free_months_remaining > 0) {
        await supabaseAdmin
          .from("stripe_customers")
          .update({
            free_months_remaining: stripeCustomer.free_months_remaining - 1,
          })
          .eq("user_id", stripeCustomer.user_id);
      }

      return new Response(JSON.stringify({ received: true, event: "payment_succeeded" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- invoice.payment_failed ---
    if (eventType === "invoice.payment_failed") {
      const stripeCustomerId = eventData.customer;
      const invoiceId = eventData.id;

      const { data: stripeCustomer } = await supabaseAdmin
        .from("stripe_customers")
        .select("user_id")
        .eq("stripe_customer_id", stripeCustomerId)
        .maybeSingle();

      if (stripeCustomer) {
        // Update billing_ledger to failed
        await supabaseAdmin
          .from("billing_ledger")
          .update({ status: "failed", stripe_invoice_id: invoiceId })
          .eq("user_id", stripeCustomer.user_id)
          .eq("status", "processing")
          .order("created_at", { ascending: false })
          .limit(1);

        // Create audit log warning
        await supabaseAdmin.from("billing_audit_log").insert({
          check_name: "payment_failed",
          severity: "warning",
          details: {
            user_id: stripeCustomer.user_id,
            stripe_customer_id: stripeCustomerId,
            invoice_id: invoiceId,
            failure_message: eventData.last_finalization_error?.message ?? "Unknown",
          },
          auto_corrected: false,
        });
      }

      return new Response(JSON.stringify({ received: true, event: "payment_failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- customer.subscription.updated ---
    if (eventType === "customer.subscription.updated") {
      const stripeCustomerId = eventData.customer;
      const subscriptionId = eventData.id;
      const subscriptionStatus = eventData.status;
      const discount = eventData.discount;

      const { data: stripeCustomer } = await supabaseAdmin
        .from("stripe_customers")
        .select("user_id")
        .eq("stripe_customer_id", stripeCustomerId)
        .maybeSingle();

      if (stripeCustomer) {
        const updateFields: Record<string, unknown> = {
          subscription_id: subscriptionId,
          subscription_status: subscriptionStatus,
        };

        if (discount?.coupon) {
          updateFields.stripe_discount_percent = discount.coupon.percent_off ?? null;
          updateFields.stripe_coupon_id = discount.coupon.id;
        }

        await supabaseAdmin
          .from("stripe_customers")
          .update(updateFields)
          .eq("user_id", stripeCustomer.user_id);

        // Verify coupon matches billing_ledger
        if (discount?.coupon?.percent_off) {
          const { data: latestLedger } = await supabaseAdmin
            .from("billing_ledger")
            .select("discount_percent")
            .eq("user_id", stripeCustomer.user_id)
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestLedger && latestLedger.discount_percent !== discount.coupon.percent_off) {
            await supabaseAdmin.from("billing_audit_log").insert({
              check_name: "coupon_ledger_mismatch_on_update",
              severity: "warning",
              details: {
                user_id: stripeCustomer.user_id,
                stripe_coupon_percent: discount.coupon.percent_off,
                ledger_discount_percent: latestLedger.discount_percent,
              },
              auto_corrected: false,
            });
          }
        }
      }

      return new Response(JSON.stringify({ received: true, event: "subscription_updated" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- customer.subscription.deleted ---
    if (eventType === "customer.subscription.deleted") {
      const stripeCustomerId = eventData.customer;

      const { data: stripeCustomer } = await supabaseAdmin
        .from("stripe_customers")
        .select("user_id")
        .eq("stripe_customer_id", stripeCustomerId)
        .maybeSingle();

      if (stripeCustomer) {
        // Update stripe_customers
        await supabaseAdmin
          .from("stripe_customers")
          .update({
            subscription_status: "canceled",
            subscription_id: null,
          })
          .eq("user_id", stripeCustomer.user_id);

        // Set related referrals to inactive
        await supabaseAdmin
          .from("referrals")
          .update({ status: "inactive" })
          .eq("referred_user_id", stripeCustomer.user_id)
          .eq("status", "active");

        // Create billing_ledger entry for cancellation
        await supabaseAdmin.from("billing_ledger").insert({
          user_id: stripeCustomer.user_id,
          entry_type: "cancellation",
          amount: 0,
          status: "completed",
          description: "Subscription canceled",
          stripe_invoice_id: eventData.latest_invoice ?? null,
        });
      }

      return new Response(JSON.stringify({ received: true, event: "subscription_deleted" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Unhandled event type
    return new Response(JSON.stringify({ received: true, skipped: eventType }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
