// =============================================================================
// stripeBillingService.ts — Client-side billing service for Stripe operations
// Calls Supabase Edge Functions for all Stripe-related billing actions.
// =============================================================================

import { supabase } from './supabase';

// =============================================================================
// Types
// =============================================================================

export interface ActiveDiscount {
  type: 'squad_discount' | 'free_months' | 'lifetime_pro' | 'gift';
  percent: number;
  source: string;
  expiresAt: string | null;
  description: string;
}

export interface BillingLedgerEntry {
  id: string;
  eventType: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
  stripeInvoiceId: string | null;
  qbSynced: boolean;
}

// =============================================================================
// Internal helpers
// =============================================================================

interface EdgeFunctionResponse<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}

async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response: EdgeFunctionResponse<T> = await supabase.functions.invoke(
    functionName,
    { body },
  );

  if (response.error) {
    throw new Error(
      `Edge Function "${functionName}" failed: ${response.error.message}`,
    );
  }

  return response.data as T;
}

// =============================================================================
// Reward & Discount Functions
// =============================================================================

/**
 * Applies free months of a subscription tier as a reward.
 * Calls the apply-reward Edge Function with type 'free_months'.
 */
export async function applyFreeMonths(
  userId: string,
  months: number,
  tier: string,
  rewardId: string,
): Promise<void> {
  await invokeEdgeFunction('apply-reward', {
    userId,
    type: 'free_months',
    months,
    tier,
    rewardId,
  });
}

/**
 * Applies a squad-based percentage discount to a user's subscription.
 * Calls the apply-reward Edge Function with type 'squad_discount'.
 */
export async function applySquadDiscount(
  userId: string,
  percent: number,
  squadId: string,
): Promise<void> {
  await invokeEdgeFunction('apply-reward', {
    userId,
    type: 'squad_discount',
    percent,
    squadId,
  });
}

/**
 * Removes a squad discount from a user's subscription.
 * Calls the apply-reward Edge Function with action 'remove_discount'.
 */
export async function removeSquadDiscount(
  userId: string,
  squadId: string,
): Promise<void> {
  await invokeEdgeFunction('apply-reward', {
    userId,
    action: 'remove_discount',
    squadId,
  });
}

/**
 * Adjusts a squad discount by removing the old one and applying a new percentage.
 * Performs removal then application sequentially.
 */
export async function adjustSquadDiscount(
  userId: string,
  newPercent: number,
  squadId: string,
): Promise<void> {
  await removeSquadDiscount(userId, squadId);
  await applySquadDiscount(userId, newPercent, squadId);
}

/**
 * Grants lifetime pro access to a user as a reward.
 * Calls the apply-reward Edge Function with type 'lifetime_pro'.
 */
export async function applyLifetimePro(
  userId: string,
  rewardId: string,
): Promise<void> {
  await invokeEdgeFunction('apply-reward', {
    userId,
    type: 'lifetime_pro',
    rewardId,
  });
}

/**
 * Redeems a gift by applying free months sourced from a gift entry.
 * Calls the apply-reward Edge Function with type 'gift'.
 */
export async function redeemGift(
  userId: string,
  giftId: string,
  tier: string,
  months: number,
): Promise<void> {
  await invokeEdgeFunction('apply-reward', {
    userId,
    type: 'gift',
    giftId,
    tier,
    months,
  });
}

// =============================================================================
// Creator Payout
// =============================================================================

/**
 * Processes a creator payout through Stripe Connect.
 * Calls the creator-payout Edge Function.
 */
export async function processCreatorPayout(
  creatorId: string,
  amount: number,
  payoutId: string,
): Promise<void> {
  await invokeEdgeFunction('creator-payout', {
    creatorId,
    amount,
    payoutId,
  });
}

// =============================================================================
// Query Functions
// =============================================================================

interface RawActiveDiscount {
  type: ActiveDiscount['type'];
  percent: number;
  source: string;
  expires_at: string | null;
  description: string;
}

/**
 * Retrieves active discounts for a user from the stripe_customers table.
 * Returns human-readable discount information.
 */
export async function getActiveDiscounts(
  userId: string,
): Promise<ActiveDiscount[]> {
  const { data, error } = await supabase
    .from('stripe_customers')
    .select('active_coupons')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch active discounts: ${error.message}`);
  }

  const coupons = (data?.active_coupons ?? []) as RawActiveDiscount[];

  return coupons.map((coupon: RawActiveDiscount): ActiveDiscount => ({
    type: coupon.type,
    percent: coupon.percent,
    source: coupon.source,
    expiresAt: coupon.expires_at,
    description: coupon.description,
  }));
}

interface RawBillingLedgerRow {
  id: string;
  event_type: string;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  status: string;
  created_at: string;
  stripe_invoice_id: string | null;
  qb_synced: boolean;
}

/**
 * Retrieves billing history for a user from the billing_ledger table.
 * Returns formatted ledger entries sorted by creation date descending.
 */
export async function getBillingHistory(
  userId: string,
): Promise<BillingLedgerEntry[]> {
  const { data, error } = await supabase
    .from('billing_ledger')
    .select(
      'id, event_type, gross_amount, discount_amount, net_amount, status, created_at, stripe_invoice_id, qb_synced',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch billing history: ${error.message}`);
  }

  return (data ?? []).map((row: RawBillingLedgerRow): BillingLedgerEntry => ({
    id: row.id,
    eventType: row.event_type,
    grossAmount: row.gross_amount,
    discountAmount: row.discount_amount,
    netAmount: row.net_amount,
    status: row.status,
    createdAt: row.created_at,
    stripeInvoiceId: row.stripe_invoice_id,
    qbSynced: row.qb_synced,
  }));
}
