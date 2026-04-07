import { useEffect, useMemo } from 'react';
import { useNutritionStore } from '@stores/nutritionStore';
import { useAuthStore } from '@stores/authStore';
import { getMacroProgress } from '@services/calculations/macros';
import { useProfileStore } from '@stores/profileStore';

export function useNutrition() {
  const store = useNutritionStore();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  useEffect(() => {
    if (user?.id) {
      store.fetchTodayNutrition();
    }
  }, [user?.id]);

  const todayMacros = useMemo(() => {
    const logs = store.todayLogs;
    return {
      calories: logs.reduce((sum, l) => sum + l.calories, 0),
      protein: logs.reduce((sum, l) => sum + l.protein, 0),
      carbs: logs.reduce((sum, l) => sum + l.carbs, 0),
      fat: logs.reduce((sum, l) => sum + l.fat, 0),
    };
  }, [store.todayLogs]);

  const macroProgress = useMemo(() => ({
    calories: getMacroProgress(profile?.daily_calorie_target ?? 0, todayMacros.calories),
    protein: getMacroProgress(profile?.daily_protein_target ?? 0, todayMacros.protein),
    carbs: getMacroProgress(profile?.daily_carb_target ?? 0, todayMacros.carbs),
    fat: getMacroProgress(profile?.daily_fat_target ?? 0, todayMacros.fat),
  }), [todayMacros, profile]);

  return {
    ...store,
    todayMacros,
    macroProgress,
  };
}
