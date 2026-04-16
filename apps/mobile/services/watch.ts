// eslint-disable-next-line import/no-unresolved -- optional native module, installed at build time
import { sendMessage, watchEvents, getReachability } from 'react-native-watch-connectivity';
import type { WatchMessage } from 'react-native-watch-connectivity';

interface WatchWorkoutData {
  exerciseName: string;
  setNumber: number;
  targetReps: string;
  targetWeight: number;
  restSeconds: number;
}

interface WatchMacroData {
  calories: { consumed: number; target: number };
  protein: { consumed: number; target: number };
  carbs: { consumed: number; target: number };
  fat: { consumed: number; target: number };
  water: { consumed: number; target: number };
}

export async function isWatchReachable(): Promise<boolean> {
  try {
    const reachable = await getReachability();
    return reachable;
  } catch {
    return false;
  }
}

export function sendWorkoutDataToWatch(data: WatchWorkoutData): void {
  sendMessage(
    { type: 'workout_update', ...data },
    () => {},
    () => {},
  );
}

export function sendMacroDataToWatch(data: WatchMacroData): void {
  sendMessage(
    {
      type: 'macro_update',
      caloriesConsumed: data.calories.consumed,
      caloriesTarget: data.calories.target,
      proteinConsumed: data.protein.consumed,
      proteinTarget: data.protein.target,
      carbsConsumed: data.carbs.consumed,
      carbsTarget: data.carbs.target,
      fatConsumed: data.fat.consumed,
      fatTarget: data.fat.target,
      waterConsumed: data.water.consumed,
      waterTarget: data.water.target,
    },
    () => {},
    () => {},
  );
}

export function sendRestTimerToWatch(seconds: number): void {
  sendMessage(
    { type: 'rest_timer', seconds },
    () => {},
    () => {},
  );
}

export function sendStreakToWatch(streak: number): void {
  sendMessage(
    { type: 'streak_update', streak },
    () => {},
    () => {},
  );
}

export function sendReadinessToWatch(score: number, recommendation: string): void {
  sendMessage(
    { type: 'readiness_update', score, recommendation },
    () => {},
    () => {},
  );
}

type WatchMessageHandler = (message: WatchMessage) => void;

export function listenForWatchMessages(handler: WatchMessageHandler): () => void {
  const unsubscribe = watchEvents.on('message', handler);
  return () => unsubscribe();
}

// Watch can send back:
// - Set logged (weight, reps) from watch
// - Rest timer completed
// - Water logged from watch
// - Workout completed from watch
export function handleWatchMessage(message: WatchMessage) {
  const type = message.type as string;

  switch (type) {
    case 'set_logged':
      return {
        action: 'log_set' as const,
        weight: message.weight as number,
        reps: message.reps as number,
      };
    case 'rest_complete':
      return { action: 'rest_complete' as const };
    case 'water_logged':
      return { action: 'log_water' as const, oz: message.oz as number };
    case 'workout_complete':
      return { action: 'complete_workout' as const };
    default:
      return null;
  }
}
