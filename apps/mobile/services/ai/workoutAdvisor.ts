// =============================================================================
// TRANSFORMR -- Workout Advisor Service (Module 12)
// Calls the ai-workout-advisor Edge Function to get real-time set
// recommendations during an active workout.
// =============================================================================

import { supabase } from '@services/supabase';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface CompletedSet {
  weight: number;
  reps: number;
  rpe?: number;
}

export interface WorkoutAdvisorParams {
  exerciseId: string;
  exerciseName: string;
  completedSets: CompletedSet[];
  userGoal: 'strength' | 'hypertrophy' | 'endurance';
}

export interface SetRecommendation {
  recommendedWeight: number;
  recommendedReps: number;
  recommendedRpe: number;
  rationale: string;
  warningFlag?: string;
}

// ---------------------------------------------------------------------------
// getNextSetRecommendation
// ---------------------------------------------------------------------------

/**
 * Calls the ai-workout-advisor Edge Function with the user's current workout
 * context and returns a recommendation for the next set.
 *
 * @throws Error if the function call fails or returns an error
 */
export async function getNextSetRecommendation(
  params: WorkoutAdvisorParams,
): Promise<SetRecommendation> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to get workout recommendations');
  }

  const { data, error } = await supabase.functions.invoke('ai-workout-advisor', {
    body: {
      userId: user.id,
      exerciseId: params.exerciseId,
      exerciseName: params.exerciseName,
      completedSets: params.completedSets,
      userGoal: params.userGoal,
    },
  });

  if (error) throw error;

  const result = data as SetRecommendation & { error?: string };

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    recommendedWeight: result.recommendedWeight,
    recommendedReps: result.recommendedReps,
    recommendedRpe: result.recommendedRpe,
    rationale: result.rationale,
    warningFlag: result.warningFlag,
  };
}
