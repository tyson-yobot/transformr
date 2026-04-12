// =============================================================================
// TRANSFORMR -- AI Workout Coach Service (Module 12)
// =============================================================================

import { supabase } from '@services/supabase';

export interface WorkoutGenerationParams {
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
  const { data, error } = await supabase.functions.invoke('ai-workout-coach', {
    body: params,
  });

  if (error) throw error;
  return data as GeneratedWorkout;
}

export async function analyzePostWorkout(
  sessionId: string,
): Promise<PostWorkoutAnalysis> {
  const { data, error } = await supabase.functions.invoke('ai-post-workout', {
    body: { session_id: sessionId },
  });

  if (error) throw error;
  return data as PostWorkoutAnalysis;
}
