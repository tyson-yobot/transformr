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
  stakeId: string,
  paymentMethodId: string,
): Promise<StakePaymentResult> {
  // Creates a HOLD (capture_method: manual) — funds are reserved, not charged.
  // The hold is captured (charged) only if the goal is missed.
  const { data, error } = await supabase.functions.invoke('stripe-webhook', {
    body: {
      action: 'create_stake_payment',
      userId,
      amount,
      stakeId,
      paymentMethodId,
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

// Goal FAILED — capture the hold (charge the user)
export async function captureStake(
  paymentIntentId: string,
): Promise<boolean> {
  const { error } = await supabase.functions.invoke('stripe-webhook', {
    body: {
      action: 'capture_stake',
      paymentIntentId,
    },
  });

  return !error;
}

// Goal PASSED — cancel the hold (user keeps their money)
export async function cancelStakeHold(
  paymentIntentId: string,
): Promise<boolean> {
  const { error } = await supabase.functions.invoke('stripe-webhook', {
    body: {
      action: 'cancel_stake_hold',
      paymentIntentId,
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
