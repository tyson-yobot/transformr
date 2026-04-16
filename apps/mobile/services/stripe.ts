import { supabase } from './supabase';
import type { SubscriptionTier } from '../stores/subscriptionStore';

interface StakePaymentResult {
  success: boolean;
  paymentIntentId: string | null;
  error: string | null;
}

export async function createStakePayment(
  userId: string,
  amount: number,
  goalId: string,
  description: string,
): Promise<StakePaymentResult> {
  // Create payment intent via Edge Function
  const { data, error } = await supabase.functions.invoke('stripe-webhook', {
    body: {
      action: 'create_stake_payment',
      userId,
      amount: Math.round(amount * 100), // Convert to cents
      goalId,
      description,
    },
  });

  if (error) {
    return { success: false, paymentIntentId: null, error: error.message };
  }

  return {
    success: true,
    paymentIntentId: (data as { paymentIntentId: string }).paymentIntentId,
    error: null,
  };
}

export async function chargeStake(
  paymentIntentId: string,
  amount: number,
  reason: string,
): Promise<boolean> {
  const { error } = await supabase.functions.invoke('stripe-webhook', {
    body: {
      action: 'charge_stake',
      paymentIntentId,
      amount: Math.round(amount * 100),
      reason,
    },
  });

  return !error;
}

export async function refundStake(
  paymentIntentId: string,
  amount: number,
): Promise<boolean> {
  const { error } = await supabase.functions.invoke('stripe-webhook', {
    body: {
      action: 'refund_stake',
      paymentIntentId,
      amount: Math.round(amount * 100),
    },
  });

  return !error;
}

export async function setupStripeCustomer(userId: string, email: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('stripe-webhook', {
    body: {
      action: 'create_customer',
      userId,
      email,
    },
  });

  if (error) return null;
  return (data as { customerId: string }).customerId;
}

// ---------------------------------------------------------------------------
// Subscription management
// ---------------------------------------------------------------------------

interface CreateSubscriptionResult {
  clientSecret: string | null;
  error: string | null;
}

export async function createSubscription(
  tier: 'pro' | 'elite' | 'partners',
  interval: 'monthly' | 'annual',
): Promise<CreateSubscriptionResult> {
  const { data, error } = await supabase.functions.invoke('stripe-create-subscription', {
    body: { tier, interval },
  });

  if (error) {
    return { clientSecret: null, error: error.message };
  }

  const clientSecret = (data as { clientSecret?: string }).clientSecret ?? null;
  return { clientSecret, error: null };
}

interface CancelSubscriptionResult {
  error: string | null;
}

export async function cancelSubscription(): Promise<CancelSubscriptionResult> {
  const { error } = await supabase.functions.invoke('stripe-cancel-subscription', {
    body: {},
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

interface RestorePurchaseResult {
  tier: SubscriptionTier | null;
  error: string | null;
}

export async function restorePurchase(): Promise<RestorePurchaseResult> {
  const { data, error } = await supabase.functions.invoke('stripe-restore-purchase', {
    body: {},
  });

  if (error) {
    return { tier: null, error: error.message };
  }

  const restoredTier = (data as { tier?: SubscriptionTier }).tier ?? null;

  if (restoredTier) {
    // Refresh the subscription store state without importing the hook
    const { useSubscriptionStore } = await import('../stores/subscriptionStore');
    await useSubscriptionStore.getState().refreshSubscription();
  }

  return { tier: restoredTier, error: null };
}
