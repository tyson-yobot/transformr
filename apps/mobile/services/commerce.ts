// =============================================================================
// TRANSFORMR — Commerce Service
//
// Wraps the stripe-webhook Edge Function for program purchases.
// Programs are one-time purchases stored in the `programs` table.
// Access is tracked in `program_purchases`.
// =============================================================================

import { supabase } from './supabase';

export interface Program {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  stripe_price_id: string;
  duration_weeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  preview_image_url: string | null;
}

export interface PurchaseResult {
  success: boolean;
  purchaseId: string | null;
  error: string | null;
}

export async function getAvailablePrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('is_published', true)
    .order('price_cents', { ascending: true });

  if (error) return [];
  return (data ?? []) as Program[];
}

export async function getUserPurchases(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('program_purchases')
    .select('program_id')
    .eq('user_id', userId)
    .eq('status', 'completed');

  return (data ?? []).map((r: { program_id: string }) => r.program_id as string);
}

export async function checkProgramAccess(userId: string, programId: string): Promise<boolean> {
  const { data } = await supabase
    .from('program_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .eq('status', 'completed')
    .maybeSingle();

  return data !== null;
}

export async function purchaseProgram(
  userId: string,
  programId: string,
  stripePriceId: string,
  paymentMethodId: string,
): Promise<PurchaseResult> {
  const { data, error } = await supabase.functions.invoke('stripe-webhook', {
    body: {
      action: 'purchase_program',
      userId,
      programId,
      stripePriceId,
      paymentMethodId,
    },
  });

  if (error) {
    return { success: false, purchaseId: null, error: error.message };
  }

  const result = data as { purchase_id?: string; error?: string } | null;
  if (result?.error) {
    return { success: false, purchaseId: null, error: result.error };
  }

  return { success: true, purchaseId: result?.purchase_id ?? null, error: null };
}
