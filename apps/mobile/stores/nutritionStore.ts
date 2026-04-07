// =============================================================================
// TRANSFORMR — Nutrition Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type {
  NutritionLog,
  Food,
  WaterLog,
  Supplement,
  SupplementLog,
} from '../types/database';

/** Input data for logging a food entry. */
interface FoodLogInput {
  food_id?: string;
  saved_meal_id?: string;
  meal_type?: NutritionLog['meal_type'];
  quantity?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: NutritionLog['source'];
  photo_url?: string;
}

/** Computed macro totals for the day. */
interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water_oz: number;
}

interface NutritionState {
  todayLogs: NutritionLog[];
  waterLogs: WaterLog[];
  supplements: Supplement[];
  supplementLogs: SupplementLog[];
  searchResults: Food[];
  isLoading: boolean;
  error: string | null;
}

interface NutritionActions {
  logFood: (data: FoodLogInput) => Promise<void>;
  logWater: (oz: number) => Promise<void>;
  logSupplement: (supplementId: string) => Promise<void>;
  fetchTodayNutrition: () => Promise<void>;
  searchFoods: (query: string) => Promise<void>;
  getTodayMacros: () => MacroTotals;
  clearError: () => void;
  reset: () => void;
}

type NutritionStore = NutritionState & NutritionActions;

function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return { start, end };
}

export const useNutritionStore = create<NutritionStore>()((set, get) => ({
  // --- State ---
  todayLogs: [],
  waterLogs: [],
  supplements: [],
  supplementLogs: [],
  searchResults: [],
  isLoading: false,
  error: null,

  // --- Actions ---
  logFood: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newLog, error } = await supabase
        .from('nutrition_logs')
        .insert({
          user_id: user.id,
          food_id: data.food_id,
          saved_meal_id: data.saved_meal_id,
          meal_type: data.meal_type,
          quantity: data.quantity,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          source: data.source ?? 'manual',
          photo_url: data.photo_url,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        todayLogs: [...state.todayLogs, newLog as NutritionLog],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log food';
      set({ error: message, isLoading: false });
    }
  },

  logWater: async (oz) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newLog, error } = await supabase
        .from('water_logs')
        .insert({
          user_id: user.id,
          amount_oz: oz,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        waterLogs: [...state.waterLogs, newLog as WaterLog],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log water';
      set({ error: message, isLoading: false });
    }
  },

  logSupplement: async (supplementId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newLog, error } = await supabase
        .from('supplement_logs')
        .insert({
          user_id: user.id,
          supplement_id: supplementId,
          taken_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        supplementLogs: [...state.supplementLogs, newLog as SupplementLog],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log supplement';
      set({ error: message, isLoading: false });
    }
  },

  fetchTodayNutrition: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { start, end } = getTodayRange();

      const [nutritionResult, waterResult, supplementResult, supplementLogResult] =
        await Promise.all([
          supabase
            .from('nutrition_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('logged_at', start)
            .lt('logged_at', end)
            .order('logged_at'),
          supabase
            .from('water_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('logged_at', start)
            .lt('logged_at', end)
            .order('logged_at'),
          supabase
            .from('supplements')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true),
          supabase
            .from('supplement_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('taken_at', start)
            .lt('taken_at', end),
        ]);

      if (nutritionResult.error) throw nutritionResult.error;
      if (waterResult.error) throw waterResult.error;
      if (supplementResult.error) throw supplementResult.error;
      if (supplementLogResult.error) throw supplementLogResult.error;

      set({
        todayLogs: (nutritionResult.data ?? []) as NutritionLog[],
        waterLogs: (waterResult.data ?? []) as WaterLog[],
        supplements: (supplementResult.data ?? []) as Supplement[],
        supplementLogs: (supplementLogResult.data ?? []) as SupplementLog[],
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch nutrition data';
      set({ error: message, isLoading: false });
    }
  },

  searchFoods: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(30);
      if (error) throw error;

      set({ searchResults: (data ?? []) as Food[], isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to search foods';
      set({ error: message, isLoading: false });
    }
  },

  getTodayMacros: (): MacroTotals => {
    const { todayLogs, waterLogs } = get();

    const totals = todayLogs.reduce<MacroTotals>(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
        water_oz: acc.water_oz,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, water_oz: 0 },
    );

    totals.water_oz = waterLogs.reduce((sum, log) => sum + log.amount_oz, 0);

    return totals;
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      todayLogs: [],
      waterLogs: [],
      supplements: [],
      supplementLogs: [],
      searchResults: [],
      isLoading: false,
      error: null,
    }),
}));
