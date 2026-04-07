// =============================================================================
// TRANSFORMR — Habit Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Habit, HabitCompletion } from '../types/database';

/** Input data for creating a new habit. */
interface HabitInput {
  name: string;
  description?: string;
  category?: Habit['category'];
  frequency?: Habit['frequency'];
  custom_days?: number[];
  target_count?: number;
  unit?: string;
  reminder_time?: string;
  color?: string;
  icon?: string;
}

/** Streak information for a single habit. */
interface HabitStreak {
  habit_id: string;
  habit_name: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
}

interface HabitState {
  habits: Habit[];
  todayCompletions: HabitCompletion[];
  isLoading: boolean;
  error: string | null;
}

interface HabitActions {
  fetchHabits: () => Promise<void>;
  completeHabit: (habitId: string) => Promise<void>;
  createHabit: (data: HabitInput) => Promise<void>;
  getStreakData: () => Promise<HabitStreak[]>;
  clearError: () => void;
  reset: () => void;
}

type HabitStore = HabitState & HabitActions;

function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return { start, end };
}

export const useHabitStore = create<HabitStore>()((set, get) => ({
  // --- State ---
  habits: [],
  todayCompletions: [],
  isLoading: false,
  error: null,

  // --- Actions ---
  fetchHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { start, end } = getTodayRange();

      const [habitsResult, completionsResult] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', user.id)
          .gte('completed_at', start)
          .lt('completed_at', end),
      ]);

      if (habitsResult.error) throw habitsResult.error;
      if (completionsResult.error) throw completionsResult.error;

      set({
        habits: (habitsResult.data ?? []) as Habit[],
        todayCompletions: (completionsResult.data ?? []) as HabitCompletion[],
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch habits';
      set({ error: message, isLoading: false });
    }
  },

  completeHabit: async (habitId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_count: 1,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        todayCompletions: [...state.todayCompletions, data as HabitCompletion],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete habit';
      set({ error: message, isLoading: false });
    }
  },

  createHabit: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newHabit, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          category: data.category,
          frequency: data.frequency ?? 'daily',
          custom_days: data.custom_days,
          target_count: data.target_count ?? 1,
          unit: data.unit,
          reminder_time: data.reminder_time,
          color: data.color,
          icon: data.icon,
          is_active: true,
          current_streak: 0,
          longest_streak: 0,
          streak_shields: 0,
        })
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        habits: [...state.habits, newHabit as Habit],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create habit';
      set({ error: message, isLoading: false });
    }
  },

  getStreakData: async (): Promise<HabitStreak[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const habits = get().habits;

      const { data: completions, error } = await supabase
        .from('habit_completions')
        .select('habit_id, completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      if (error) throw error;

      const completionsByHabit = new Map<string, string[]>();
      for (const c of completions ?? []) {
        if (!c.habit_id || !c.completed_at) continue;
        const existing = completionsByHabit.get(c.habit_id) ?? [];
        existing.push(c.completed_at);
        completionsByHabit.set(c.habit_id, existing);
      }

      return habits.map((habit) => {
        const dates = (completionsByHabit.get(habit.id) ?? [])
          .map((d) => new Date(d).toDateString())
          .filter((value, index, self) => self.indexOf(value) === index)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        const today = new Date();

        for (let i = 0; i < dates.length; i++) {
          const expected = new Date(today);
          expected.setDate(expected.getDate() - i);
          if (dates[i] === expected.toDateString()) {
            tempStreak++;
            currentStreak = tempStreak;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 0;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return {
          habit_id: habit.id,
          habit_name: habit.name,
          current_streak: habit.current_streak ?? currentStreak,
          longest_streak: habit.longest_streak ?? longestStreak,
          total_completions: completionsByHabit.get(habit.id)?.length ?? 0,
        };
      });
    } catch {
      return [];
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      habits: [],
      todayCompletions: [],
      isLoading: false,
      error: null,
    }),
}));
