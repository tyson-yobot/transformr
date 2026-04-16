// =============================================================================
// TRANSFORMR — Mood Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { addToSyncQueue } from '@utils/storage';
import type { MoodLog } from '../types/database';

/** Date range for querying history. */
interface DateRange {
  start: string;
  end: string;
}

/** Input data for logging a mood entry. */
interface MoodInput {
  mood: number;
  energy: number;
  stress: number;
  motivation?: number;
  context?: MoodLog['context'];
  notes?: string;
}

interface MoodState {
  todayMood: MoodLog | null;
  moodHistory: MoodLog[];
  isLoading: boolean;
  error: string | null;
}

interface MoodActions {
  logMood: (data: MoodInput) => Promise<void>;
  fetchMoodHistory: (dateRange: DateRange) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type MoodStore = MoodState & MoodActions;

export const useMoodStore = create<MoodStore>()((set, get) => ({
  // --- State ---
  todayMood: null,
  moodHistory: [],
  isLoading: false,
  error: null,

  // --- Actions ---
  logMood: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const existingId = get().todayMood?.id;

      let entry: MoodLog;
      if (existingId) {
        // Update existing entry for today
        const moodUpdatePayload = {
          mood: data.mood,
          energy: data.energy,
          stress: data.stress,
          motivation: data.motivation,
          context: data.context,
          notes: data.notes,
          logged_at: new Date().toISOString(),
        };
        const { data: updated, error } = await supabase
          .from('mood_logs')
          .update(moodUpdatePayload)
          .eq('id', existingId)
          .select()
          .single();
        if (error) throw error;
        addToSyncQueue({ table: 'mood_logs', operation: 'update', data: { id: existingId, ...moodUpdatePayload } });
        entry = updated as MoodLog;
      } else {
        // Insert new entry
        const moodInsertPayload = {
          user_id: user.id,
          mood: data.mood,
          energy: data.energy,
          stress: data.stress,
          motivation: data.motivation,
          context: data.context,
          notes: data.notes,
          logged_at: new Date().toISOString(),
        };
        const { data: inserted, error } = await supabase
          .from('mood_logs')
          .insert(moodInsertPayload)
          .select()
          .single();
        if (error) throw error;
        addToSyncQueue({ table: 'mood_logs', operation: 'insert', data: moodInsertPayload });
        entry = inserted as MoodLog;
      }

      set((state) => ({
        todayMood: entry,
        moodHistory: existingId
          ? state.moodHistory.map((m) => (m.id === existingId ? entry : m))
          : [entry, ...state.moodHistory],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log mood';
      set({ error: message, isLoading: false });
    }
  },

  fetchMoodHistory: async (dateRange) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', dateRange.start)
        .lte('logged_at', dateRange.end)
        .order('logged_at', { ascending: false });
      if (error) throw error;

      const entries = (data ?? []) as MoodLog[];

      // Determine today's mood from the results
      const todayStr = new Date().toDateString();
      const todayEntry = entries.find(
        (e) => e.logged_at && new Date(e.logged_at).toDateString() === todayStr,
      ) ?? null;

      set({
        moodHistory: entries,
        todayMood: todayEntry,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch mood history';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      todayMood: null,
      moodHistory: [],
      isLoading: false,
      error: null,
    }),
}));
