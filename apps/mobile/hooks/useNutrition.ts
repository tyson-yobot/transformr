import { useEffect, useMemo } from 'react';
import { useNutritionStore } from '@stores/nutritionStore';
import { useAuthStore } from '@stores/authStore';
import { getMacroProgress } from '@services/calculations/macros';
import { useProfileStore } from '@stores/profileStore';

export function useNutrition() {
  const todayLogs = useNutritionStore((s) => s.todayLogs);
  const waterLogs = useNutritionStore((s) => s.waterLogs);
  const supplements = useNutritionStore((s) => s.supplements);
  const supplementLogs = useNutritionStore((s) => s.supplementLogs);
  const searchResults = useNutritionStore((s) => s.searchResults);
  const foodNameMap = useNutritionStore((s) => s.foodNameMap);
  const isLoading = useNutritionStore((s) => s.isLoading);
  const error = useNutritionStore((s) => s.error);
  const logFood = useNutritionStore((s) => s.logFood);
  const deleteLog = useNutritionStore((s) => s.deleteLog);
  const logWater = useNutritionStore((s) => s.logWater);
  const logSupplement = useNutritionStore((s) => s.logSupplement);
  const fetchTodayNutrition = useNutritionStore((s) => s.fetchTodayNutrition);
  const searchFoods = useNutritionStore((s) => s.searchFoods);
  const getTodayMacros = useNutritionStore((s) => s.getTodayMacros);
  const logCaloriesBurned = useNutritionStore((s) => s.logCaloriesBurned);
  const clearError = useNutritionStore((s) => s.clearError);
  const reset = useNutritionStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);

  useEffect(() => {
    if (user?.id) {
      fetchTodayNutrition();
    }
  }, [user?.id, fetchTodayNutrition]);

  const todayMacros = useMemo(() => {
    const logs = todayLogs;
    return {
      calories: logs.reduce((sum, l) => sum + l.calories, 0),
      protein: logs.reduce((sum, l) => sum + l.protein, 0),
      carbs: logs.reduce((sum, l) => sum + l.carbs, 0),
      fat: logs.reduce((sum, l) => sum + l.fat, 0),
    };
  }, [todayLogs]);

  const macroProgress = useMemo(() => ({
    calories: getMacroProgress(profile?.daily_calorie_target ?? 0, todayMacros.calories),
    protein: getMacroProgress(profile?.daily_protein_target ?? 0, todayMacros.protein),
    carbs: getMacroProgress(profile?.daily_carb_target ?? 0, todayMacros.carbs),
    fat: getMacroProgress(profile?.daily_fat_target ?? 0, todayMacros.fat),
  }), [todayMacros, profile]);

  return {
    todayLogs,
    waterLogs,
    supplements,
    supplementLogs,
    searchResults,
    foodNameMap,
    isLoading,
    error,
    logFood,
    deleteLog,
    logWater,
    logSupplement,
    fetchTodayNutrition,
    searchFoods,
    getTodayMacros,
    logCaloriesBurned,
    clearError,
    reset,
    todayMacros,
    macroProgress,
  };
}
