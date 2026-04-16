// =============================================================================
// TRANSFORMR — Habit Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { addToSyncQueue } from '@utils/storage';
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
  allCompletions: HabitCompletion[];
  /** Overall streak: consecutive calendar days with ≥1 habit completion. Null before first fetch. */
  overallStreak: number | null;
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

/**
 * Computes consecutive calendar days ending today (or yesterday) on which
 * at least one habit_completion exists. This is the authoritative "overall streak".
 */
function computeOverallStreak(completions: HabitCompletion[]): number {
  if (completions.length === 0) return 0;

  // Collect unique YYYY-MM-DD dates
  const uniqueDates = [
    ...new Set(
      completions
        .filter((c) => Boolean(c.completed_at))
        .map((c) => (c.completed_at as string).split('T')[0] as string),
    ),
  ].sort().reverse(); // newest first

  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const dateStr of uniqueDates) {
    const cursorStr = cursor.toISOString().split('T')[0] as string;

    // Allow today or yesterday as a valid start
    if (streak === 0) {
      const yesterday = new Date(cursor);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0] as string;
      if (dateStr !== cursorStr && dateStr !== yesterdayStr) break;
      if (dateStr === yesterdayStr) cursor.setDate(cursor.getDate() - 1);
    } else if (dateStr !== cursorStr) {
      break;
    }

    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

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
  allCompletions: [],
  overallStreak: null,
  isLoading: false,
  error: null,

  // --- Actions ---
  fetchHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { start, end } = getTodayRange();
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const [habitsResult, completionsResult, historyResult] = await Promise.all([
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
        supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', user.id)
          .gte('completed_at', ninetyDaysAgo.toISOString()),
      ]);

      if (habitsResult.error) throw habitsResult.error;
      if (completionsResult.error) throw completionsResult.error;
      if (historyResult.error) throw historyResult.error;

      const fetchedHistory = (historyResult.data ?? []) as HabitCompletion[];
      set({
        habits: (habitsResult.data ?? []) as Habit[],
        todayCompletions: (completionsResult.data ?? []) as HabitCompletion[],
        allCompletions: fetchedHistory,
        overallStreak: computeOverallStreak(fetchedHistory),
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

      const completionPayload = {
        habit_id: habitId,
        user_id: user.id,
        completed_count: 1,
        completed_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('habit_completions')
        .insert(completionPayload)
        .select()
        .single();
      if (error) throw error;
      addToSyncQueue({ table: 'habit_completions', operation: 'insert', data: completionPayload });

      const completion = data as HabitCompletion;

      // Increment streak on the habit record
      const habit = get().habits.find((h) => h.id === habitId);
      const newStreak = (habit?.current_streak ?? 0) + 1;
      const newLongest = Math.max(habit?.longest_streak ?? 0, newStreak);
      await supabase
        .from('habits')
        .update({ current_streak: newStreak, longest_streak: newLongest })
        .eq('id', habitId);

      set((state) => {
        const newAllCompletions = [...state.allCompletions, completion];
        return {
          todayCompletions: [...state.todayCompletions, completion],
          allCompletions: newAllCompletions,
          overallStreak: computeOverallStreak(newAllCompletions),
          habits: state.habits.map((h) =>
            h.id === habitId
              ? { ...h, current_streak: newStreak, longest_streak: newLongest }
              : h,
          ),
          isLoading: false,
        };
      });
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
    } catch (err: unknown) {
      void err;
      return [];
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      habits: [],
      todayCompletions: [],
      allCompletions: [],
      overallStreak: null,
      isLoading: false,
      error: null,
    }),
}));
