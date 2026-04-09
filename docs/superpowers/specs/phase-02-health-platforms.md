# Phase 02 -- Health Platform Integrations (Apple Health + Google Health Connect)

> **Superpower Module Design Specification**
> Status: Ready for Build | Priority: Phase 2

---

## Overview

Native health platform integration that reads biometric and activity data from Apple Health (iOS) and Google Health Connect (Android) into TRANSFORMR's existing tables, and writes TRANSFORMR-generated workout sessions and weight logs back out. Uses a unified Strategy pattern with platform-specific adapters so all consuming code is platform-agnostic. No new database tables. No new Edge Functions. Purely client-side.

---

## Architecture

- **Strategy pattern**: A single `HealthPlatformService` interface with two implementations -- `AppleHealthAdapter` (via `react-native-health`) and `GoogleHealthConnectAdapter` (via `react-native-health-connect`)
- **Factory function** selects the correct adapter at runtime based on `Platform.OS`
- **Data mapper** converts platform-specific data shapes into TRANSFORMR's existing database row types
- **Zustand store** tracks connection state, permissions, sync timestamps, and errors
- **Hook** composes the store with automatic foreground sync via `AppState` listener
- **Background sync** via `expo-background-fetch` for periodic updates when the app is not in the foreground
- **Bidirectional sync**: reads health data in, writes TRANSFORMR workouts and weight out

### Key Constraints

| Constraint | Detail |
|------------|--------|
| New database tables | **0** -- all data flows into existing `workout_sessions`, `weight_logs`, sleep columns, etc. |
| New Edge Functions | **0** -- purely client-side integration |
| New dependencies | `react-native-health` (iOS), `react-native-health-connect` (Android), `expo-background-fetch` |
| Offline behavior | Cached last-sync data persists via MMKV; sync resumes on next foreground |

---

## Dependencies to Install

```bash
# Apple Health (iOS only)
npm install react-native-health

# Google Health Connect (Android only)
npm install react-native-health-connect

# Background fetch (both platforms)
npx expo install expo-background-fetch expo-task-manager
```

> `expo-background-fetch` and `expo-task-manager` enable periodic background sync tasks registered with the OS task scheduler.

---

## TypeScript Types

Add to `types/health.ts`:

```typescript
// ---------------------------------------------------------------------------
// Platform identifiers
// ---------------------------------------------------------------------------

type HealthPlatformType = 'apple_health' | 'google_health_connect';

// ---------------------------------------------------------------------------
// Permission types
// ---------------------------------------------------------------------------

interface HealthPermission {
  dataType: HealthDataType;
  read: boolean;
  write: boolean;
}

type HealthDataType =
  | 'steps'
  | 'active_energy'
  | 'heart_rate'
  | 'resting_heart_rate'
  | 'hrv'
  | 'weight'
  | 'sleep'
  | 'workout';

// ---------------------------------------------------------------------------
// Normalized read models (platform-agnostic)
// ---------------------------------------------------------------------------

interface HealthWorkout {
  sourceId: string;           // platform-specific unique ID
  sourcePlatform: HealthPlatformType;
  activityType: string;       // normalized to TRANSFORMR activity types
  startDate: string;          // ISO 8601
  endDate: string;            // ISO 8601
  durationMinutes: number;
  caloriesBurned: number | null;
  distanceMeters: number | null;
  averageHeartRate: number | null;
  metadata: Record<string, unknown>;
}

interface HealthWeightEntry {
  sourceId: string;
  sourcePlatform: HealthPlatformType;
  weightLbs: number;
  recordedAt: string;         // ISO 8601
}

interface HealthSleepSession {
  sourceId: string;
  sourcePlatform: HealthPlatformType;
  startDate: string;
  endDate: string;
  totalMinutes: number;
  deepSleepMinutes: number | null;
  remSleepMinutes: number | null;
  lightSleepMinutes: number | null;
  awakeMinutes: number | null;
  sleepQuality: number | null; // derived 1-5 scale
}

interface HealthHeartRateSample {
  bpm: number;
  recordedAt: string;
  motionContext: 'resting' | 'active' | 'unknown';
}

interface HealthHRVSample {
  sdnn: number;               // SDNN in milliseconds
  recordedAt: string;
}

interface HealthStepsSummary {
  date: string;               // YYYY-MM-DD
  totalSteps: number;
}

interface HealthActiveEnergySummary {
  date: string;               // YYYY-MM-DD
  totalCalories: number;
}

interface HealthRestingHeartRate {
  bpm: number;
  date: string;               // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Sync result tracking
// ---------------------------------------------------------------------------

interface HealthSyncResult {
  platform: HealthPlatformType;
  syncedAt: string;
  workoutsImported: number;
  workoutsExported: number;
  weightEntriesImported: number;
  weightEntriesExported: number;
  sleepSessionsImported: number;
  heartRateSamplesImported: number;
  stepDaysImported: number;
  errors: HealthSyncError[];
}

interface HealthSyncError {
  dataType: HealthDataType;
  message: string;
  recoverable: boolean;
}

// ---------------------------------------------------------------------------
// Date range helper
// ---------------------------------------------------------------------------

interface HealthQueryOptions {
  startDate: string;          // ISO 8601
  endDate: string;            // ISO 8601
  limit?: number;
}
```

---

## Service Interface: `services/health/healthPlatformService.ts`

The core interface that both adapters implement, plus a factory function.

```typescript
import { Platform } from 'react-native';

export interface HealthPlatformService {
  /** Returns the platform type this adapter handles */
  readonly platform: HealthPlatformType;

  /** Check if the health platform SDK is available on this device */
  isAvailable(): Promise<boolean>;

  /** Request read/write permissions. Returns true if at least one permission was granted. */
  requestPermissions(): Promise<boolean>;

  /** Returns the current permission state for each data type */
  getPermissions(): Promise<HealthPermission[]>;

  /** Read workouts from the health platform */
  readWorkouts(options: HealthQueryOptions): Promise<HealthWorkout[]>;

  /** Read sleep sessions from the health platform */
  readSleep(options: HealthQueryOptions): Promise<HealthSleepSession[]>;

  /** Read weight entries from the health platform */
  readWeight(options: HealthQueryOptions): Promise<HealthWeightEntry[]>;

  /** Read heart rate samples from the health platform */
  readHeartRate(options: HealthQueryOptions): Promise<HealthHeartRateSample[]>;

  /** Read HRV samples from the health platform */
  readHRV(options: HealthQueryOptions): Promise<HealthHRVSample[]>;

  /** Read step count summaries (one per day) */
  readSteps(options: HealthQueryOptions): Promise<HealthStepsSummary[]>;

  /** Read active energy summaries (one per day) */
  readActiveEnergy(options: HealthQueryOptions): Promise<HealthActiveEnergySummary[]>;

  /** Read resting heart rate (one per day) */
  readRestingHeartRate(options: HealthQueryOptions): Promise<HealthRestingHeartRate[]>;

  /** Write a completed TRANSFORMR workout to the health platform */
  writeWorkout(workout: HealthWorkout): Promise<void>;

  /** Write a weight log entry to the health platform */
  writeWeight(entry: HealthWeightEntry): Promise<void>;

  /** Full bidirectional sync: read all data types in, write pending data out */
  syncAll(options: HealthQueryOptions): Promise<HealthSyncResult>;
}

/**
 * Factory: returns the correct adapter for the current platform, or null
 * if no health platform is available (e.g., Android without Health Connect).
 */
export async function createHealthPlatformService(): Promise<HealthPlatformService | null> {
  if (Platform.OS === 'ios') {
    const { AppleHealthAdapter } = await import('./appleHealthAdapter');
    const adapter = new AppleHealthAdapter();
    const available = await adapter.isAvailable();
    return available ? adapter : null;
  }

  if (Platform.OS === 'android') {
    const { GoogleHealthConnectAdapter } = await import('./googleHealthConnectAdapter');
    const adapter = new GoogleHealthConnectAdapter();
    const available = await adapter.isAvailable();
    return available ? adapter : null;
  }

  return null;
}
```

---

## Apple Health Adapter: `services/health/appleHealthAdapter.ts`

Implements `HealthPlatformService` using `react-native-health`.

### Permissions Requested

```typescript
const APPLE_HEALTH_PERMISSIONS = {
  read: [
    'StepCount',                    // HKQuantityTypeIdentifierStepCount
    'ActiveEnergyBurned',           // HKQuantityTypeIdentifierActiveEnergyBurned
    'HeartRate',                     // HKQuantityTypeIdentifierHeartRate
    'RestingHeartRate',              // HKQuantityTypeIdentifierRestingHeartRate
    'HeartRateVariability',          // HKQuantityTypeIdentifierHeartRateVariabilitySDNN
    'BodyMass',                      // HKQuantityTypeIdentifierBodyMass
    'SleepAnalysis',                 // HKCategoryTypeIdentifierSleepAnalysis
    'Workout',                       // HKWorkoutType
  ],
  write: [
    'BodyMass',
    'Workout',
  ],
};
```

### Implementation Notes

- `isAvailable()` -- calls `AppleHealthKit.isAvailable()`, returns `false` on Android or if HealthKit is not present
- `requestPermissions()` -- calls `AppleHealthKit.initHealthKit(permissions)`, wraps callback in Promise
- All read methods convert Apple HealthKit date formats (`YYYY-MM-DDTHH:mm:ss.SSSZ`) to ISO 8601
- Sleep stages mapped from `HKCategoryValueSleepAnalysis` enum: `InBed`, `AsleepUnspecified`, `AsleepCore` (light), `AsleepDeep`, `AsleepREM`, `Awake`
- Weight values from HealthKit arrive in pounds (when unit specified as `pound`) -- no conversion needed
- Workout types mapped via `HKWorkoutActivityType` enum to TRANSFORMR activity type strings
- Heart rate returned in BPM, HRV in ms (SDNN) -- both match TRANSFORMR's expected units
- `writeWorkout()` -- creates an `HKWorkout` sample with activity type, start/end dates, and energy burned
- `writeWeight()` -- creates an `HKQuantitySample` with `BodyMass` type

### Deduplication Strategy

- Each health platform record has a unique `sourceId`
- Before importing, query existing records by `source_health_id` column (see Data Mapper section)
- Skip any record whose `sourceId` already exists in TRANSFORMR's tables
- For exports, tag written records with `source: 'transformr'` metadata to avoid re-importing them

---

## Google Health Connect Adapter: `services/health/googleHealthConnectAdapter.ts`

Implements `HealthPlatformService` using `react-native-health-connect`.

### Permissions Requested

```typescript
const GOOGLE_HC_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'write', recordType: 'Weight' },
  { accessType: 'write', recordType: 'ExerciseSession' },
];
```

### Implementation Notes

- `isAvailable()` -- calls `getSdkStatus()` from `react-native-health-connect`, returns `true` only if `SDK_AVAILABLE`
- If `SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED`, the adapter can prompt the user to update Google Play Services
- `requestPermissions()` -- calls `requestPermission(GOOGLE_HC_PERMISSIONS)`
- All timestamps from Health Connect arrive as ISO 8601 strings -- no conversion needed
- Weight values arrive in kilograms -- convert to pounds via `kg * 2.20462`
- HRV from Health Connect uses RMSSD (not SDNN) -- store raw RMSSD and note the method in metadata
- Sleep stages mapped from Health Connect's `SleepSessionRecord.Stage`: `AWAKE`, `SLEEPING`, `OUT_OF_BED`, `LIGHT`, `DEEP`, `REM`
- Exercise session types mapped via `ExerciseSessionRecord.ExerciseType` constants to TRANSFORMR activity types

### Android Manifest

```xml
<!-- Required in android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.health.READ_STEPS" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE_VARIABILITY" />
<uses-permission android:name="android.permission.health.READ_RESTING_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED" />
<uses-permission android:name="android.permission.health.READ_WEIGHT" />
<uses-permission android:name="android.permission.health.READ_SLEEP" />
<uses-permission android:name="android.permission.health.READ_EXERCISE" />
<uses-permission android:name="android.permission.health.WRITE_WEIGHT" />
<uses-permission android:name="android.permission.health.WRITE_EXERCISE" />

<intent-filter>
  <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
</intent-filter>
```

### iOS Info.plist

```xml
<!-- Required in ios/Info.plist -->
<key>NSHealthShareUsageDescription</key>
<string>TRANSFORMR reads your health data to optimize your readiness score, track activity, and provide personalized coaching.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>TRANSFORMR writes your completed workouts and weight logs to keep your health data in sync.</string>
```

---

## Data Mapper: `services/health/healthDataMapper.ts`

Pure functions that convert normalized health platform data into TRANSFORMR's existing database row shapes. No Supabase calls -- the mapper only transforms data structures.

### Workout Mapping

```typescript
import { format } from 'date-fns';

/**
 * Maps a HealthWorkout from the platform adapter into the shape expected
 * by the `workout_sessions` table insert.
 */
export function mapHealthWorkoutToSession(
  workout: HealthWorkout,
  userId: string,
): WorkoutSessionInsert {
  return {
    user_id: userId,
    name: mapActivityTypeToName(workout.activityType),
    type: mapActivityTypeToCategory(workout.activityType),
    started_at: workout.startDate,
    completed_at: workout.endDate,
    duration_seconds: workout.durationMinutes * 60,
    calories_burned: workout.caloriesBurned,
    average_heart_rate: workout.averageHeartRate,
    source: 'health_platform',
    source_health_id: workout.sourceId,
    source_platform: workout.sourcePlatform,
    notes: `Imported from ${workout.sourcePlatform === 'apple_health' ? 'Apple Health' : 'Google Health Connect'}`,
  };
}

/**
 * Maps a TRANSFORMR workout session into a HealthWorkout for export
 * to the health platform.
 */
export function mapSessionToHealthWorkout(
  session: WorkoutSession,
): HealthWorkout {
  return {
    sourceId: session.id,
    sourcePlatform: 'apple_health', // overwritten by the adapter
    activityType: mapCategoryToActivityType(session.type),
    startDate: session.started_at,
    endDate: session.completed_at ?? session.started_at,
    durationMinutes: Math.round((session.duration_seconds ?? 0) / 60),
    caloriesBurned: session.calories_burned ?? null,
    distanceMeters: null,
    averageHeartRate: session.average_heart_rate ?? null,
    metadata: { transformr_session_id: session.id },
  };
}
```

### Weight Mapping

```typescript
export function mapHealthWeightToLog(
  entry: HealthWeightEntry,
  userId: string,
): WeightLogInsert {
  return {
    user_id: userId,
    weight_lbs: entry.weightLbs,
    logged_at: entry.recordedAt,
    source: 'health_platform',
    source_health_id: entry.sourceId,
    source_platform: entry.sourcePlatform,
  };
}

export function mapWeightLogToHealthEntry(
  log: WeightLog,
): HealthWeightEntry {
  return {
    sourceId: log.id,
    sourcePlatform: 'apple_health', // overwritten by the adapter
    weightLbs: log.weight_lbs,
    recordedAt: log.logged_at,
  };
}
```

### Sleep Mapping

```typescript
/**
 * Maps a HealthSleepSession into the format consumed by the readiness
 * score calculator. Does NOT write to a dedicated sleep table -- feeds
 * directly into the readiness computation.
 */
export function mapHealthSleepToReadinessInput(
  session: HealthSleepSession,
): { sleepHours: number; sleepQuality: number } {
  const sleepHours = session.totalMinutes / 60;

  // Derive quality 1-5 from stage breakdown
  let sleepQuality = 3; // default if no stage data
  if (session.deepSleepMinutes !== null && session.remSleepMinutes !== null) {
    const deepPct = session.deepSleepMinutes / session.totalMinutes;
    const remPct = session.remSleepMinutes / session.totalMinutes;
    const awakePct = (session.awakeMinutes ?? 0) / session.totalMinutes;

    // Ideal: ~20% deep, ~25% REM, <5% awake
    let qualityScore = 3;
    if (deepPct >= 0.18 && remPct >= 0.20) qualityScore += 1;
    if (deepPct >= 0.22 && remPct >= 0.25) qualityScore += 1;
    if (awakePct > 0.10) qualityScore -= 1;
    if (awakePct > 0.20) qualityScore -= 1;

    sleepQuality = Math.max(1, Math.min(5, qualityScore));
  }

  return { sleepHours, sleepQuality };
}
```

### Activity Type Mapping Tables

```typescript
const ACTIVITY_TYPE_MAP: Record<string, { name: string; category: string }> = {
  // Apple HealthKit workout types
  'HKWorkoutActivityTypeRunning': { name: 'Running', category: 'cardio' },
  'HKWorkoutActivityTypeCycling': { name: 'Cycling', category: 'cardio' },
  'HKWorkoutActivityTypeSwimming': { name: 'Swimming', category: 'cardio' },
  'HKWorkoutActivityTypeTraditionalStrengthTraining': { name: 'Strength Training', category: 'strength' },
  'HKWorkoutActivityTypeFunctionalStrengthTraining': { name: 'Functional Training', category: 'strength' },
  'HKWorkoutActivityTypeYoga': { name: 'Yoga', category: 'flexibility' },
  'HKWorkoutActivityTypeHighIntensityIntervalTraining': { name: 'HIIT', category: 'cardio' },
  'HKWorkoutActivityTypeWalking': { name: 'Walking', category: 'cardio' },
  'HKWorkoutActivityTypeElliptical': { name: 'Elliptical', category: 'cardio' },
  'HKWorkoutActivityTypeRowing': { name: 'Rowing', category: 'cardio' },
  'HKWorkoutActivityTypePilates': { name: 'Pilates', category: 'flexibility' },

  // Google Health Connect exercise types
  'EXERCISE_TYPE_RUNNING': { name: 'Running', category: 'cardio' },
  'EXERCISE_TYPE_BIKING': { name: 'Cycling', category: 'cardio' },
  'EXERCISE_TYPE_SWIMMING_POOL': { name: 'Swimming', category: 'cardio' },
  'EXERCISE_TYPE_SWIMMING_OPEN_WATER': { name: 'Swimming', category: 'cardio' },
  'EXERCISE_TYPE_WEIGHTLIFTING': { name: 'Strength Training', category: 'strength' },
  'EXERCISE_TYPE_YOGA': { name: 'Yoga', category: 'flexibility' },
  'EXERCISE_TYPE_HIKING': { name: 'Hiking', category: 'cardio' },
  'EXERCISE_TYPE_WALKING': { name: 'Walking', category: 'cardio' },
  'EXERCISE_TYPE_ELLIPTICAL': { name: 'Elliptical', category: 'cardio' },
  'EXERCISE_TYPE_ROWING_MACHINE': { name: 'Rowing', category: 'cardio' },
  'EXERCISE_TYPE_PILATES': { name: 'Pilates', category: 'flexibility' },
  'EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING': { name: 'HIIT', category: 'cardio' },
};

function mapActivityTypeToName(activityType: string): string {
  return ACTIVITY_TYPE_MAP[activityType]?.name ?? 'Other Workout';
}

function mapActivityTypeToCategory(activityType: string): string {
  return ACTIVITY_TYPE_MAP[activityType]?.category ?? 'other';
}
```

---

## Store: `stores/healthPlatformStore.ts`

Zustand store with MMKV persistence for connection state and sync metadata.

### State

| Field | Type | Persisted | Description |
|-------|------|-----------|-------------|
| `platform` | `HealthPlatformType \| null` | Yes | Detected platform, null if unavailable |
| `isConnected` | `boolean` | Yes | Whether the user has granted permissions |
| `permissions` | `HealthPermission[]` | Yes | Current permission grants per data type |
| `lastSyncAt` | `string \| null` | Yes | ISO timestamp of last successful sync |
| `isSyncing` | `boolean` | No | True while sync is in progress |
| `syncError` | `string \| null` | No | Error message from last failed sync |
| `lastSyncResult` | `HealthSyncResult \| null` | No | Detailed result of last sync |
| `todaySteps` | `number` | No | Today's step count from health platform |
| `todayActiveEnergy` | `number` | No | Today's active calories from health platform |
| `latestRestingHR` | `number \| null` | No | Most recent resting heart rate |
| `latestHRV` | `number \| null` | No | Most recent HRV (SDNN ms) |
| `latestSleep` | `HealthSleepSession \| null` | No | Most recent sleep session |

### Actions

| Action | Description |
|--------|-------------|
| `detectPlatform()` | Check `Platform.OS`, instantiate correct adapter, call `isAvailable()` |
| `requestPermissions()` | Request health platform permissions, update `permissions` and `isConnected` |
| `syncAll()` | Full bidirectional sync -- reads all data types, writes pending exports |
| `disconnect()` | Clear connection state, reset to defaults (does not revoke OS permissions) |
| `writeWorkout(session)` | Write a single completed workout to the health platform |
| `writeWeight(log)` | Write a single weight entry to the health platform |
| `refreshDashboardData()` | Quick read of today's steps + active energy only (for dashboard display) |
| `reset()` | Full state reset |

### Implementation Skeleton

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage'; // existing MMKV adapter
import { createHealthPlatformService, HealthPlatformService } from '@services/health/healthPlatformService';
import { subDays, startOfDay, endOfDay, formatISO } from 'date-fns';

interface HealthPlatformState {
  platform: HealthPlatformType | null;
  isConnected: boolean;
  permissions: HealthPermission[];
  lastSyncAt: string | null;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncResult: HealthSyncResult | null;
  todaySteps: number;
  todayActiveEnergy: number;
  latestRestingHR: number | null;
  latestHRV: number | null;
  latestSleep: HealthSleepSession | null;
}

interface HealthPlatformActions {
  detectPlatform: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  syncAll: () => Promise<void>;
  disconnect: () => void;
  writeWorkout: (session: WorkoutSession) => Promise<void>;
  writeWeight: (log: WeightLog) => Promise<void>;
  refreshDashboardData: () => Promise<void>;
  reset: () => void;
}

type HealthPlatformStore = HealthPlatformState & HealthPlatformActions;

// Service instance cached outside the store (not serializable)
let _service: HealthPlatformService | null = null;

const initialState: HealthPlatformState = {
  platform: null,
  isConnected: false,
  permissions: [],
  lastSyncAt: null,
  isSyncing: false,
  syncError: null,
  lastSyncResult: null,
  todaySteps: 0,
  todayActiveEnergy: 0,
  latestRestingHR: null,
  latestHRV: null,
  latestSleep: null,
};

export const useHealthPlatformStore = create<HealthPlatformStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      detectPlatform: async () => {
        _service = await createHealthPlatformService();
        set({ platform: _service?.platform ?? null });
      },

      requestPermissions: async () => {
        if (!_service) return false;
        const granted = await _service.requestPermissions();
        const permissions = await _service.getPermissions();
        set({ isConnected: granted, permissions });
        return granted;
      },

      syncAll: async () => {
        if (!_service || !get().isConnected || get().isSyncing) return;
        set({ isSyncing: true, syncError: null });
        try {
          const now = new Date();
          const result = await _service.syncAll({
            startDate: formatISO(subDays(now, 7)),
            endDate: formatISO(now),
          });
          set({
            isSyncing: false,
            lastSyncAt: formatISO(now),
            lastSyncResult: result,
          });
        } catch (error) {
          set({
            isSyncing: false,
            syncError: error instanceof Error ? error.message : 'Sync failed',
          });
        }
      },

      disconnect: () => {
        _service = null;
        set({ ...initialState });
      },

      writeWorkout: async (session: WorkoutSession) => {
        if (!_service || !get().isConnected) return;
        const healthWorkout = mapSessionToHealthWorkout(session);
        await _service.writeWorkout(healthWorkout);
      },

      writeWeight: async (log: WeightLog) => {
        if (!_service || !get().isConnected) return;
        const healthEntry = mapWeightLogToHealthEntry(log);
        await _service.writeWeight(healthEntry);
      },

      refreshDashboardData: async () => {
        if (!_service || !get().isConnected) return;
        const now = new Date();
        const todayStart = formatISO(startOfDay(now));
        const todayEnd = formatISO(endOfDay(now));
        const options = { startDate: todayStart, endDate: todayEnd };

        const [steps, energy, rhr, hrv, sleep] = await Promise.allSettled([
          _service.readSteps(options),
          _service.readActiveEnergy(options),
          _service.readRestingHeartRate(options),
          _service.readHRV({ startDate: formatISO(subDays(now, 1)), endDate: todayEnd }),
          _service.readSleep({ startDate: formatISO(subDays(now, 1)), endDate: todayEnd }),
        ]);

        set({
          todaySteps: steps.status === 'fulfilled' && steps.value.length > 0
            ? steps.value[0].totalSteps : get().todaySteps,
          todayActiveEnergy: energy.status === 'fulfilled' && energy.value.length > 0
            ? energy.value[0].totalCalories : get().todayActiveEnergy,
          latestRestingHR: rhr.status === 'fulfilled' && rhr.value.length > 0
            ? rhr.value[rhr.value.length - 1].bpm : get().latestRestingHR,
          latestHRV: hrv.status === 'fulfilled' && hrv.value.length > 0
            ? hrv.value[hrv.value.length - 1].sdnn : get().latestHRV,
          latestSleep: sleep.status === 'fulfilled' && sleep.value.length > 0
            ? sleep.value[sleep.value.length - 1] : get().latestSleep,
        });
      },

      reset: () => {
        _service = null;
        set(initialState);
      },
    }),
    {
      name: 'health-platform-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        platform: state.platform,
        isConnected: state.isConnected,
        permissions: state.permissions,
        lastSyncAt: state.lastSyncAt,
      }),
    },
  ),
);
```

---

## Hook: `hooks/useHealthPlatform.ts`

Composes the store with automatic foreground sync and background task registration.

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useHealthPlatformStore } from '@stores/healthPlatformStore';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_SYNC_TASK = 'TRANSFORMR_HEALTH_SYNC';
const FOREGROUND_SYNC_DEBOUNCE_MS = 30_000; // 30 seconds minimum between syncs

// Register the background task at module scope (required by expo-task-manager)
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  const { syncAll, isConnected } = useHealthPlatformStore.getState();
  if (!isConnected) return BackgroundFetch.BackgroundFetchResult.NoData;

  try {
    await syncAll();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export function useHealthPlatform() {
  const store = useHealthPlatformStore();
  const lastSyncRef = useRef<number>(0);

  // Detect platform on mount
  useEffect(() => {
    store.detectPlatform();
  }, []);

  // Auto-sync on foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && store.isConnected) {
        const now = Date.now();
        if (now - lastSyncRef.current > FOREGROUND_SYNC_DEBOUNCE_MS) {
          lastSyncRef.current = now;
          store.syncAll();
          store.refreshDashboardData();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [store.isConnected]);

  // Register background fetch
  useEffect(() => {
    if (!store.isConnected) return;

    const register = async () => {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
          minimumInterval: 15 * 60, // 15 minutes (iOS minimum)
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }
    };

    register();

    return () => {
      BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK).catch(() => {});
    };
  }, [store.isConnected]);

  // Convenience: connect flow (detect + request + initial sync)
  const connect = useCallback(async (): Promise<boolean> => {
    await store.detectPlatform();
    if (!store.platform) return false;
    const granted = await store.requestPermissions();
    if (granted) {
      await store.syncAll();
      await store.refreshDashboardData();
    }
    return granted;
  }, [store.platform]);

  return {
    // State
    platform: store.platform,
    isConnected: store.isConnected,
    permissions: store.permissions,
    lastSyncAt: store.lastSyncAt,
    isSyncing: store.isSyncing,
    syncError: store.syncError,
    lastSyncResult: store.lastSyncResult,
    todaySteps: store.todaySteps,
    todayActiveEnergy: store.todayActiveEnergy,
    latestRestingHR: store.latestRestingHR,
    latestHRV: store.latestHRV,
    latestSleep: store.latestSleep,

    // Actions
    connect,
    disconnect: store.disconnect,
    syncAll: store.syncAll,
    writeWorkout: store.writeWorkout,
    writeWeight: store.writeWeight,
    refreshDashboardData: store.refreshDashboardData,

    // Derived
    isAvailable: store.platform !== null,
    platformDisplayName: store.platform === 'apple_health'
      ? 'Apple Health'
      : store.platform === 'google_health_connect'
        ? 'Google Health Connect'
        : null,
  };
}
```

---

## Data Types to Sync

| Health Data | Direction | TRANSFORMR Target | Sync Strategy |
|-------------|-----------|-------------------|---------------|
| Workouts | Bi-directional | `workout_sessions` table | Dedupe by `source_health_id`; export on workout completion |
| Weight | Bi-directional | `weight_logs` table | Dedupe by `source_health_id`; export on weight log creation |
| Sleep | Read only | `useReadiness` hook input | Map stages to quality score, feed hours + quality into readiness |
| Heart Rate | Read only | Dashboard display, readiness | Latest samples for context |
| HRV (SDNN) | Read only | Readiness score enhancement | New readiness component (see below) |
| Steps | Read only | Dashboard display, activity tracking | Daily summary |
| Active Energy | Read only | TDEE calculation in `services/calculations/bmr.ts` | Daily summary |
| Resting Heart Rate | Read only | Readiness score enhancement | Latest daily reading |

---

## Readiness Score Enhancement

The existing readiness calculator in `services/calculations/readiness.ts` uses 5 components summing to 100 points. Health platform data introduces two new optional signal sources that refine existing components rather than adding new point buckets, keeping the max score at 100.

### Enhanced Readiness Input

```typescript
interface ReadinessInput {
  // Existing fields (unchanged)
  sleepHours: number | null;
  sleepQuality: number | null;
  moodScore: number | null;
  stressLevel: number | null;
  energyLevel: number | null;
  sorenessLevel: number | null;
  workoutsLast3Days: number;
  totalVolumeLast3Days: number;
  avgVolumePer3Days: number;

  // New optional health platform fields
  healthPlatformSleep: { sleepHours: number; sleepQuality: number } | null;
  healthPlatformHRV: number | null;       // SDNN in ms
  healthPlatformRestingHR: number | null;  // BPM
}
```

### How Health Data Integrates

**Sleep override**: If `healthPlatformSleep` is provided and the user has NOT manually logged sleep, use the health platform's `sleepHours` and `sleepQuality` instead of manual input. Manual input always takes priority -- the user's self-report is the ground truth.

**HRV signal** (modifies sleep component): When HRV data is available, apply a +/- 2 point adjustment to the sleep component:
- HRV > user's 30-day average by 10%+ --> +2 points (good recovery)
- HRV < user's 30-day average by 10%+ --> -2 points (poor recovery)
- Within 10% of average --> no adjustment

**Resting HR signal** (modifies energy component): When resting HR data is available, apply a +/- 2 point adjustment to the energy component:
- RHR > user's 30-day average by 5+ BPM --> -2 points (elevated, possible fatigue/illness)
- RHR < user's 30-day average by 3+ BPM --> +1 point (well recovered)
- Within normal range --> no adjustment

These adjustments are clamped so no individual component exceeds its maximum point allocation.

---

## Integration Points

### 1. Profile / Settings Screen

Add a "Health Platform" section to the existing profile settings screen at `app/(tabs)/profile/`.

```
[Health Platform]
  Connected to: Apple Health          [Disconnect]
  Last synced: 2 minutes ago          [Sync Now]
  Data shared: Workouts, Weight, Sleep, Heart Rate, Steps

  -- or, if not connected --

  [Connect Apple Health]
  Sync your workouts, sleep, weight, and activity data
```

- Show platform name dynamically based on detected platform
- List granted permissions as human-readable data type names
- "Sync Now" triggers `syncAll()` with loading spinner
- "Disconnect" calls `disconnect()` with confirmation alert

### 2. Dashboard Screen

On the dashboard at `app/(tabs)/dashboard.tsx`, display health platform data in the existing activity summary area:

- **Steps**: show `todaySteps` with a daily goal indicator (default 10,000)
- **Active Energy**: show `todayActiveEnergy` kcal
- **Resting HR / HRV**: show in readiness card if available
- All values update on foreground via `refreshDashboardData()`
- If health platform is not connected, show a subtle prompt card: "Connect Apple Health / Google Health Connect for deeper insights"

### 3. Post-Workout Write-Back

After a workout is marked as complete in the workout flow:

```typescript
// In the workout completion handler (existing code)
const onWorkoutComplete = async (session: WorkoutSession) => {
  // ... existing save logic ...

  // Write to health platform (fire-and-forget, never blocks completion)
  const { isConnected, writeWorkout } = useHealthPlatformStore.getState();
  if (isConnected) {
    writeWorkout(session).catch((err) => {
      console.warn('[HealthPlatform] Failed to export workout:', err.message);
    });
  }
};
```

### 4. Weight Log Write-Back

After a weight entry is saved:

```typescript
const onWeightLogged = async (log: WeightLog) => {
  // ... existing save logic ...

  const { isConnected, writeWeight } = useHealthPlatformStore.getState();
  if (isConnected) {
    writeWeight(log).catch((err) => {
      console.warn('[HealthPlatform] Failed to export weight:', err.message);
    });
  }
};
```

### 5. Readiness Score

The `useReadiness` hook at `hooks/useReadiness.ts` should incorporate health platform data:

```typescript
import { useHealthPlatformStore } from '@stores/healthPlatformStore';
import { mapHealthSleepToReadinessInput } from '@services/health/healthDataMapper';

export function useReadiness(input: UseReadinessInput) {
  const { latestSleep, latestHRV, latestRestingHR, isConnected } =
    useHealthPlatformStore();

  const enhancedInput = useMemo(() => {
    const base = { ...input };

    // Use health platform sleep if user hasn't manually logged
    if (isConnected && latestSleep && input.sleepHours === null) {
      const mapped = mapHealthSleepToReadinessInput(latestSleep);
      base.sleepHours = mapped.sleepHours;
      base.sleepQuality = mapped.sleepQuality;
    }

    return {
      ...base,
      healthPlatformSleep: isConnected && latestSleep
        ? mapHealthSleepToReadinessInput(latestSleep)
        : null,
      healthPlatformHRV: isConnected ? latestHRV : null,
      healthPlatformRestingHR: isConnected ? latestRestingHR : null,
    };
  }, [input, latestSleep, latestHRV, latestRestingHR, isConnected]);

  const readiness = useMemo(
    () => calculateReadinessScore(enhancedInput),
    [enhancedInput],
  );

  const emoji = useMemo(() => getReadinessEmoji(readiness.score), [readiness.score]);

  return { ...readiness, emoji };
}
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Platform not available (e.g., Android without Health Connect installed) | `isAvailable` returns `false`, health integration UI is hidden entirely |
| Health Connect needs update | Show prompt: "Google Health Connect needs to be updated" with deep link to Play Store |
| User denies all permissions | `isConnected` remains `false`, show "Permissions required" message with retry option |
| User grants partial permissions | `isConnected` set to `true`, sync only permitted data types, skip denied types silently |
| Sync fails (network, SDK error) | Set `syncError` with message, show last successful sync time, auto-retry on next foreground |
| Write-back fails (workout/weight export) | Log warning, never block the user's workflow, retry not queued (export will happen on next full sync) |
| Background fetch denied by OS | Falls back to foreground-only sync, no user-visible error |
| Data conversion error (unexpected format) | Skip the individual record, log error, continue processing remaining records |
| Duplicate detection fails | Worst case: duplicate record in TRANSFORMR table, harmless, user can delete manually |

---

## Background Sync

### `expo-background-fetch` Configuration

```typescript
// Registered in useHealthPlatform hook (see above)
// iOS: minimum interval ~15 minutes (OS discretionary)
// Android: minimum interval ~15 minutes (WorkManager)

// The background task:
// 1. Reads from health platform (last 24 hours)
// 2. Writes any pending TRANSFORMR workouts/weight not yet exported
// 3. Updates store state (persisted via MMKV)
// 4. Returns BackgroundFetchResult.NewData or .NoData
```

### Limitations

- iOS aggressively throttles background fetch -- actual interval may be 30+ minutes
- Android Doze mode may delay background tasks
- Background task has ~30 seconds to complete before the OS terminates it
- If sync takes too long, prioritize: steps > sleep > weight > workouts > heart rate

---

## Data Flow

```
App enters foreground
  -> AppState listener fires
  -> useHealthPlatform checks debounce (30s)
  -> syncAll()
    -> adapter.readWorkouts(last 7 days)
    -> healthDataMapper converts to WorkoutSessionInsert[]
    -> dedupe against existing workout_sessions by source_health_id
    -> insert new records via Supabase client
    -> adapter.readSleep(last 24 hours)
    -> map to readiness input, store in healthPlatformStore
    -> adapter.readWeight(last 7 days)
    -> dedupe + insert into weight_logs
    -> adapter.readSteps(today)
    -> store todaySteps
    -> adapter.readActiveEnergy(today)
    -> store todayActiveEnergy
    -> adapter.readHRV(last 24 hours)
    -> store latestHRV
    -> adapter.readRestingHeartRate(today)
    -> store latestRestingHR
  -> refreshDashboardData() updates UI-facing values
  -> readiness score recalculates with new health data

User completes workout
  -> save to workout_sessions (existing flow)
  -> writeWorkout() -> adapter.writeWorkout()
  -> workout appears in Apple Health / Google Health Connect

User logs weight
  -> save to weight_logs (existing flow)
  -> writeWeight() -> adapter.writeWeight()
  -> weight appears in Apple Health / Google Health Connect
```

---

## Build Sequence

| Step | Task | File(s) |
|------|------|---------|
| 1 | Install dependencies | `package.json` (add `react-native-health`, `react-native-health-connect`, `expo-background-fetch`, `expo-task-manager`) |
| 2 | TypeScript types | `apps/mobile/types/health.ts` |
| 3 | Health platform service interface + factory | `apps/mobile/services/health/healthPlatformService.ts` |
| 4 | Apple Health adapter | `apps/mobile/services/health/appleHealthAdapter.ts` |
| 5 | Google Health Connect adapter | `apps/mobile/services/health/googleHealthConnectAdapter.ts` |
| 6 | Data mapper (pure functions) | `apps/mobile/services/health/healthDataMapper.ts` |
| 7 | Zustand store | `apps/mobile/stores/healthPlatformStore.ts` |
| 8 | React hook with foreground + background sync | `apps/mobile/hooks/useHealthPlatform.ts` |
| 9 | Profile/settings screen integration | Modify `apps/mobile/app/(tabs)/profile/` settings screen |
| 10 | Dashboard integration (steps, energy, HR) | Modify `apps/mobile/app/(tabs)/dashboard.tsx` |
| 11 | Post-workout write-back | Modify workout completion handler |
| 12 | Weight log write-back | Modify weight log handler |
| 13 | Readiness score enhancement | Modify `apps/mobile/services/calculations/readiness.ts` + `apps/mobile/hooks/useReadiness.ts` |
| 14 | iOS Info.plist health descriptions | `ios/Info.plist` |
| 15 | Android manifest health permissions | `android/app/src/main/AndroidManifest.xml` |

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/mobile/types/health.ts` | All health platform TypeScript types |
| `apps/mobile/services/health/healthPlatformService.ts` | Interface + factory function |
| `apps/mobile/services/health/appleHealthAdapter.ts` | Apple Health implementation |
| `apps/mobile/services/health/googleHealthConnectAdapter.ts` | Google Health Connect implementation |
| `apps/mobile/services/health/healthDataMapper.ts` | Platform data to TRANSFORMR schema mapping |
| `apps/mobile/stores/healthPlatformStore.ts` | Zustand store for sync state |
| `apps/mobile/hooks/useHealthPlatform.ts` | Hook with auto-sync + background fetch |

## Files to Modify

| File | Change |
|------|--------|
| `apps/mobile/package.json` | Add `react-native-health`, `react-native-health-connect`, `expo-background-fetch`, `expo-task-manager` |
| `apps/mobile/services/calculations/readiness.ts` | Accept optional HRV, RHR, health platform sleep; apply +/- adjustments |
| `apps/mobile/hooks/useReadiness.ts` | Incorporate health platform store data into readiness input |
| `apps/mobile/app/(tabs)/profile/` | Add health platform connect/disconnect settings section |
| `apps/mobile/app/(tabs)/dashboard.tsx` | Display steps, active energy, resting HR from health platform |
| Workout completion handler | Add fire-and-forget `writeWorkout()` call |
| Weight log handler | Add fire-and-forget `writeWeight()` call |
| `ios/Info.plist` | Add `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` |
| `android/app/src/main/AndroidManifest.xml` | Add Health Connect permissions and intent filter |

---

## Critical Details

| Concern | Detail |
|---------|--------|
| No new tables | All imported data maps into existing `workout_sessions`, `weight_logs`, and store state |
| No new Edge Functions | Entire integration is client-side via native SDKs |
| Deduplication | `source_health_id` column on `workout_sessions` and `weight_logs` prevents duplicate imports |
| Manual data priority | User's manual logs always override health platform data (especially sleep for readiness) |
| Unit conversion | Google Health Connect weight arrives in kg, converted to lbs; Apple Health configured for lbs |
| HRV method difference | Apple Health uses SDNN, Google Health Connect uses RMSSD -- store raw value with method in metadata |
| Write-back safety | Exports tagged with `source: 'transformr'` metadata, filtered out on re-import to prevent loops |
| Background fetch limits | iOS minimum ~15 min, OS discretionary; Android via WorkManager, respects Doze mode |
| Permission granularity | App functions with any subset of permissions; denied data types are silently skipped |
| Security | No health data leaves the device except through existing Supabase writes to the user's own rows (RLS enforced) |
| Offline behavior | Last sync state persisted in MMKV; sync resumes on next foreground with connectivity |
| Error isolation | Health platform failures never block core app functionality (workout logging, nutrition, etc.) |
