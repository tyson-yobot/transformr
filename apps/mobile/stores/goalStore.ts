// =============================================================================
// TRANSFORMR — Goal Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Goal, GoalMilestone } from '../types/database';

/** Input data for creating a new goal. */
interface GoalInput {
  title: string;
  description?: string;
  category?: Goal['category'];
  goal_type?: Goal['goal_type'];
  target_value?: number;
  unit?: string;
  start_date?: string;
  target_date?: string;
  priority?: number;
  color?: string;
  icon?: string;
}

interface GoalState {
  goals: Goal[];
  milestones: GoalMilestone[];
  isLoading: boolean;
  error: string | null;
}

interface GoalActions {
  fetchGoals: () => Promise<void>;
  createGoal: (data: GoalInput) => Promise<void>;
  updateGoalProgress: (id: string, value: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type GoalStore = GoalState & GoalActions;

export const useGoalStore = create<GoalStore>()((set) => ({
  // --- State ---
  goals: [],
  milestones: [],
  isLoading: false,
  error: null,

  // --- Actions ---
  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'paused'])
        .order('priority', { ascending: false });
      if (goalsError) throw goalsError;

      const goalIds = (goalsData ?? []).map((g: Goal) => g.id);

      let milestonesData: GoalMilestone[] = [];
      if (goalIds.length > 0) {
        const { data: msData, error: msError } = await supabase
          .from('goal_milestones')
          .select('*')
          .in('goal_id', goalIds)
          .order('sort_order');
        if (msError) throw msError;
        milestonesData = (msData ?? []) as GoalMilestone[];
      }

      set({
        goals: (goalsData ?? []) as Goal[],
        milestones: milestonesData,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch goals';
      set({ error: message, isLoading: false });
    }
  },

  createGoal: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newGoal, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description,
          category: data.category,
          goal_type: data.goal_type ?? 'target',
          target_value: data.target_value,
          current_value: 0,
          unit: data.unit,
          start_date: data.start_date,
          target_date: data.target_date,
          priority: data.priority,
          color: data.color,
          icon: data.icon,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        goals: [...state.goals, newGoal as Goal],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create goal';
      set({ error: message, isLoading: false });
    }
  },

  updateGoalProgress: async (id, value) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch the goal to check target
      const { data: goalData, error: fetchError } = await supabase
        .from('goals')
        .select('target_value')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      const isCompleted =
        goalData?.target_value != null && value >= goalData.target_value;

      const updatePayload: Record<string, unknown> = {
        current_value: value,
      };
      if (isCompleted) {
        updatePayload.status = 'completed';
        updatePayload.completed_at = new Date().toISOString();
      }

      const { data: updated, error } = await supabase
        .from('goals')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? (updated as Goal) : g)),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update goal progress';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      goals: [],
      milestones: [],
      isLoading: false,
      error: null,
    }),
}));
