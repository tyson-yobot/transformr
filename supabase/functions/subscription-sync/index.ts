// NOTE: No AI API calls — compliance preamble not required
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS');
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

// Filter out empty-string keys that would appear if env vars are missing,
// preventing privilege escalation when priceId is '' or undefined.
const PRICE_TO_TIER: Record<string, string> = Object.fromEntries(
  ([
    [Deno.env.get('STRIPE_PRICE_PRO_MONTHLY'), 'pro'],
    [Deno.env.get('STRIPE_PRICE_PRO_ANNUAL'), 'pro'],
    [Deno.env.get('STRIPE_PRICE_ELITE_MONTHLY'), 'elite'],
    [Deno.env.get('STRIPE_PRICE_ELITE_ANNUAL'), 'elite'],
    [Deno.env.get('STRIPE_PRICE_PARTNERS_MONTHLY'), 'partners'],
    [Deno.env.get('STRIPE_PRICE_PARTNERS_ANNUAL'), 'partners'],
  ] as [string | undefined, string][]).filter(([key]) => Boolean(key)),
);

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts = signature.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const sigPart = parts.find((p) => p.startsWith('v1='));
    if (!timestampPart || !sigPart) return false;
    const timestamp = timestampPart.split('=')[1];
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`${timestamp}.${payload}`),
    );
    const computedBytes = new Uint8Array(signatureBuffer);
    const expectedHex = sigPart.split('=')[1];
    // Decode expected hex string to bytes for constant-time comparison
    const expectedBytes = new Uint8Array(expectedHex.length / 2);
    for (let i = 0; i < expectedBytes.length; i++) {
      expectedBytes[i] = parseInt(expectedHex.slice(i * 2, i * 2 + 2), 16);
    }
    if (computedBytes.length !== expectedBytes.length) return false;
    // Constant-time byte comparison — prevents timing oracle attacks
    let diff = 0;
    for (let i = 0; i < computedBytes.length; i++) {
      diff |= computedBytes[i] ^ expectedBytes[i];
    }
    return diff === 0;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !STRIPE_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Missing signature or secret' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const event = JSON.parse(body);
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // A new checkout was completed — Stripe will also fire customer.subscription.created,
        // but we handle it here as well for immediate tier activation.
        const session = event.data.object;
        const subscriptionId: string | null = session.subscription ?? null;
        if (!subscriptionId) break;

        // Fetch the subscription object to get the price/tier
        const stripeRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` },
        });
        const sub = await stripeRes.json();
        const priceId: string = sub.items?.data?.[0]?.price?.id ?? '';
        const tier = PRICE_TO_TIER[priceId] ?? 'free';

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer)
          .maybeSingle();

        if (!profile) break;

        await supabaseAdmin.from('subscriptions').upsert(
          {
            user_id: profile.id,
            tier,
            status: sub.status,
            billing_interval: sub.items?.data?.[0]?.price?.recurring?.interval === 'year'
              ? 'annual'
              : 'monthly',
            stripe_customer_id: sub.customer,
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_subscription_id' },
        );

        await supabaseAdmin.from('user_feature_gates').upsert(
          {
            user_id: profile.id,
            tier,
            gates: {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
        break;
      }

      case 'invoice.paid': {
        // Subscription renewal — update the current period dates.
        const invoice = event.data.object;
        const subscriptionId: string | null = invoice.subscription ?? null;
        if (!subscriptionId) break;

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: invoice.period_start
              ? new Date(invoice.period_start * 1000).toISOString()
              : undefined,
            current_period_end: invoice.period_end
              ? new Date(invoice.period_end * 1000).toISOString()
              : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const priceId: string = sub.items?.data?.[0]?.price?.id ?? '';
        const tier = PRICE_TO_TIER[priceId] ?? 'free';

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer)
          .maybeSingle();

        if (!profile) {
          console.warn(`[subscription-sync] No profile found for customer ${sub.customer}`);
          break;
        }

        await supabaseAdmin.from('subscriptions').upsert(
          {
            user_id: profile.id,
            tier,
            status: sub.status,
            billing_interval: sub.items?.data?.[0]?.price?.recurring?.interval === 'year'
              ? 'annual'
              : 'monthly',
            stripe_customer_id: sub.customer,
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            trial_end: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_subscription_id' },
        );

        await supabaseAdmin.from('user_feature_gates').upsert(
          {
            user_id: profile.id,
            tier,
            gates: {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[subscription-sync] Error processing ${event.type}:`, message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
