// NOTE: No AI API calls — compliance preamble not required
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

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

  // Handle non-webhook requests (e.g., creating payment intents)
  if (req.method === "POST" && !req.headers.get("stripe-signature")) {
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

      const { action, amount, stake_id, customer_id, payment_method_id } =
        await req.json();

      if (action === "create_setup_intent") {
        // Create a SetupIntent for saving payment methods
        const response = await fetch(
          "https://api.stripe.com/v1/setup_intents",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              customer: customer_id,
              "payment_method_types[]": "card",
              "metadata[user_id]": user.id,
            }).toString(),
          }
        );
        const data = await response.json();

        return new Response(
          JSON.stringify({
            client_secret: data.client_secret,
            setup_intent_id: data.id,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (action === "create_payment_intent") {
        // Create a PaymentIntent for immediate charge
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
              customer: customer_id,
              payment_method: payment_method_id,
              confirm: "true",
              off_session: "true",
              "metadata[user_id]": user.id,
              "metadata[stake_id]": stake_id || "",
              description: `TRANSFORMR stake: ${stake_id || "manual charge"}`,
            }).toString(),
          }
        );
        const data = await response.json();

        if (data.error) {
          return new Response(
            JSON.stringify({ error: data.error.message }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({
            payment_intent_id: data.id,
            status: data.status,
            client_secret: data.client_secret,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (action === "create_customer") {
        const response = await fetch("https://api.stripe.com/v1/customers", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            email: user.email || "",
            "metadata[user_id]": user.id,
          }).toString(),
        });
        const data = await response.json();

        // Store customer ID in profile
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabaseAdmin
          .from("profiles")
          .update({ stripe_customer_id: data.id })
          .eq("id", user.id);

        return new Response(
          JSON.stringify({ customer_id: data.id }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (action === "refund") {
        const { payment_intent_id, reason } = await req.json();
        const params: Record<string, string> = {
          payment_intent: payment_intent_id,
        };
        if (reason) params.reason = reason;

        const response = await fetch("https://api.stripe.com/v1/refunds", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(params).toString(),
        });
        const data = await response.json();

        if (data.error) {
          return new Response(
            JSON.stringify({ error: data.error.message }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({ refund_id: data.id, status: data.status }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Unknown action" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Handle Stripe webhook events
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: "Missing signature or webhook secret" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isValid = await verifyStripeSignature(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const userId = pi.metadata?.user_id;
        const stakeId = pi.metadata?.stake_id;

        if (userId) {
          await supabaseAdmin.from("payment_events").insert({
            user_id: userId,
            stripe_event_id: event.id,
            event_type: "payment_intent.succeeded",
            payment_intent_id: pi.id,
            amount: pi.amount / 100,
            currency: pi.currency,
            stake_id: stakeId || null,
            data: pi,
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const userId = pi.metadata?.user_id;
        const stakeId = pi.metadata?.stake_id;

        if (userId) {
          await supabaseAdmin.from("payment_events").insert({
            user_id: userId,
            stripe_event_id: event.id,
            event_type: "payment_intent.payment_failed",
            payment_intent_id: pi.id,
            amount: pi.amount / 100,
            currency: pi.currency,
            stake_id: stakeId || null,
            data: pi,
          });

          // Notify user of failed payment
          await supabaseAdmin.from("notifications").insert({
            user_id: userId,
            type: "payment_failed",
            title: "Payment Failed",
            body: "Your stake payment could not be processed. Please update your payment method.",
            data: { payment_intent_id: pi.id },
            scheduled_for: new Date().toISOString(),
          });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const userId = charge.metadata?.user_id;

        if (userId) {
          await supabaseAdmin.from("payment_events").insert({
            user_id: userId,
            stripe_event_id: event.id,
            event_type: "charge.refunded",
            payment_intent_id: charge.payment_intent,
            amount: charge.amount_refunded / 100,
            currency: charge.currency,
            data: charge,
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          await supabaseAdmin
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              subscription_id: subscription.id,
            })
            .eq("id", userId);

          await supabaseAdmin.from("payment_events").insert({
            user_id: userId,
            stripe_event_id: event.id,
            event_type: event.type,
            data: subscription,
          });
        }
        break;
      }

      default:
        // Log unhandled events for debugging
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
