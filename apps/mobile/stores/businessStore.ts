// =============================================================================
// TRANSFORMR — Business Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type {
  Business,
  RevenueLog,
  ExpenseLog,
} from '../types/database';

/** Input data for logging revenue. */
interface RevenueInput {
  business_id: string;
  amount: number;
  type?: RevenueLog['type'];
  source?: string;
  customer_name?: string;
  description?: string;
  transaction_date: string;
}

/** Aggregated monthly metrics. */
interface MonthlyMetrics {
  month: string;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  transaction_count: number;
}

interface BusinessState {
  businesses: Business[];
  revenueData: RevenueLog[];
  expenseData: ExpenseLog[];
  isLoading: boolean;
  error: string | null;
}

interface BusinessInput {
  name: string;
  type?: Business['type'];
  monthly_revenue?: number;
  description?: string;
}

interface BusinessActions {
  fetchBusinesses: () => Promise<void>;
  createBusiness: (data: BusinessInput) => Promise<void>;
  logRevenue: (data: RevenueInput) => Promise<void>;
  getMonthlyMetrics: () => MonthlyMetrics[];
  clearError: () => void;
  reset: () => void;
}

type BusinessStore = BusinessState & BusinessActions;

export const useBusinessStore = create<BusinessStore>()((set, get) => ({
  // --- State ---
  businesses: [],
  revenueData: [],
  expenseData: [],
  isLoading: false,
  error: null,

  // --- Actions ---
  fetchBusinesses: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: bizData, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');
      if (bizError) throw bizError;

      const businessIds = (bizData ?? []).map((b: Business) => b.id);

      let revData: RevenueLog[] = [];
      let expData: ExpenseLog[] = [];

      if (businessIds.length > 0) {
        const [revResult, expResult] = await Promise.all([
          supabase
            .from('revenue_logs')
            .select('*')
            .in('business_id', businessIds)
            .order('transaction_date', { ascending: false })
            .limit(200),
          supabase
            .from('expense_logs')
            .select('*')
            .in('business_id', businessIds)
            .order('transaction_date', { ascending: false })
            .limit(200),
        ]);

        if (revResult.error) throw revResult.error;
        if (expResult.error) throw expResult.error;

        revData = (revResult.data ?? []) as RevenueLog[];
        expData = (expResult.data ?? []) as ExpenseLog[];
      }

      set({
        businesses: (bizData ?? []) as Business[],
        revenueData: revData,
        expenseData: expData,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch businesses';
      set({ error: message, isLoading: false });
    }
  },

  createBusiness: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newBiz, error } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: data.name,
          type: data.type,
          monthly_revenue: data.monthly_revenue ?? 0,
          description: data.description,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        businesses: [...state.businesses, newBiz as Business],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create business';
      set({ error: message, isLoading: false });
    }
  },

  logRevenue: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: entry, error } = await supabase
        .from('revenue_logs')
        .insert({
          business_id: data.business_id,
          amount: data.amount,
          type: data.type,
          source: data.source,
          customer_name: data.customer_name,
          description: data.description,
          transaction_date: data.transaction_date,
        })
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        revenueData: [entry as RevenueLog, ...state.revenueData],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log revenue';
      set({ error: message, isLoading: false });
    }
  },

  getMonthlyMetrics: (): MonthlyMetrics[] => {
    const { revenueData, expenseData } = get();

    const metricsByMonth = new Map<string, MonthlyMetrics>();

    for (const entry of revenueData) {
      const month = entry.transaction_date.substring(0, 7);
      const existing = metricsByMonth.get(month) ?? {
        month,
        total_revenue: 0,
        total_expenses: 0,
        net_income: 0,
        transaction_count: 0,
      };
      existing.total_revenue += entry.amount;
      existing.transaction_count += 1;
      existing.net_income = existing.total_revenue - existing.total_expenses;
      metricsByMonth.set(month, existing);
    }

    for (const entry of expenseData) {
      const month = entry.transaction_date.substring(0, 7);
      const existing = metricsByMonth.get(month) ?? {
        month,
        total_revenue: 0,
        total_expenses: 0,
        net_income: 0,
        transaction_count: 0,
      };
      existing.total_expenses += entry.amount;
      existing.transaction_count += 1;
      existing.net_income = existing.total_revenue - existing.total_expenses;
      metricsByMonth.set(month, existing);
    }

    return Array.from(metricsByMonth.values()).sort((a, b) =>
      b.month.localeCompare(a.month),
    );
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      businesses: [],
      revenueData: [],
      expenseData: [],
      isLoading: false,
      error: null,
    }),
}));
