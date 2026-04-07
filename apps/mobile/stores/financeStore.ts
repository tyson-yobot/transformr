// =============================================================================
// TRANSFORMR — Finance Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type {
  FinanceAccount,
  FinanceTransaction,
  Budget,
  NetWorthSnapshot,
} from '../types/database';

/** Input data for logging a transaction. */
interface TransactionInput {
  account_id: string;
  amount: number;
  category?: FinanceTransaction['category'];
  description?: string;
  is_recurring?: boolean;
  transaction_date: string;
}

interface FinanceState {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  budgets: Budget[];
  netWorthHistory: NetWorthSnapshot[];
  isLoading: boolean;
  error: string | null;
}

interface FinanceActions {
  fetchAccounts: () => Promise<void>;
  logTransaction: (data: TransactionInput) => Promise<void>;
  fetchBudgets: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type FinanceStore = FinanceState & FinanceActions;

export const useFinanceStore = create<FinanceStore>()((set) => ({
  // --- State ---
  accounts: [],
  transactions: [],
  budgets: [],
  netWorthHistory: [],
  isLoading: false,
  error: null,

  // --- Actions ---
  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [accountsResult, transactionsResult, netWorthResult] = await Promise.all([
        supabase
          .from('finance_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('finance_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })
          .limit(200),
        supabase
          .from('net_worth_snapshots')
          .select('*')
          .eq('user_id', user.id)
          .order('snapshot_date', { ascending: false })
          .limit(24),
      ]);

      if (accountsResult.error) throw accountsResult.error;
      if (transactionsResult.error) throw transactionsResult.error;
      if (netWorthResult.error) throw netWorthResult.error;

      set({
        accounts: (accountsResult.data ?? []) as FinanceAccount[],
        transactions: (transactionsResult.data ?? []) as FinanceTransaction[],
        netWorthHistory: (netWorthResult.data ?? []) as NetWorthSnapshot[],
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch accounts';
      set({ error: message, isLoading: false });
    }
  },

  logTransaction: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: transaction, error } = await supabase
        .from('finance_transactions')
        .insert({
          user_id: user.id,
          account_id: data.account_id,
          amount: data.amount,
          category: data.category,
          description: data.description,
          is_recurring: data.is_recurring ?? false,
          transaction_date: data.transaction_date,
        })
        .select()
        .single();
      if (error) throw error;

      // Attempt to update account balance via RPC
      const balanceAdjustment = data.amount; // positive = income, negative = expense
      const { error: balanceError } = await supabase.rpc('update_account_balance', {
        p_account_id: data.account_id,
        p_amount: balanceAdjustment,
      });

      if (balanceError) {
        // Fallback: re-fetch accounts if RPC is not available
        const { data: refreshed } = await supabase
          .from('finance_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name');
        if (refreshed) {
          set({ accounts: refreshed as FinanceAccount[] });
        }
      }

      set((state) => ({
        transactions: [transaction as FinanceTransaction, ...state.transactions],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log transaction';
      set({ error: message, isLoading: false });
    }
  },

  fetchBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current month in YYYY-MM format
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .order('category');
      if (error) throw error;

      set({ budgets: (data ?? []) as Budget[], isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch budgets';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      accounts: [],
      transactions: [],
      budgets: [],
      netWorthHistory: [],
      isLoading: false,
      error: null,
    }),
}));
