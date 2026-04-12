import { supabase } from '@services/supabase';

interface AdaptiveContext {
  userId: string;
  templateId: string;
  recentSessions: {
    date: string;
    exercises: {
      exerciseId: string;
      sets: { weight: number; reps: number; rpe: number | null }[];
    }[];
    readinessScore: number | null;
  }[];
  currentReadiness: number;
  painAreas: string[];
  goals: { direction: string; targetWeight: number };
}

interface AdaptiveResult {
  adjustedTemplate: {
    exerciseId: string;
    exerciseName: string;
    targetSets: number;
    targetReps: string;
    targetWeight: number;
    targetRpe: number;
    notes: string;
    reason: string;
  }[];
  overallNotes: string;
  adjustmentSummary: string;
}

export async function getAdaptiveProgram(
  context: AdaptiveContext,
): Promise<AdaptiveResult> {
  const { data, error } = await supabase.functions.invoke('ai-adaptive-program', {
    body: context,
  });

  if (error) throw error;
  return data as AdaptiveResult;
}
