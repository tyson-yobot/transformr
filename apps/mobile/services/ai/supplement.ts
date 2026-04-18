// =============================================================================
// TRANSFORMR -- Supplement Service (Budget-Aware + Evidence)
// Wraps the ai-supplement Edge Function and provides CRUD for user_supplements.
// =============================================================================

import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';
import type {
  SupplementAdvisorResponse,
  SupplementTiming,
  SupplementCategory,
  SupplementTier,
  SupplementEvidenceLevel,
  EvidenceSource,
  UserSupplement,
  UserSupplementLog,
} from '@app-types/ai';

// ---------------------------------------------------------------------------
// AI advisor
// ---------------------------------------------------------------------------

interface GetRecommendationsArgs {
  /** Optional — sourced from auth session when omitted */
  userId?: string;
  budgetMonthly?: number;
  focus?: string;
}

export async function getSupplementRecommendations(
  args: GetRecommendationsArgs,
): Promise<SupplementAdvisorResponse> {
  const uid = args.userId ?? (await supabase.auth.getUser()).data.user?.id ?? '';
  const userContext: UserAIContext | null = await buildUserAIContext(uid).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-supplement', {
    body: {
      budget_monthly: args.budgetMonthly,
      focus: args.focus,
      userContext,
    },
  });
  if (error) throw error;
  if (!data) throw new Error('Empty response from Supplement Advisor');
  return data as SupplementAdvisorResponse;
}

// ---------------------------------------------------------------------------
// CRUD for user_supplements
// ---------------------------------------------------------------------------

export async function fetchUserSupplements(
  activeOnly = true,
): Promise<UserSupplement[]> {
  let query = supabase
    .from('user_supplements')
    .select('*')
    .order('priority', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as UserSupplement[];
}

interface CreateUserSupplementArgs {
  name: string;
  dosage?: string;
  timing?: SupplementTiming;
  frequency?: string;
  category?: SupplementCategory;
  tier?: SupplementTier;
  priority?: number;
  evidenceLevel?: SupplementEvidenceLevel;
  evidenceSources?: EvidenceSource[];
  monthlyCost?: number;
  isAiRecommended?: boolean;
  aiRecommendationReason?: string;
  notes?: string;
}

export async function createUserSupplement(
  args: CreateUserSupplementArgs,
): Promise<UserSupplement> {
  const { data, error } = await supabase
    .from('user_supplements')
    .insert({
      name: args.name,
      dosage: args.dosage ?? null,
      timing: args.timing ?? 'morning',
      frequency: args.frequency ?? 'daily',
      category: args.category ?? 'other',
      tier: args.tier ?? 'recommended',
      priority: args.priority ?? 50,
      evidence_level: args.evidenceLevel ?? 'moderate',
      evidence_sources: args.evidenceSources ?? [],
      monthly_cost: args.monthlyCost ?? 0,
      is_ai_recommended: args.isAiRecommended ?? false,
      ai_recommendation_reason: args.aiRecommendationReason ?? null,
      notes: args.notes ?? null,
    })
    .select('*')
    .single();

  if (error || !data) throw error ?? new Error('Failed to create supplement');
  return data as UserSupplement;
}

export async function updateUserSupplement(
  id: string,
  updates: Partial<{
    name: string;
    dosage: string | null;
    timing: SupplementTiming;
    frequency: string;
    category: SupplementCategory;
    tier: SupplementTier;
    priority: number;
    evidence_level: SupplementEvidenceLevel;
    evidence_sources: EvidenceSource[];
    monthly_cost: number;
    is_active: boolean;
    notes: string | null;
  }>,
): Promise<UserSupplement> {
  const { data, error } = await supabase
    .from('user_supplements')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) throw error ?? new Error('Failed to update supplement');
  return data as UserSupplement;
}

export async function deleteUserSupplement(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_supplements')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Logging (mark supplement as taken)
// ---------------------------------------------------------------------------

export async function logSupplementTaken(
  supplementId: string,
): Promise<UserSupplementLog> {
  const { data, error } = await supabase
    .from('user_supplement_logs')
    .insert({ supplement_id: supplementId })
    .select('*')
    .single();

  if (error || !data) throw error ?? new Error('Failed to log supplement');
  return data as UserSupplementLog;
}

export async function fetchTodayLogs(): Promise<UserSupplementLog[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('user_supplement_logs')
    .select('*')
    .gte('taken_at', todayStart.toISOString())
    .order('taken_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserSupplementLog[];
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export async function updateSupplementBudget(
  budget: number,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ supplement_budget_monthly: budget })
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '');

  if (error) throw error;
}

export async function getSupplementBudget(): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('supplement_budget_monthly')
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .maybeSingle();

  if (error) throw error;
  return (data?.supplement_budget_monthly as number) ?? 0;
}
