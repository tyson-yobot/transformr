// =============================================================================
// TRANSFORMR -- AI Workout Coach Service (Module 12)
// =============================================================================

import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';

export interface WorkoutGenerationParams {
  userId: string;
  workout_type?: string;
  target_muscle_groups?: string[];
  available_equipment?: string[];
  time_limit_minutes?: number;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  injuries?: string[];
  focus?: 'hypertrophy' | 'strength' | 'endurance' | 'power' | 'conditioning';
}

export interface GeneratedExercise {
  exercise: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  rpe?: number;
  weight_suggestion?: string;
  notes?: string;
  duration_seconds?: number;
}

export interface GeneratedWorkout {
  workout_name: string;
  estimated_duration_minutes: number;
  warmup: GeneratedExercise[];
  main_work: GeneratedExercise[];
  finisher: GeneratedExercise[];
  cooldown: GeneratedExercise[];
  coaching_notes: string[];
  next_session_suggestion: string;
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
}

export interface PostWorkoutAnalysis {
  overall_rating: string;
  summary: string;
  volume_analysis: string;
  intensity_notes: string;
  progressive_overload: string;
  recovery_recommendation: string;
  nutrition_window: string;
  next_workout_suggestion: string;
  highlights: string[];
  areas_to_improve: string[];
  tokens_in: number;
  tokens_out: number;
}

export async function generateWorkout(
  params: WorkoutGenerationParams,
): Promise<GeneratedWorkout> {
  const userContext: UserAIContext | null = await buildUserAIContext(params.userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-workout-coach', {
    body: { ...params, userContext },
  });

  if (error) throw error;
  return data as GeneratedWorkout;
}

export async function analyzePostWorkout(
  userId: string,
  sessionId: string,
): Promise<PostWorkoutAnalysis> {
  const userContext: UserAIContext | null = await buildUserAIContext(userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-post-workout', {
    body: { session_id: sessionId, userContext },
  });

  if (error) throw error;
  return data as PostWorkoutAnalysis;
}

export interface CoachingTipParams {
  userId: string;
  exerciseName: string;
  setsCompleted: number;
  totalVolume: number;
  elapsedMinutes: number;
  recentWeights: number[];
  recentReps: number[];
}

export interface CoachingTipResponse {
  tip: string;
  tokens_in: number;
  tokens_out: number;
}

export async function getMidWorkoutCoachingTip(
  params: CoachingTipParams,
): Promise<CoachingTipResponse> {
  const userContext: UserAIContext | null = await buildUserAIContext(params.userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-workout-coach', {
    body: {
      mode: 'coaching_tip',
      exercise_name: params.exerciseName,
      sets_completed: params.setsCompleted,
      total_volume: params.totalVolume,
      elapsed_minutes: params.elapsedMinutes,
      recent_weights: params.recentWeights,
      recent_reps: params.recentReps,
      userContext,
    },
  });

  if (error) throw error;
  return data as CoachingTipResponse;
}
