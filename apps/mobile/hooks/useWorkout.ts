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
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const templates = useWorkoutStore((s) => s.templates);
  const exercises = useWorkoutStore((s) => s.exercises);
  const isLoading = useWorkoutStore((s) => s.isLoading);
  const error = useWorkoutStore((s) => s.error);
  const pendingExerciseId = useWorkoutStore((s) => s.pendingExerciseId);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const logSet = useWorkoutStore((s) => s.logSet);
  const completeWorkout = useWorkoutStore((s) => s.completeWorkout);
  const fetchTemplates = useWorkoutStore((s) => s.fetchTemplates);
  const fetchExercises = useWorkoutStore((s) => s.fetchExercises);
  const getGhostData = useWorkoutStore((s) => s.getGhostData);
  const setPendingExerciseId = useWorkoutStore((s) => s.setPendingExerciseId);
  const clearError = useWorkoutStore((s) => s.clearError);
  const reset = useWorkoutStore((s) => s.reset);

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
          existingPRs = data.map((pr: { exercise_id: string; record_type: string; value: number }) => ({
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
      await logSet(exerciseId, setData);

      // If PR detected, trigger celebration
      if (prs.length > 0) {
        await hapticPR();
        return { prs, isPR: true };
      }

      return { prs: [], isPR: false };
    },
    [logSet],
  );

  return {
    activeSession,
    templates,
    exercises,
    isLoading,
    error,
    pendingExerciseId,
    startWorkout,
    logSet,
    completeWorkout,
    fetchTemplates,
    fetchExercises,
    getGhostData,
    setPendingExerciseId,
    clearError,
    reset,
    logSetWithPRDetection,
  };
}
