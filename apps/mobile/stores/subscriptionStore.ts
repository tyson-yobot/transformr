// =============================================================================
// TRANSFORMR — Subscription Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { getStorageJSON, setStorageJSON } from '../utils/storage';

export type SubscriptionTier = 'free' | 'pro' | 'elite' | 'partners';

const USAGE_STORAGE_KEY = 'subscription_usage';

interface UsageTracking {
  aiMealCameraScans: number;
  aiChatMessages: number;
  lastResetDate: string; // YYYY-MM-DD, resets monthly
}

interface SubscriptionState {
  tier: SubscriptionTier;
  isLoading: boolean;
  error: string | null;
  expiresAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  usage: UsageTracking;
}

interface SubscriptionActions {
  loadSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  incrementUsage: (key: keyof Omit<UsageTracking, 'lastResetDate'>) => void;
  resetUsageIfNewMonth: () => void;
  reset: () => void;
}

type SubscriptionStore = SubscriptionState & SubscriptionActions;

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getMonthPrefix(dateStr: string): string {
  // Returns 'YYYY-MM' from a 'YYYY-MM-DD' string
  return dateStr.slice(0, 7);
}

const defaultUsage: UsageTracking = {
  aiMealCameraScans: 0,
  aiChatMessages: 0,
  lastResetDate: getTodayString(),
};

const initialState: SubscriptionState = {
  tier: 'free',
  isLoading: false,
  error: null,
  expiresAt: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  usage: defaultUsage,
};

export const useSubscriptionStore = create<SubscriptionStore>()((set, get) => ({
  // --- State ---
  ...initialState,

  // --- Actions ---
  loadSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'subscription_tier, subscription_expires_at, stripe_customer_id, stripe_subscription_id',
        )
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Read persisted usage from MMKV, then reset if new month
      const persistedUsage = getStorageJSON<UsageTracking>(USAGE_STORAGE_KEY);
      const usage: UsageTracking = persistedUsage ?? { ...defaultUsage };

      const profile = data as {
        subscription_tier?: SubscriptionTier | null;
        subscription_expires_at?: string | null;
        stripe_customer_id?: string | null;
        stripe_subscription_id?: string | null;
      };

      set({
        tier: profile.subscription_tier ?? 'free',
        expiresAt: profile.subscription_expires_at ?? null,
        stripeCustomerId: profile.stripe_customer_id ?? null,
        stripeSubscriptionId: profile.stripe_subscription_id ?? null,
        usage,
        isLoading: false,
      });

      // Reset usage counters if it's a new month
      get().resetUsageIfNewMonth();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load subscription';
      set({ error: message, isLoading: false });
    }
  },

  refreshSubscription: async () => {
    await get().loadSubscription();
  },

  incrementUsage: (key) => {
    const current = get().usage;
    const updated: UsageTracking = {
      ...current,
      [key]: current[key] + 1,
    };
    set({ usage: updated });
    setStorageJSON<UsageTracking>(USAGE_STORAGE_KEY, updated);
  },

  resetUsageIfNewMonth: () => {
    const { usage } = get();
    const today = getTodayString();
    if (getMonthPrefix(usage.lastResetDate) !== getMonthPrefix(today)) {
      const reset: UsageTracking = {
        aiMealCameraScans: 0,
        aiChatMessages: 0,
        lastResetDate: today,
      };
      set({ usage: reset });
      setStorageJSON<UsageTracking>(USAGE_STORAGE_KEY, reset);
    }
  },

  reset: () => set({ ...initialState }),
}));
