import * as Speech from 'expo-speech';

interface NarratorOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
}

const DEFAULT_OPTIONS: NarratorOptions = {
  rate: 1.0,
  pitch: 1.0,
};

export function speak(text: string, options?: NarratorOptions) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  Speech.speak(text, {
    language: 'en-US',
    rate: opts.rate,
    pitch: opts.pitch,
    voice: opts.voice,
  });
}

export function stopSpeaking() {
  Speech.stop();
}

export function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

// Workout narrator phrases
export function narrateSetComplete(exerciseName: string, setNumber: number, reps: number, weight: number) {
  speak(`Set ${setNumber} complete. ${reps} reps at ${weight} pounds on ${exerciseName}.`);
}

export function narrateRestStart(seconds: number) {
  speak(`Rest for ${seconds} seconds.`);
}

export function narrateRestEnd() {
  speak("Time's up. Let's go!");
}

export function narratePR(exerciseName: string, recordType: string, value: number) {
  const typeLabels: Record<string, string> = {
    max_weight: `${value} pounds`,
    max_reps: `${value} reps`,
    max_volume: `${value} pounds total volume`,
    max_1rm: `estimated one rep max of ${value} pounds`,
  };
  const label = typeLabels[recordType] ?? `${value}`;
  speak(`New personal record on ${exerciseName}! ${label}. Incredible work!`);
}

export function narrateWorkoutStart(workoutName: string) {
  speak(`Starting ${workoutName}. Let's make it count.`);
}

export function narrateWorkoutComplete(duration: number, totalVolume: number, prs: number) {
  const minutes = Math.round(duration);
  let message = `Workout complete in ${minutes} minutes. Total volume: ${Math.round(totalVolume)} pounds.`;
  if (prs > 0) {
    message += ` You hit ${prs} personal record${prs > 1 ? 's' : ''}! Beast mode.`;
  }
  speak(message);
}

export function narrateExerciseTransition(exerciseName: string, sets: number, reps: string) {
  speak(`Next up: ${exerciseName}. ${sets} sets of ${reps}.`);
}

export function narrateMotivation(message: string) {
  speak(message);
}
