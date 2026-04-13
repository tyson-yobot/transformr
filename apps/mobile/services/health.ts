// =============================================================================
// TRANSFORMR -- Health Platform Service (Module 9)
// Unified facade for Apple Health (iOS) and Google Health Connect (Android).
// All methods fail gracefully — returns empty arrays/null on any error so
// the app functions normally on emulators and unsupported platforms.
// =============================================================================

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface HeartRateReading {
  timestamp: string;
  bpm: number;
}

export interface SleepRecord {
  date: string;
  durationHours: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface WeightRecord {
  date: string;
  kg: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.45359237 * 100) / 100;
}

function sleepQuality(hours: number): SleepRecord['quality'] {
  if (hours < 5) return 'poor';
  if (hours < 6.5) return 'fair';
  if (hours < 8.5) return 'good';
  return 'excellent';
}

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
}

function todayISO(): string {
  return new Date().toISOString();
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0]!;
}

// ---------------------------------------------------------------------------
// isHealthAvailable
// ---------------------------------------------------------------------------

/**
 * Returns true if the native health platform is accessible on this device.
 * Returns false for web/emulator/unsupported platforms without throwing.
 */
export async function isHealthAvailable(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const { isAvailable } = await import('@services/health/appleHealth');
      return isAvailable();
    }
    if (Platform.OS === 'android') {
      const { isAvailable } = await import('@services/health/googleHealth');
      return isAvailable();
    }
    return false;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// requestHealthPermissions
// ---------------------------------------------------------------------------

/**
 * Requests read permissions for steps, heart rate, sleep, active energy,
 * HRV (iOS only), and weight. Returns true if any permission was granted.
 */
export async function requestHealthPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const { requestPermissions } = await import('@services/health/appleHealth');
      return requestPermissions();
    }
    if (Platform.OS === 'android') {
      const { requestPermissions } = await import('@services/health/googleHealth');
      return requestPermissions();
    }
    return false;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// fetchTodaySteps
// ---------------------------------------------------------------------------

/** Returns today's step count. Returns 0 if unavailable. */
export async function fetchTodaySteps(): Promise<number> {
  try {
    const today = todayDateString();
    const startDate = `${today}T00:00:00.000Z`;
    const endDate = todayISO();

    if (Platform.OS === 'ios') {
      const { getSteps } = await import('@services/health/appleHealth');
      return getSteps(startDate, endDate);
    }
    if (Platform.OS === 'android') {
      const { getSteps } = await import('@services/health/googleHealth');
      return getSteps(startDate, endDate);
    }
    return 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// fetchHeartRateData
// ---------------------------------------------------------------------------

/**
 * Returns recent heart rate readings as `{ timestamp, bpm }` pairs.
 * @param days - How many days of history to fetch (default 7)
 */
export async function fetchHeartRateData(
  days = 7,
): Promise<HeartRateReading[]> {
  try {
    const startDate = daysAgoISO(days);
    const endDate = todayISO();

    if (Platform.OS === 'ios') {
      const { getHeartRateSamples } = await import('@services/health/appleHealth');
      const samples = await getHeartRateSamples(startDate, endDate);
      return samples.map((s) => ({
        timestamp: s.startDate,
        bpm: Math.round(s.value),
      }));
    }
    if (Platform.OS === 'android') {
      const { getHeartRateSamples } = await import('@services/health/googleHealth');
      const samples = await getHeartRateSamples(startDate, endDate);
      return samples.map((s) => ({
        timestamp: s.startDate,
        bpm: Math.round(s.value),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// fetchSleepData
// ---------------------------------------------------------------------------

/**
 * Returns sleep records for the past N days.
 * @param days - How many days of history to fetch (default 7)
 */
export async function fetchSleepData(days = 7): Promise<SleepRecord[]> {
  try {
    if (Platform.OS === 'ios') {
      const { getSleepSamples } = await import('@services/health/appleHealth');
      const startDate = daysAgoISO(days);
      const endDate = todayISO();
      const samples = await getSleepSamples(startDate, endDate);

      // Group sleep samples into per-night records by date
      const byDate = new Map<string, number>();
      for (const sample of samples) {
        if (sample.value === 'AWAKE' || sample.value === 'INBED') continue;
        const date = sample.startDate.split('T')[0]!;
        const durationMs =
          new Date(sample.endDate).getTime() -
          new Date(sample.startDate).getTime();
        const existing = byDate.get(date) ?? 0;
        byDate.set(date, existing + durationMs);
      }

      return [...byDate.entries()].map(([date, ms]) => {
        const durationHours = Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
        return { date, durationHours, quality: sleepQuality(durationHours) };
      });
    }

    if (Platform.OS === 'android') {
      // For Android, fetch per-day summaries
      const { getSleepHours } = await import('@services/health/googleHealth');
      const records: SleepRecord[] = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - i * 24 * 3600 * 1000)
          .toISOString()
          .split('T')[0]!;
        const startDate = `${date}T00:00:00.000Z`;
        const endDate = `${date}T23:59:59.999Z`;
        try {
          const durationHours = await getSleepHours(startDate, endDate);
          if (durationHours > 0) {
            records.push({
              date,
              durationHours,
              quality: sleepQuality(durationHours),
            });
          }
        } catch {
          // Skip this day
        }
      }
      return records;
    }

    return [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// fetchWeightHistory
// ---------------------------------------------------------------------------

/**
 * Returns weight records for the past N days in kg.
 * @param days - How many days of history to fetch (default 30)
 */
export async function fetchWeightHistory(_days = 30): Promise<WeightRecord[]> {
  try {
    // Both platforms currently only expose getLatestWeight.
    // We synthesize a single record from the most recent measurement.
    if (Platform.OS === 'ios') {
      const { getLatestWeight } = await import('@services/health/appleHealth');
      const weightLbs = await getLatestWeight();
      if (weightLbs === null) return [];
      return [
        {
          date: todayDateString(),
          kg: lbsToKg(weightLbs),
        },
      ];
    }

    if (Platform.OS === 'android') {
      const { getLatestWeight } = await import('@services/health/googleHealth');
      const weightLbs = await getLatestWeight();
      if (weightLbs === null) return [];
      return [
        {
          date: todayDateString(),
          kg: lbsToKg(weightLbs),
        },
      ];
    }

    return [];
  } catch {
    return [];
  }
}
