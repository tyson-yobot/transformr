// =============================================================================
// TRANSFORMR — Sleep Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { SleepLog } from '../types/database';

/** Date range for querying history. */
interface DateRange {
  start: string;
  end: string;
}

/** Input data for logging a sleep entry. */
interface SleepInput {
  bedtime: string;
  wake_time: string;
  duration_minutes?: number;
  quality?: number;
  caffeine_cutoff_time?: string;
  screen_cutoff_time?: string;
  notes?: string;
}

interface SleepState {
  lastSleep: SleepLog | null;
  sleepHistory: SleepLog[];
  isLoading: boolean;
  error: string | null;
}

interface SleepActions {
  logSleep: (data: SleepInput) => Promise<void>;
  fetchSleepHistory: (dateRange: DateRange) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type SleepStore = SleepState & SleepActions;

export const useSleepStore = create<SleepStore>()((set) => ({
  // --- State ---
  lastSleep: null,
  sleepHistory: [],
  isLoading: false,
  error: null,

  // --- Actions ---
  logSleep: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: entry, error } = await supabase
        .from('sleep_logs')
        .insert({
          user_id: user.id,
          bedtime: data.bedtime,
          wake_time: data.wake_time,
          duration_minutes: data.duration_minutes,
          quality: data.quality,
          caffeine_cutoff_time: data.caffeine_cutoff_time,
          screen_cutoff_time: data.screen_cutoff_time,
          notes: data.notes,
        })
        .select()
        .single();
      if (error) throw error;

      const newEntry = entry as SleepLog;
      set((state) => ({
        lastSleep: newEntry,
        sleepHistory: [newEntry, ...state.sleepHistory],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log sleep';
      set({ error: message, isLoading: false });
    }
  },

  fetchSleepHistory: async (dateRange) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const entries = (data ?? []) as SleepLog[];
      const lastSleep = entries.length > 0 ? entries[0] : null;

      set({
        sleepHistory: entries,
        lastSleep,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sleep history';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      lastSleep: null,
      sleepHistory: [],
      isLoading: false,
      error: null,
    }),
}));
