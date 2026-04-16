/* eslint-disable import/no-unresolved -- react-native-health-connect is an optional native module */
// =============================================================================
// TRANSFORMR -- Google Health Connect Service (Module 9)
// Bridges Google Health Connect (Android) data into the app. Reads steps,
// heart rate, sleep, exercise sessions, and weight.
// =============================================================================

import { Platform } from 'react-native';
import type { DailySummary, HealthSample } from './appleHealth';

export type { DailySummary, HealthSample };

let HealthConnect: typeof import('react-native-health-connect') | null = null;

async function getHealthConnect(): Promise<typeof import('react-native-health-connect')> {
  if (Platform.OS !== 'android') {
    throw new Error('Health Connect is only available on Android');
  }
  if (!HealthConnect) {
    HealthConnect = await import('react-native-health-connect');
  }
  return HealthConnect;
}

export async function isAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const hc = await getHealthConnect();
    const result = await hc.getSdkStatus();
    return result === hc.SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

export async function requestPermissions(): Promise<boolean> {
  try {
    const hc = await getHealthConnect();
    await hc.initialize();
    const granted = await hc.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' },
      { accessType: 'read', recordType: 'Weight' },
      { accessType: 'read', recordType: 'ExerciseSession' },
    ]);
    return granted.length > 0;
  } catch {
    return false;
  }
}

export async function getSteps(
  startDate: string,
  endDate: string,
): Promise<number> {
  const hc = await getHealthConnect();
  const result = await hc.readRecords('Steps', {
    timeRangeFilter: {
      operator: 'between',
      startTime: startDate,
      endTime: endDate,
    },
  });
  return (result.records as { count: number }[]).reduce(
    (sum, r) => sum + r.count,
    0,
  );
}

export async function getHeartRateSamples(
  startDate: string,
  endDate: string,
): Promise<HealthSample[]> {
  const hc = await getHealthConnect();
  const result = await hc.readRecords('HeartRate', {
    timeRangeFilter: {
      operator: 'between',
      startTime: startDate,
      endTime: endDate,
    },
  });
  return (
    result.records as {
      startTime: string;
      endTime: string;
      samples: { beatsPerMinute: number }[];
    }[]
  ).flatMap((r) =>
    r.samples.map((s) => ({
      startDate: r.startTime,
      endDate: r.endTime,
      value: s.beatsPerMinute,
      unit: 'bpm',
      sourceName: 'Health Connect',
    })),
  );
}

export async function getSleepHours(
  startDate: string,
  endDate: string,
): Promise<number> {
  const hc = await getHealthConnect();
  const result = await hc.readRecords('SleepSession', {
    timeRangeFilter: {
      operator: 'between',
      startTime: startDate,
      endTime: endDate,
    },
  });
  const totalMs = (
    result.records as { startTime: string; endTime: string }[]
  ).reduce((sum, r) => {
    const start = new Date(r.startTime).getTime();
    const end = new Date(r.endTime).getTime();
    return sum + (end - start);
  }, 0);
  return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
}

export async function getLatestWeight(): Promise<number | null> {
  const hc = await getHealthConnect();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const result = await hc.readRecords('Weight', {
    timeRangeFilter: {
      operator: 'between',
      startTime: thirtyDaysAgo,
      endTime: new Date().toISOString(),
    },
  });
  const records = (result.records as unknown) as {
    weight: { inPounds: number };
  }[];
  if (records.length === 0) return null;
  const lastRecord = records[records.length - 1];
  return lastRecord ? lastRecord.weight.inPounds : null;
}

export async function getActiveCalories(
  startDate: string,
  endDate: string,
): Promise<number> {
  const hc = await getHealthConnect();
  const result = await hc.readRecords('TotalCaloriesBurned', {
    timeRangeFilter: {
      operator: 'between',
      startTime: startDate,
      endTime: endDate,
    },
  });
  return (
    (result.records as unknown) as { energy: { inKilocalories: number } }[]
  ).reduce((sum, r) => sum + r.energy.inKilocalories, 0);
}

export async function getDailySummary(date: string): Promise<DailySummary> {
  const startDate = `${date}T00:00:00.000Z`;
  const endDate = `${date}T23:59:59.999Z`;

  const [steps, activeCalories, heartRates, sleepHours, weight] =
    await Promise.all([
      getSteps(startDate, endDate).catch(() => 0),
      getActiveCalories(startDate, endDate).catch(() => 0),
      getHeartRateSamples(startDate, endDate).catch(() => [] as HealthSample[]),
      getSleepHours(startDate, endDate).catch(() => 0),
      getLatestWeight().catch(() => null),
    ]);

  const restingHR =
    heartRates.length > 0
      ? Math.min(...heartRates.map((hr) => hr.value))
      : null;

  return {
    date,
    steps,
    activeCalories,
    restingHeartRate: restingHR,
    sleepHours,
    weight,
  };
}
