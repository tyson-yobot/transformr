// =============================================================================
// TRANSFORMR — QuickBooks Sync Service
//
// Client-side service for checking QB sync status and triggering retries.
// Actual synchronization logic lives in the qb-sync Edge Function.
// This service queries billing_ledger for sync status and financial reports.
// =============================================================================

import { supabase } from './supabase';

// =============================================================================
// Types
// =============================================================================

export interface SyncStatusReport {
  synced: number;
  pending: number;
  failed: number;
  total: number;
  oldestUnsynced: string | null;
}

export interface RevenueReport {
  grossRevenue: number;
  totalDiscounts: number;
  referralDiscount: number;
  squadDiscount: number;
  giftDiscount: number;
  promoDiscount: number;
  netRevenue: number;
  revenueSharePaid: number;
  entryCount: number;
  period: string;
}

type ReportPeriod = 'month' | 'quarter' | 'year';

// =============================================================================
// Sync Status
// =============================================================================

/**
 * Queries billing_ledger for QB sync status within a date range.
 * Returns counts of synced, pending, and failed entries plus the
 * oldest unsynced entry timestamp.
 */
export async function getSyncStatus(
  startDate: string,
  endDate: string,
): Promise<SyncStatusReport> {
  const { data, error } = await supabase
    .from('billing_ledger')
    .select('id, qb_synced, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) {
    throw new Error(`Failed to fetch sync status: ${error.message}`);
  }

  const entries = data ?? [];

  let synced = 0;
  let pending = 0;
  let failed = 0;
  let oldestUnsynced: string | null = null;

  for (const entry of entries) {
    const status = entry.qb_synced as string | null;

    if (status === 'synced') {
      synced += 1;
    } else if (status === 'failed') {
      failed += 1;
      if (oldestUnsynced === null || entry.created_at < oldestUnsynced) {
        oldestUnsynced = entry.created_at as string;
      }
    } else {
      pending += 1;
      if (oldestUnsynced === null || entry.created_at < oldestUnsynced) {
        oldestUnsynced = entry.created_at as string;
      }
    }
  }

  return {
    synced,
    pending,
    failed,
    total: entries.length,
    oldestUnsynced,
  };
}

// =============================================================================
// Revenue Report
// =============================================================================

/**
 * Builds a financial summary from billing_ledger for the given period.
 * Periods: 'month' (current calendar month), 'quarter' (current quarter),
 * 'year' (current calendar year).
 */
export async function getRevenueReport(
  period: ReportPeriod,
): Promise<RevenueReport> {
  const now = new Date();
  let startDate: string;

  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else if (period === 'quarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    startDate = new Date(now.getFullYear(), quarterStartMonth, 1).toISOString();
  } else {
    startDate = new Date(now.getFullYear(), 0, 1).toISOString();
  }

  const endDate = now.toISOString();

  const { data, error } = await supabase
    .from('billing_ledger')
    .select(
      'amount, referral_discount, squad_discount, gift_discount, promo_discount, revenue_share, net_amount',
    )
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) {
    throw new Error(`Failed to fetch revenue report: ${error.message}`);
  }

  const entries = data ?? [];

  let grossRevenue = 0;
  let referralDiscount = 0;
  let squadDiscount = 0;
  let giftDiscount = 0;
  let promoDiscount = 0;
  let netRevenue = 0;
  let revenueSharePaid = 0;

  for (const entry of entries) {
    grossRevenue += (entry.amount as number) ?? 0;
    referralDiscount += (entry.referral_discount as number) ?? 0;
    squadDiscount += (entry.squad_discount as number) ?? 0;
    giftDiscount += (entry.gift_discount as number) ?? 0;
    promoDiscount += (entry.promo_discount as number) ?? 0;
    netRevenue += (entry.net_amount as number) ?? 0;
    revenueSharePaid += (entry.revenue_share as number) ?? 0;
  }

  const totalDiscounts =
    referralDiscount + squadDiscount + giftDiscount + promoDiscount;

  return {
    grossRevenue,
    totalDiscounts,
    referralDiscount,
    squadDiscount,
    giftDiscount,
    promoDiscount,
    netRevenue,
    revenueSharePaid,
    entryCount: entries.length,
    period,
  };
}

// =============================================================================
// Retry Sync
// =============================================================================

/**
 * Triggers a re-sync for a specific billing_ledger entry by invoking
 * the qb-sync Edge Function with the entry ID.
 */
export async function retrySyncEntry(ledgerEntryId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('qb-sync', {
    body: { ledgerEntryId },
  });

  if (error) {
    throw new Error(`Failed to retry sync for entry ${ledgerEntryId}: ${error.message}`);
  }
}
