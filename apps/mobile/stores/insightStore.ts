// =============================================================================
// TRANSFORMR -- Insight Store (Module 7)
// Manages AI predictions and proactive messages for the insights screen
// and dashboard integration.
// =============================================================================

import { create } from 'zustand';
import { supabase } from '@services/supabase';
import type { AIPrediction, ProactiveMessage } from '@app-types/ai';

interface InsightState {
  predictions: AIPrediction[];
  proactiveMessages: ProactiveMessage[];
  isLoading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  acknowledgePrediction: (id: string) => Promise<void>;
  dismissMessage: (id: string) => Promise<void>;
  markMessageRead: (id: string) => Promise<void>;
  unreadCount: () => number;
}

export const useInsightStore = create<InsightState>()((set, get) => ({
  predictions: [],
  proactiveMessages: [],
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [predRes, msgRes] = await Promise.all([
        supabase
          .from('ai_predictions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_acknowledged', false)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('proactive_messages')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_dismissed', false)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      set({
        predictions: (predRes.data ?? []) as AIPrediction[],
        proactiveMessages: (msgRes.data ?? []) as ProactiveMessage[],
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load insights',
      });
    }
  },

  acknowledgePrediction: async (id: string) => {
    await supabase
      .from('ai_predictions')
      .update({ is_acknowledged: true })
      .eq('id', id);

    set((s) => ({
      predictions: s.predictions.filter((p) => p.id !== id),
    }));
  },

  dismissMessage: async (id: string) => {
    await supabase
      .from('proactive_messages')
      .update({ is_dismissed: true })
      .eq('id', id);

    set((s) => ({
      proactiveMessages: s.proactiveMessages.filter((m) => m.id !== id),
    }));
  },

  markMessageRead: async (id: string) => {
    await supabase
      .from('proactive_messages')
      .update({ is_read: true })
      .eq('id', id);

    set((s) => ({
      proactiveMessages: s.proactiveMessages.map((m) =>
        m.id === id ? { ...m, is_read: true } : m,
      ),
    }));
  },

  unreadCount: () => {
    const { predictions, proactiveMessages } = get();
    return (
      predictions.length +
      proactiveMessages.filter((m) => !m.is_read).length
    );
  },
}));
