import { useCallback } from 'react';
import { useWorkoutStore } from '@stores/workoutStore';
import { detectPRs } from '@services/calculations/prDetection';
import { hapticPR } from '@utils/haptics';
import { supabase } from '@services/supabase';

interface ExistingPR {
  exerciseId: string;
  recordType: string;
  value: number;
}

export function useWorkout() {
  const store = useWorkoutStore();

  const logSetWithPRDetection = useCallback(
    async (exerciseId: string, setData: { weight: number; reps: number; durationSeconds?: number; rpe?: number }) => {
      // Get existing PRs for this exercise
      const { data: { user } } = await supabase.auth.getUser();
      let existingPRs: ExistingPR[] = [];

      if (user) {
        const { data } = await supabase
          .from('personal_records')
          .select('exercise_id, record_type, value')
          .eq('user_id', user.id)
          .eq('exercise_id', exerciseId);

        if (data) {
          existingPRs = data.map((pr) => ({
            exerciseId: pr.exercise_id as string,
            recordType: pr.record_type as string,
            value: pr.value as number,
          }));
        }
      }

      const prs = detectPRs(
        { exerciseId, ...setData },
        existingPRs,
      );

      // Log the set
      await store.logSet(exerciseId, setData);

      // If PR detected, trigger celebration
      if (prs.length > 0) {
        await hapticPR();
        return { prs, isPR: true };
      }

      return { prs: [], isPR: false };
    },
    [store],
  );

  return {
    ...store,
    logSetWithPRDetection,
  };
}
