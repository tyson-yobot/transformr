// =============================================================================
// TRANSFORMR — Workout Narrator Service
//
// Client for the `workout-narrator` Supabase Edge Function.
// Generates AI coaching cues between sets: feedback, form tips, rest timing.
// Pairs with narrator.ts (TTS) to speak the returned narration aloud.
// =============================================================================

import { supabase } from '../supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';

// ---------------------------------------------------------------------------
// Types (mirror the Edge Function's interfaces)
// ---------------------------------------------------------------------------

export type CoachingTone = 'drill_sergeant' | 'motivational' | 'balanced' | 'calm';
export type NarratorTipType =
  | 'form'
  | 'motivation'
  | 'adjustment'
  | 'pr_celebration'
  | 'rest_timing';

export interface PreviousSet {
  reps: number;
  weight: number;
  rpe?: number;
}

export interface NarratorCueRequest {
  userId: string;
  sessionId: string;
  exerciseName: string;
  setNumber: number;
  repsCompleted: number;
  weightUsed: number;
  targetReps: number;
  targetWeight: number;
  previousSets: PreviousSet[];
  exercisePR?: number;
  coachingTone: CoachingTone;
}

export interface NarratorCueResponse {
  narration: string;
  tipType: NarratorTipType;
  restSeconds: number;
}

// ---------------------------------------------------------------------------
// Service function
// ---------------------------------------------------------------------------

/**
 * Call the workout-narrator Edge Function to get an AI coaching cue
 * after a set is completed. Returns the narration text and rest recommendation.
 *
 * @throws If the Edge Function call fails or returns no data.
 */
export async function getNarratorCue(request: NarratorCueRequest): Promise<NarratorCueResponse> {
  const userContext: UserAIContext | null = await buildUserAIContext(request.userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke<NarratorCueResponse>(
    'workout-narrator',
    { body: { ...request, userContext } },
  );

  if (error) throw error;
  if (!data) throw new Error('workout-narrator returned no data');

  return data;
}
