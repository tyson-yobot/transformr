/* eslint-disable import/no-unresolved -- react-native-health is an optional native module */
// =============================================================================
// TRANSFORMR -- Apple Health Integration Service (Module 9)
// Bridges Apple HealthKit data into the app. Reads steps, heart rate, sleep,
// workouts, and weight. Writes workout sessions back to HealthKit.
// =============================================================================

import { Platform } from 'react-native';

// Types for health data
export interface HealthSample {
  startDate: string;
  endDate: string;
  value: number;
  unit: string;
  sourceName: string;
}

export interface HealthWorkout {
  startDate: string;
  endDate: string;
  activityType: string;
  totalEnergyBurned: number;
  totalDistance: number;
  sourceName: string;
}

export interface HealthSleepSample {
  startDate: string;
  endDate: string;
  value: 'ASLEEP' | 'INBED' | 'AWAKE' | 'CORE' | 'DEEP' | 'REM';
  sourceName: string;
}

export interface DailySummary {
  date: string;
  steps: number;
  activeCalories: number;
  restingHeartRate: number | null;
  sleepHours: number;
  weight: number | null;
}

let AppleHealthKit: typeof import('react-native-health') | null = null;

async function getHealthKit(): Promise<typeof import('react-native-health')> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple HealthKit is only available on iOS');
  }
  if (!AppleHealthKit) {
    AppleHealthKit = await import('react-native-health');
  }
  return AppleHealthKit;
}

export async function isAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const hk = await getHealthKit();
    return new Promise((resolve) => {
      hk.default.isAvailable((err: Error | null, available: boolean) => {
        resolve(!err && available);
      });
    });
  } catch {
    return false;
  }
}

export async function requestPermissions(): Promise<boolean> {
  try {
    const hk = await getHealthKit();
    const permissions = {
      permissions: {
        read: [
          hk.default.Constants.Permissions.StepCount,
          hk.default.Constants.Permissions.HeartRate,
          hk.default.Constants.Permissions.ActiveEnergyBurned,
          hk.default.Constants.Permissions.SleepAnalysis,
          hk.default.Constants.Permissions.Weight,
          hk.default.Constants.Permissions.Workout,
        ],
        write: [hk.default.Constants.Permissions.Workout],
      },
    };

    return new Promise((resolve) => {
      hk.default.initHealthKit(permissions, (err: string) => {
        resolve(!err);
      });
    });
  } catch {
    return false;
  }
}

export async function getSteps(
  startDate: string,
  endDate: string,
): Promise<number> {
  const hk = await getHealthKit();
  return new Promise((resolve, reject) => {
    hk.default.getStepCount(
      { date: endDate, startDate },
      (err: string, result: { value: number }) => {
        if (err) return reject(new Error(err));
        resolve(result.value);
      },
    );
  });
}

export async function getHeartRateSamples(
  startDate: string,
  endDate: string,
): Promise<HealthSample[]> {
  const hk = await getHealthKit();
  return new Promise((resolve, reject) => {
    hk.default.getHeartRateSamples(
      { startDate, endDate, ascending: false, limit: 100 },
      (err: string, results: HealthSample[]) => {
        if (err) return reject(new Error(err));
        resolve(results);
      },
    );
  });
}

export async function getSleepSamples(
  startDate: string,
  endDate: string,
): Promise<HealthSleepSample[]> {
  const hk = await getHealthKit();
  return new Promise((resolve, reject) => {
    hk.default.getSleepSamples(
      { startDate, endDate, ascending: false, limit: 50 },
      (err: string, results: HealthSleepSample[]) => {
        if (err) return reject(new Error(err));
        resolve(results);
      },
    );
  });
}

export async function getLatestWeight(): Promise<number | null> {
  const hk = await getHealthKit();
  return new Promise((resolve) => {
    hk.default.getLatestWeight(
      { unit: 'pound' },
      (err: string, result: { value: number }) => {
        if (err) return resolve(null);
        resolve(result.value);
      },
    );
  });
}

export async function getActiveCalories(
  startDate: string,
  endDate: string,
): Promise<number> {
  const hk = await getHealthKit();
  return new Promise((resolve, reject) => {
    hk.default.getActiveEnergyBurned(
      { startDate, endDate },
      (err: string, results: { value: number }[]) => {
        if (err) return reject(new Error(err));
        const total = results.reduce((sum, r) => sum + r.value, 0);
        resolve(total);
      },
    );
  });
}

export async function getDailySummary(date: string): Promise<DailySummary> {
  const startDate = `${date}T00:00:00.000Z`;
  const endDate = `${date}T23:59:59.999Z`;

  const [steps, activeCalories, heartRates, sleepSamples, weight] =
    await Promise.all([
      getSteps(startDate, endDate).catch(() => 0),
      getActiveCalories(startDate, endDate).catch(() => 0),
      getHeartRateSamples(startDate, endDate).catch(() => [] as HealthSample[]),
      getSleepSamples(startDate, endDate).catch(() => [] as HealthSleepSample[]),
      getLatestWeight().catch(() => null),
    ]);

  const restingHR =
    heartRates.length > 0
      ? Math.min(...heartRates.map((hr) => hr.value))
      : null;

  const sleepMs = sleepSamples
    .filter((s) => s.value !== 'AWAKE' && s.value !== 'INBED')
    .reduce((sum, s) => {
      const start = new Date(s.startDate).getTime();
      const end = new Date(s.endDate).getTime();
      return sum + (end - start);
    }, 0);
  const sleepHours = sleepMs / (1000 * 60 * 60);

  return {
    date,
    steps,
    activeCalories,
    restingHeartRate: restingHR,
    sleepHours: Math.round(sleepHours * 10) / 10,
    weight,
  };
}
