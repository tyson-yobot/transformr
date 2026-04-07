import { Audio } from 'expo-av';

type VoiceCommand =
  | { action: 'log_weight'; weight: number }
  | { action: 'log_water'; oz: number }
  | { action: 'start_workout'; templateName?: string }
  | { action: 'log_set'; weight: number; reps: number }
  | { action: 'complete_workout' }
  | { action: 'log_food'; foodName: string; quantity?: number }
  | { action: 'start_timer'; minutes: number }
  | { action: 'complete_habit'; habitName: string }
  | { action: 'log_mood'; mood: number }
  | { action: 'unknown'; rawText: string };

// Simple keyword-based voice command parser
// In production, this would use AI for natural language understanding
export function parseVoiceCommand(text: string): VoiceCommand {
  const lower = text.toLowerCase().trim();

  // Weight logging
  const weightMatch = lower.match(/(?:log|record|i weigh|weight)\s*(\d+\.?\d*)\s*(?:pounds|lbs|lb)?/);
  if (weightMatch?.[1]) {
    return { action: 'log_weight', weight: parseFloat(weightMatch[1]) };
  }

  // Water logging
  const waterMatch = lower.match(/(?:log|drink|drank|had)\s*(\d+)\s*(?:oz|ounces|cups?)/);
  if (waterMatch?.[1]) {
    const oz = lower.includes('cup') ? parseInt(waterMatch[1]) * 8 : parseInt(waterMatch[1]);
    return { action: 'log_water', oz };
  }

  // Start workout
  if (lower.includes('start workout') || lower.includes('begin workout')) {
    const nameMatch = lower.match(/(?:start|begin)\s+(?:workout\s+)?(.+)/);
    return { action: 'start_workout', templateName: nameMatch?.[1] };
  }

  // Log set
  const setMatch = lower.match(/(\d+\.?\d*)\s*(?:pounds?|lbs?)\s*(?:for|x|times)\s*(\d+)\s*(?:reps?)?/);
  if (setMatch?.[1] && setMatch[2]) {
    return { action: 'log_set', weight: parseFloat(setMatch[1]), reps: parseInt(setMatch[2]) };
  }

  // Complete workout
  if (lower.includes('finish workout') || lower.includes('complete workout') || lower.includes('done workout')) {
    return { action: 'complete_workout' };
  }

  // Food logging
  const foodMatch = lower.match(/(?:log|ate|had|eat)\s+(?:(\d+)\s+)?(.+)/);
  if (foodMatch) {
    return {
      action: 'log_food',
      foodName: foodMatch[2] ?? '',
      quantity: foodMatch[1] ? parseInt(foodMatch[1]) : undefined,
    };
  }

  // Timer
  const timerMatch = lower.match(/(?:set|start)\s*(?:timer|rest)\s*(?:for)?\s*(\d+)\s*(?:min|minute|second|sec)/);
  if (timerMatch?.[1]) {
    const minutes = lower.includes('sec') ? parseInt(timerMatch[1]) / 60 : parseInt(timerMatch[1]);
    return { action: 'start_timer', minutes };
  }

  // Mood
  const moodMatch = lower.match(/(?:mood|feeling)\s*(?:is)?\s*(\d+)/);
  if (moodMatch?.[1]) {
    return { action: 'log_mood', mood: parseInt(moodMatch[1]) };
  }

  // Complete habit
  if (lower.includes('complete') || lower.includes('done with') || lower.includes('finished')) {
    const habitName = lower.replace(/(?:complete|done with|finished)\s+/, '');
    return { action: 'complete_habit', habitName };
  }

  return { action: 'unknown', rawText: text };
}

let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<void> {
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording: newRecording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  recording = newRecording;
}

export async function stopRecording(): Promise<string | null> {
  if (!recording) return null;

  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const uri = recording.getURI();
  recording = null;
  return uri;
}

export function isRecording(): boolean {
  return recording !== null;
}
