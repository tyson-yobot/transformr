// =============================================================================
// TRANSFORMR — Workout Narrator Service
//
// Two responsibilities:
//   1. generateNarration — calls the workout-narrator edge function for AI cues
//   2. speak / stopSpeaking / isSpeaking — TTS helpers (expo-speech wrappers)
//
// Every call to generateNarration is preceded by buildUserAIContext() as required
// by the TRANSFORMR AI compliance contract.
// =============================================================================

import * as Speech from 'expo-speech';
import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';

// ---------------------------------------------------------------------------
// Types — NarrationInput / NarrationResult
// ---------------------------------------------------------------------------

export type NarrationEventType =
  | 'set_completed'
  | 'pr_detected'
  | 'rest_started'
  | 'workout_started'
  | 'workout_completed';

export interface NarrationInput {
  userId: string;
  eventType: NarrationEventType;
  /** Serialisable workout context for the current event */
  eventContext: Record<string, string | number | boolean>;
  /** Today's readiness score (0-100); drives speech rate */
  readinessScore: number;
}

export interface NarrationResult {
  /** Text to display in NarratorCard and speak via TTS */
  text: string;
  /** Readiness-adaptive TTS rate: low readiness → slower speech */
  speechRate: number;
  /** Approximate audio duration in milliseconds (estimate based on word count) */
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Edge function request/response mirror types
// ---------------------------------------------------------------------------

type CoachingTone = 'drill_sergeant' | 'motivational' | 'balanced' | 'calm';
type TipType = 'form' | 'motivation' | 'adjustment' | 'pr_celebration' | 'rest_timing';

interface NarratorEdgeRequest {
  sessionId: string;
  exerciseName: string;
  setNumber: number;
  repsCompleted: number;
  weightUsed: number;
  targetReps: number;
  targetWeight: number;
  previousSets: { reps: number; weight: number; rpe?: number }[];
  exercisePR?: number;
  coachingTone: CoachingTone;
}

interface NarratorEdgeResponse {
  narration: string;
  tipType: TipType;
  restSeconds: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readinessToSpeechRate(readinessScore: number): number {
  if (readinessScore < 40) return 0.85;
  if (readinessScore <= 70) return 0.95;
  return 1.05;
}

/** Rough estimate: average English word ≈ 350 ms at rate 1.0, scale by rate */
function estimateDurationMs(text: string, rate: number): number {
  const words = text.trim().split(/\s+/).length;
  return Math.round((words * 350) / rate);
}

function fallbackText(input: NarrationInput): string {
  switch (input.eventType) {
    case 'set_completed':
      return `Set logged. Rest up — you earned it.`;
    case 'pr_detected':
      return `New personal record! Outstanding work.`;
    case 'rest_started':
      return `Rest period started.`;
    case 'workout_started':
      return `Workout started. Let's make it count.`;
    case 'workout_completed':
      return `Workout complete. Great effort today.`;
  }
}

// ---------------------------------------------------------------------------
// generateNarration — primary export for the workout player
// ---------------------------------------------------------------------------

/**
 * Generate an AI narration cue for a workout event.
 *
 * For set_completed and pr_detected events the workout-narrator edge function
 * is called to produce a personalised coaching cue. For other events a
 * local fallback string is returned immediately (no network call needed).
 *
 * Never throws — returns a graceful fallback on any failure.
 */
export async function generateNarration(input: NarrationInput): Promise<NarrationResult> {
  const speechRate = readinessToSpeechRate(input.readinessScore);

  // For non-set events we skip the edge function call
  if (input.eventType !== 'set_completed' && input.eventType !== 'pr_detected') {
    const text = fallbackText(input);
    return { text, speechRate, durationMs: estimateDurationMs(text, speechRate) };
  }

  try {
    // Compliance contract: build user context before every AI call
    const userContext = await buildUserAIContext(input.userId).catch(() => null);

    const coachingTone: CoachingTone =
      (userContext?.profile.coachingTone as CoachingTone | undefined) ?? 'balanced';

    const ctx = input.eventContext;

    const body: NarratorEdgeRequest = {
      sessionId:    String(ctx.sessionId    ?? ''),
      exerciseName: String(ctx.exerciseName ?? ''),
      setNumber:    typeof ctx.setNumber    === 'number' ? ctx.setNumber    : 1,
      repsCompleted:typeof ctx.repsCompleted === 'number' ? ctx.repsCompleted : 0,
      weightUsed:   typeof ctx.weightUsed   === 'number' ? ctx.weightUsed   : 0,
      targetReps:   typeof ctx.targetReps   === 'number' ? ctx.targetReps   : 0,
      targetWeight: typeof ctx.targetWeight === 'number' ? ctx.targetWeight : 0,
      exercisePR:   typeof ctx.exercisePR   === 'number' ? ctx.exercisePR   : undefined,
      previousSets: [],   // Edge function derives from its own DB lookup; client sends empty array
      coachingTone,
    };

    const { data, error } = await supabase.functions.invoke<NarratorEdgeResponse>(
      'workout-narrator',
      { body },
    );

    if (error || !data?.narration) {
      throw new Error(error?.message ?? 'Empty response from workout-narrator');
    }

    const text = data.narration;
    return { text, speechRate, durationMs: estimateDurationMs(text, speechRate) };
  } catch (err) {
    console.warn('[Narrator] generateNarration failed — using fallback:', err);
    const text = fallbackText(input);
    return { text, speechRate, durationMs: estimateDurationMs(text, speechRate) };
  }
}

// ---------------------------------------------------------------------------
// TTS helpers (expo-speech wrappers)
// ---------------------------------------------------------------------------

interface NarratorOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
}

const DEFAULT_OPTIONS: NarratorOptions = {
  rate: 1.0,
  pitch: 1.0,
};

export function speak(text: string, options?: NarratorOptions): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  Speech.speak(text, {
    language: 'en-US',
    rate: opts.rate,
    pitch: opts.pitch,
    voice: opts.voice,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

export function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

// Workout narrator phrases (static — kept for callers that don't need AI)
export function narrateSetComplete(exerciseName: string, setNumber: number, reps: number, weight: number): void {
  speak(`Set ${setNumber} complete. ${reps} reps at ${weight} pounds on ${exerciseName}.`);
}

export function narrateRestStart(seconds: number): void {
  speak(`Rest for ${seconds} seconds.`);
}

export function narrateRestEnd(): void {
  speak("Time's up. Let's go!");
}

export function narratePR(exerciseName: string, recordType: string, value: number): void {
  const typeLabels: Record<string, string> = {
    max_weight: `${value} pounds`,
    max_reps: `${value} reps`,
    max_volume: `${value} pounds total volume`,
    max_1rm: `estimated one rep max of ${value} pounds`,
  };
  const label = typeLabels[recordType] ?? `${value}`;
  speak(`New personal record on ${exerciseName}! ${label}. Incredible work!`);
}

export function narrateWorkoutStart(workoutName: string): void {
  speak(`Starting ${workoutName}. Let's make it count.`);
}

export function narrateWorkoutComplete(duration: number, totalVolume: number, prs: number): void {
  const minutes = Math.round(duration);
  let message = `Workout complete in ${minutes} minutes. Total volume: ${Math.round(totalVolume)} pounds.`;
  if (prs > 0) {
    message += ` You hit ${prs} personal record${prs > 1 ? 's' : ''}! Beast mode.`;
  }
  speak(message);
}

export function narrateExerciseTransition(exerciseName: string, sets: number, reps: string): void {
  speak(`Next up: ${exerciseName}. ${sets} sets of ${reps}.`);
}

export function narrateMotivation(message: string): void {
  speak(message);
}
