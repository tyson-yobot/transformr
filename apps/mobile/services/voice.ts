import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
  AudioModule,
  type RecordingOptions,
} from 'expo-audio';
import type { AudioRecorder } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/services/supabase';

export type VoiceCommand =
  | { action: 'log_weight'; weight: number }
  | { action: 'log_water'; oz: number }
  | { action: 'start_workout'; templateName?: string }
  | { action: 'log_set'; weight: number; reps: number }
  | { action: 'complete_workout' }
  | { action: 'log_food'; foodName: string; quantity?: number }
  | { action: 'start_timer'; minutes: number }
  | { action: 'complete_habit'; habitName: string }
  | { action: 'log_mood'; mood: number }
  | { action: 'next_exercise' }
  | { action: 'prev_exercise' }
  | { action: 'start_rest_timer'; seconds?: number }
  | { action: 'end_workout' }
  | { action: 'swap_exercise'; exerciseName: string }
  | { action: 'check_macros' }
  | { action: 'log_supplement'; supplementName: string }
  | { action: 'log_measurement'; bodyPart: string; value: number; unit: string }
  | { action: 'check_habit_streak'; habitName?: string }
  | { action: 'start_focus' }
  | { action: 'end_focus' }
  | { action: 'check_readiness' }
  | { action: 'open_ai_chat' }
  | { action: 'unknown'; rawText: string };

export interface VoiceContext {
  userId: string;
  activeScreen:
    | 'workout_player'
    | 'nutrition'
    | 'habits'
    | 'mood'
    | 'journal'
    | 'body'
    | 'focus'
    | 'general';
  workoutContext?: {
    currentExercise?: string;
    lastSet?: { weight: number; reps: number };
  };
  nutritionContext?: {
    caloriesRemaining?: number;
    proteinRemaining?: number;
  };
}

export interface ParsedVoiceCommand {
  command: VoiceCommand;
  confidence: number;
  humanReadable: string;
}

// Simple keyword-based voice command parser — fast path, no network
export function parseVoiceCommand(text: string): ParsedVoiceCommand {
  const lower = text.toLowerCase().trim();

  // Weight logging
  const weightMatch = lower.match(/(?:log|record|i weigh|weight)\s*(\d+\.?\d*)\s*(?:pounds|lbs|lb)?/);
  if (weightMatch?.[1]) {
    return { command: { action: 'log_weight', weight: parseFloat(weightMatch[1]) }, confidence: 0.95, humanReadable: `Log weight: ${weightMatch[1]} lbs` };
  }

  // Water logging
  const waterMatch = lower.match(/(?:log|drink|drank|had)\s*(\d+)\s*(?:oz|ounces|cups?)/);
  if (waterMatch?.[1]) {
    const oz = lower.includes('cup') ? parseInt(waterMatch[1]) * 8 : parseInt(waterMatch[1]);
    return { command: { action: 'log_water', oz }, confidence: 0.95, humanReadable: `Log water: ${oz} oz` };
  }

  // Start workout
  if (lower.includes('start workout') || lower.includes('begin workout')) {
    const nameMatch = lower.match(/(?:start|begin)\s+(?:workout\s+)?(.+)/);
    return { command: { action: 'start_workout', templateName: nameMatch?.[1] }, confidence: 0.9, humanReadable: 'Start workout' };
  }

  // Log set — weight x reps
  const setMatch = lower.match(/(\d+\.?\d*)\s*(?:pounds?|lbs?)\s*(?:for|x|times)?\s*(\d+)\s*(?:reps?)?/);
  if (setMatch?.[1] && setMatch[2]) {
    return { command: { action: 'log_set', weight: parseFloat(setMatch[1]), reps: parseInt(setMatch[2]) }, confidence: 0.92, humanReadable: `Log set: ${setMatch[1]} lbs × ${setMatch[2]} reps` };
  }

  // Next / previous exercise
  if (lower.includes('next exercise') || lower.includes('skip exercise')) {
    return { command: { action: 'next_exercise' }, confidence: 0.9, humanReadable: 'Next exercise' };
  }
  if (lower.includes('previous exercise') || lower.includes('go back')) {
    return { command: { action: 'prev_exercise' }, confidence: 0.9, humanReadable: 'Previous exercise' };
  }

  // Rest timer
  const restMatch = lower.match(/(?:set|start|rest)\s*(?:timer|rest)?\s*(?:for)?\s*(\d+)\s*(?:min|minute|second|sec)?/);
  if (restMatch?.[1] && (lower.includes('rest') || lower.includes('timer'))) {
    const seconds = lower.includes('min') ? parseInt(restMatch[1]) * 60 : parseInt(restMatch[1]);
    return { command: { action: 'start_rest_timer', seconds }, confidence: 0.9, humanReadable: `Start rest timer: ${seconds}s` };
  }

  // Complete workout
  if (lower.includes('finish workout') || lower.includes('complete workout') || lower.includes('done workout') || lower.includes('end workout')) {
    return { command: { action: 'end_workout' }, confidence: 0.9, humanReadable: 'End workout' };
  }

  // Food logging
  if (lower.includes('log') || lower.includes('ate') || lower.includes('had') || lower.includes('eat') || lower.includes('add')) {
    const foodMatch = lower.match(/(?:log|ate|had|eat|add)\s+(?:(\d+)\s+(?:oz|grams?|g|servings?|cups?)?\s+)?(.+?)(?:\s+to\s+\w+)?$/);
    if (foodMatch?.[2]) {
      return { command: { action: 'log_food', foodName: foodMatch[2].trim(), quantity: foodMatch[1] ? parseInt(foodMatch[1]) : undefined }, confidence: 0.8, humanReadable: `Log food: ${foodMatch[2].trim()}` };
    }
  }

  // Mood
  const moodMatch = lower.match(/(?:mood|feeling)\s*(?:is)?\s*(\d+)/);
  if (moodMatch?.[1]) {
    return { command: { action: 'log_mood', mood: parseInt(moodMatch[1]) }, confidence: 0.9, humanReadable: `Log mood: ${moodMatch[1]}/10` };
  }

  // Macros
  if (lower.includes('macros') || lower.includes('how many calories') || lower.includes('calories left')) {
    return { command: { action: 'check_macros' }, confidence: 0.9, humanReadable: 'Check macros' };
  }

  // Habit completion
  if (lower.includes('complete') || lower.includes('done with') || lower.includes('finished')) {
    const habitName = lower.replace(/(?:complete|done with|finished)\s+/, '').trim();
    return { command: { action: 'complete_habit', habitName }, confidence: 0.8, humanReadable: `Complete habit: ${habitName}` };
  }

  return { command: { action: 'unknown', rawText: text }, confidence: 0, humanReadable: '' };
}

// AI-powered command parser — falls back to Claude NLU for ambiguous inputs
export async function parseVoiceCommandAI(
  transcript: string,
  context: VoiceContext,
): Promise<ParsedVoiceCommand> {
  // Fast path: local regex matching
  const localResult = parseVoiceCommand(transcript);
  if (localResult.confidence >= 0.85) return localResult;

  // Slow path: Claude NLU for ambiguous inputs
  try {
    const { data, error } = await supabase.functions.invoke('ai-voice-command', {
      body: {
        transcript,
        activeScreen: context.activeScreen,
        workoutContext: context.workoutContext ?? null,
        nutritionContext: context.nutritionContext ?? null,
      },
    });
    if (error || !data) return localResult;
    return data as ParsedVoiceCommand;
  } catch {
    return localResult;
  }
}

let recorder: AudioRecorder | null = null;

export async function startRecording(): Promise<void> {
  await requestRecordingPermissionsAsync();
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });

  const preset = RecordingPresets.HIGH_QUALITY as RecordingOptions;
  // eslint-disable-next-line import/namespace -- AudioRecorder is a runtime constructor on the native module
  const newRecorder: AudioRecorder = new AudioModule.AudioRecorder(preset);
  await newRecorder.prepareToRecordAsync();
  newRecorder.record();
  recorder = newRecorder;
}

export async function stopRecording(): Promise<string | null> {
  if (!recorder) return null;

  await recorder.stop();
  await setAudioModeAsync({ allowsRecording: false });

  const uri = recorder.uri;
  recorder = null;
  return uri;
}

export function isRecording(): boolean {
  return recorder !== null;
}

// Transcribe a recorded audio URI to text via the cloud transcription edge function
export async function transcribeAudio(audioUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: { audioBase64: base64, mimeType: 'audio/m4a' },
    });
    if (error || !data?.transcript) return '';
    return (data as { transcript: string }).transcript;
  } catch {
    return '';
  }
}
