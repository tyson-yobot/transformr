// =============================================================================
// TRANSFORMR -- useWorkoutAdvisor Hook (Module 12)
// Session-level hook for active workout screens. Fetches AI set
// recommendations for a specific exercise and caches them locally.
// No server-side caching — state is ephemeral per workout session.
// =============================================================================

import { useState, useCallback } from 'react';
import {
  getNextSetRecommendation,
} from '@services/ai/workoutAdvisor';
import type {
  CompletedSet,
  SetRecommendation,
} from '@services/ai/workoutAdvisor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { CompletedSet, SetRecommendation };

export interface UseWorkoutAdvisorResult {
  recommendation: SetRecommendation | null;
  isLoading: boolean;
  error: string | null;
  getRecommendation: (
    completedSets: CompletedSet[],
    userGoal: 'strength' | 'hypertrophy' | 'endurance',
  ) => Promise<void>;
  clearRecommendation: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Provides AI set recommendations for a specific exercise during an active
 * workout. Maintains session-level state — no persistent caching needed.
 *
 * @param exerciseId - The ID of the exercise being performed
 * @param exerciseName - Display name of the exercise (used in AI prompt)
 */
export function useWorkoutAdvisor(
  exerciseId: string,
  exerciseName: string,
): UseWorkoutAdvisorResult {
  const [recommendation, setRecommendation] = useState<SetRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = useCallback(
    async (
      completedSets: CompletedSet[],
      userGoal: 'strength' | 'hypertrophy' | 'endurance',
    ): Promise<void> => {
      if (completedSets.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getNextSetRecommendation({
          exerciseId,
          exerciseName,
          completedSets,
          userGoal,
        });
        setRecommendation(result);
      } catch {
        setError('Failed to get recommendation. Pull to refresh.');
      } finally {
        setIsLoading(false);
      }
    },
    [exerciseId, exerciseName],
  );

  const clearRecommendation = useCallback(() => {
    setRecommendation(null);
    setError(null);
  }, []);

  return {
    recommendation,
    isLoading,
    error,
    getRecommendation,
    clearRecommendation,
  };
}
