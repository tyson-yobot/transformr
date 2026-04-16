// =============================================================================
// TRANSFORMR — Nutrition Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { addToSyncQueue } from '@utils/storage';
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
  /** Name used for manual entries — triggers auto-creation of a custom food record. */
  food_name?: string;
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
  /** Maps food_id → food name for display in MealCard. */
  foodNameMap: Record<string, string>;
  isLoading: boolean;
  error: string | null;
}

interface NutritionActions {
  logFood: (data: FoodLogInput) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  logWater: (oz: number) => Promise<void>;
  logSupplement: (supplementId: string) => Promise<void>;
  fetchTodayNutrition: (dayOffset?: number) => Promise<void>;
  searchFoods: (query: string) => Promise<void>;
  getTodayMacros: () => MacroTotals;
  logCaloriesBurned: (calories: number, workoutName: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type NutritionStore = NutritionState & NutritionActions;

function getTodayRange(dayOffset = 0): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset + 1).toISOString();
  return { start, end };
}

export const useNutritionStore = create<NutritionStore>()((set, get) => ({
  // --- State ---
  todayLogs: [],
  waterLogs: [],
  supplements: [],
  supplementLogs: [],
  searchResults: [],
  foodNameMap: {},
  isLoading: false,
  error: null,

  // --- Actions ---
  logFood: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If caller provided a manual food name but no food_id, create a custom food
      // record so the name is stored and can be displayed in the meal list.
      let resolvedFoodId = data.food_id;
      if (!resolvedFoodId && data.food_name?.trim()) {
        const { data: customFood, error: foodErr } = await supabase
          .from('foods')
          .insert({
            name: data.food_name.trim(),
            serving_size: 1,
            serving_unit: 'serving',
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fat: data.fat,
          })
          .select('id')
          .single();
        if (foodErr) throw foodErr;
        resolvedFoodId = (customFood as { id: string }).id;
        // Cache the name immediately so UI updates without waiting for a re-fetch
        set((state) => ({
          foodNameMap: { ...state.foodNameMap, [resolvedFoodId as string]: data.food_name as string },
        }));
      }

      const nutritionPayload = {
        user_id: user.id,
        food_id: resolvedFoodId,
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
      };
      const { data: newLog, error } = await supabase
        .from('nutrition_logs')
        .insert(nutritionPayload)
        .select()
        .single();
      if (error) throw error;
      addToSyncQueue({ table: 'nutrition_logs', operation: 'insert', data: nutritionPayload });

      set((state) => ({
        todayLogs: [...state.todayLogs, newLog as NutritionLog],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log food';
      set({ error: message, isLoading: false });
    }
  },

  deleteLog: async (id) => {
    try {
      const { error } = await supabase.from('nutrition_logs').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        todayLogs: state.todayLogs.filter((log) => log.id !== id),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete log';
      set({ error: message });
    }
  },

  logWater: async (oz) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const waterPayload = {
        user_id: user.id,
        amount_oz: oz,
        logged_at: new Date().toISOString(),
      };
      const { data: newLog, error } = await supabase
        .from('water_logs')
        .insert(waterPayload)
        .select()
        .single();
      if (error) throw error;
      addToSyncQueue({ table: 'water_logs', operation: 'insert', data: waterPayload });

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

      const suppLogPayload = {
        user_id: user.id,
        supplement_id: supplementId,
        taken_at: new Date().toISOString(),
      };
      const { data: newLog, error } = await supabase
        .from('supplement_logs')
        .insert(suppLogPayload)
        .select()
        .single();
      if (error) throw error;
      addToSyncQueue({ table: 'supplement_logs', operation: 'insert', data: suppLogPayload });

      set((state) => ({
        supplementLogs: [...state.supplementLogs, newLog as SupplementLog],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log supplement';
      set({ error: message, isLoading: false });
    }
  },

  fetchTodayNutrition: async (dayOffset = 0) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { start, end } = getTodayRange(dayOffset);

      const [nutritionResult, waterResult, supplementResult, supplementLogResult] =
        await Promise.all([
          supabase
            .from('nutrition_logs')
            .select('*, food:food_id(name)')
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

      // Build food name map from joined food records
      const nameMap: Record<string, string> = {};
      for (const row of nutritionResult.data ?? []) {
        const joined = row as unknown as { food_id?: string; food?: { name?: string } | null };
        if (joined.food_id && joined.food?.name) {
          nameMap[joined.food_id] = joined.food.name;
        }
      }

      set({
        todayLogs: (nutritionResult.data ?? []) as NutritionLog[],
        waterLogs: (waterResult.data ?? []) as WaterLog[],
        supplements: (supplementResult.data ?? []) as Supplement[],
        supplementLogs: (supplementLogResult.data ?? []) as SupplementLog[],
        foodNameMap: nameMap,
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

  logCaloriesBurned: async (calories, workoutName) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('nutrition_logs').insert({
        user_id: user.id,
        food_name: `Workout: ${workoutName}`,
        meal_type: 'exercise',
        calories: -Math.abs(calories),
        protein: 0,
        carbs: 0,
        fat: 0,
        quantity: 1,
        source: 'manual',
        logged_at: new Date().toISOString(),
      });
    } catch {
      // Non-fatal — calorie burn logging should never block workout completion
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      todayLogs: [],
      waterLogs: [],
      supplements: [],
      supplementLogs: [],
      searchResults: [],
      foodNameMap: {},
      isLoading: false,
      error: null,
    }),
}));
