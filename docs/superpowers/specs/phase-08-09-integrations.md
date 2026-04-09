# Phases 08-09 -- Wearable & App Integrations

## Overview

A hub-and-spoke integration architecture connects TRANSFORMR to wearable devices (Garmin, Whoop, Oura, Fitbit, Samsung Health), fitness platforms (Strava), calendars (Google Calendar, Apple Calendar), and nutrition sources (USDA, Nutritionix, OpenFoodFacts, MyFitnessPal CSV import). All external data passes through a normalized intermediate layer before entering the app's core domain models.

---

## Architecture: Hub-and-Spoke with Normalized Intermediate Layer

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Garmin  │  │  Whoop   │  │  Oura    │  │  Fitbit  │  │ Samsung  │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │             │
     ▼             ▼             ▼             ▼             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Provider Normalizers                          │
│  garminNormalizer.ts | whoopNormalizer.ts | ouraNormalizer.ts    │
│  fitbitNormalizer.ts | samsungNormalizer.ts                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              Normalized Intermediate Types                       │
│  NormalizedActivity | NormalizedSleep | NormalizedDailySummary   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Sync Engine                                   │
│  Conflict resolution, dedup, upsert to core tables              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database

### 7 New Tables

#### `wearable_connections`

```sql
CREATE TABLE wearable_connections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider          text NOT NULL,          -- 'garmin', 'whoop', 'oura', 'fitbit', 'samsung', 'strava', 'google_calendar'
  access_token_enc  text NOT NULL,          -- encrypted at rest via pgcrypto
  refresh_token_enc text,
  token_expires_at  timestamptz,
  provider_user_id  text,
  scopes            text[],
  webhook_id        text,                   -- provider-side webhook registration ID
  is_active         boolean NOT NULL DEFAULT true,
  connected_at      timestamptz NOT NULL DEFAULT now(),
  last_sync_at      timestamptz,
  UNIQUE (user_id, provider)
);
```

#### `wearable_sync_log`

```sql
CREATE TABLE wearable_sync_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   uuid REFERENCES wearable_connections(id) ON DELETE CASCADE NOT NULL,
  sync_type       text NOT NULL,            -- 'webhook', 'poll', 'manual', 'backfill'
  status          text NOT NULL,            -- 'started', 'completed', 'failed'
  records_synced  integer DEFAULT 0,
  error_message   text,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);
```

#### `wearable_daily_summaries`

```sql
CREATE TABLE wearable_daily_summaries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider        text NOT NULL,
  date            date NOT NULL,
  steps           integer,
  calories_total  integer,
  calories_active integer,
  distance_m      numeric,
  floors_climbed  integer,
  resting_hr      integer,
  hrv_ms          numeric,
  spo2_avg        numeric,
  stress_avg      integer,
  body_battery    integer,              -- Garmin-specific, nullable
  recovery_score  numeric,              -- Whoop-specific, nullable
  readiness_score numeric,              -- Oura-specific, nullable
  raw_json        jsonb,
  synced_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, date)
);
```

#### `wearable_sleep_records`

```sql
CREATE TABLE wearable_sleep_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider        text NOT NULL,
  date            date NOT NULL,
  sleep_start     timestamptz,
  sleep_end       timestamptz,
  total_minutes   integer,
  rem_minutes     integer,
  deep_minutes    integer,
  light_minutes   integer,
  awake_minutes   integer,
  sleep_score     numeric,
  raw_json        jsonb,
  synced_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, date)
);
```

#### `wearable_activities`

```sql
CREATE TABLE wearable_activities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider          text NOT NULL,
  provider_activity_id text,
  activity_type     text NOT NULL,          -- normalized: 'run', 'ride', 'swim', 'strength', 'walk', etc.
  started_at        timestamptz NOT NULL,
  ended_at          timestamptz,
  duration_minutes  integer,
  calories          integer,
  distance_m        numeric,
  avg_hr            integer,
  max_hr            integer,
  raw_json          jsonb,
  synced_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, provider_activity_id)
);
```

#### `calendar_events`

```sql
CREATE TABLE calendar_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider        text NOT NULL,            -- 'google_calendar', 'apple_calendar'
  provider_event_id text,
  title           text NOT NULL,
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  is_all_day      boolean DEFAULT false,
  calendar_name   text,
  synced_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, provider_event_id)
);
```

#### `mfp_import_jobs`

```sql
CREATE TABLE mfp_import_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name       text NOT NULL,
  status          text NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
  total_rows      integer,
  matched_rows    integer,
  fuzzy_matched   integer,
  unmatched_rows  integer,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);
```

---

## Generic OAuth Service with PKCE

### Provider Config Registry

```ts
interface ProviderConfig {
  provider: string;
  authUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  scopes: string[];
  oauthVersion: '1.0a' | '2.0';
  usePKCE: boolean;
  supportsWebhooks: boolean;
  pollIntervalMinutes?: number;
  callbackUrl: string;
}

const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
  garmin:           { oauthVersion: '1.0a', usePKCE: false, supportsWebhooks: true, ... },
  whoop:            { oauthVersion: '2.0',  usePKCE: true,  supportsWebhooks: true, ... },
  oura:             { oauthVersion: '2.0',  usePKCE: true,  supportsWebhooks: true, ... },
  fitbit:           { oauthVersion: '2.0',  usePKCE: true,  supportsWebhooks: false, pollIntervalMinutes: 15, ... },
  strava:           { oauthVersion: '2.0',  usePKCE: true,  supportsWebhooks: true, ... },
  google_calendar:  { oauthVersion: '2.0',  usePKCE: true,  supportsWebhooks: false, pollIntervalMinutes: 30, ... },
};
```

The PKCE flow generates `code_verifier` and `code_challenge` client-side, stores the verifier in MMKV, and sends the challenge with the auth request. Samsung Health uses the on-device Health Connect API and does not require OAuth.

---

## Per-Provider Details

### Garmin

- **Auth:** OAuth 1.0a (3-legged). Consumer key + secret. No PKCE.
- **Data Delivery:** Push via webhooks. Garmin POSTs to a Supabase Edge Function endpoint when new data is available.
- **Data Types:** Daily summary, activities, sleep, body composition, stress, heart rate.
- **Key Mapping:** `summaryId` -> provider_activity_id, `calendarDate` -> date, `durationInSeconds / 60` -> duration_minutes.

### Whoop

- **Auth:** OAuth 2.0 with PKCE.
- **Data Delivery:** Webhooks for recovery, workout, sleep events.
- **Data Types:** Recovery (strain, HRV, resting HR), workouts, sleep.
- **Key Mapping:** `score.recovery_score` -> recovery_score, `score.hrv_rmssd_milli` -> hrv_ms, `score.strain` -> raw_json.strain.

### Oura

- **Auth:** OAuth 2.0 with PKCE.
- **Data Delivery:** Webhooks for daily readiness, sleep, activity.
- **Data Types:** Readiness, sleep stages, activity, heart rate.
- **Key Mapping:** `readiness.score` -> readiness_score, `sleep.rem_sleep_duration / 60` -> rem_minutes, `sleep.contributors.total_sleep` -> total_minutes.

### Fitbit

- **Auth:** OAuth 2.0 with PKCE.
- **Data Delivery:** Polling only (Fitbit webhook API has restrictive approval process). Poll every 15 minutes.
- **Data Types:** Daily activity, sleep, heart rate, SpO2.
- **Key Mapping:** `summary.steps` -> steps, `summary.restingHeartRate` -> resting_hr, `sleep.stages.deep` -> deep_minutes.

### Samsung Health (Health Connect)

- **Auth:** On-device Health Connect API via `react-native-health-connect`. No OAuth.
- **Data Delivery:** On-device read on app foreground or manual sync.
- **Data Types:** Steps, heart rate, sleep, exercise sessions, body measurements.
- **Key Mapping:** Direct mapping from Health Connect record types to normalized types.

### Strava

- **Auth:** OAuth 2.0 with PKCE.
- **Data Delivery:** Webhooks for activity create/update/delete events. **Bidirectional**: TRANSFORMR workouts can be pushed to Strava.
- **Data Types:** Activities (run, ride, swim, etc.), segments, split data.
- **Key Mapping:** `id` -> provider_activity_id, `elapsed_time / 60` -> duration_minutes, `distance` (meters) -> distance_m.
- **Bidirectional sync:** On workout completion, if Strava is connected + auto-push enabled, POST the workout to Strava's activity create endpoint.

### Google Calendar

- **Auth:** OAuth 2.0 with PKCE. Server-side token storage.
- **Data Delivery:** Polling every 30 minutes via Edge Function cron.
- **Data Types:** Events from selected calendars (user picks which calendars to sync).
- **Purpose:** Time-aware workout scheduling -- avoid suggesting workouts during meetings.

### Apple Calendar

- **Auth:** On-device only via `expo-calendar`. No server-side auth.
- **Data Delivery:** Read on-device when the user opens the scheduling screen.
- **Data Types:** Events from all calendars the user grants access to.
- **Purpose:** Same as Google Calendar -- time-aware scheduling.

---

## Data Normalization Types

```ts
interface NormalizedActivity {
  provider: string;
  providerActivityId: string;
  activityType: string;           // normalized enum
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number;
  calories: number | null;
  distanceMeters: number | null;
  avgHr: number | null;
  maxHr: number | null;
  rawJson: Record<string, unknown>;
}

interface NormalizedSleep {
  provider: string;
  date: string;                   // YYYY-MM-DD
  sleepStart: Date | null;
  sleepEnd: Date | null;
  totalMinutes: number;
  remMinutes: number | null;
  deepMinutes: number | null;
  lightMinutes: number | null;
  awakeMinutes: number | null;
  sleepScore: number | null;
  rawJson: Record<string, unknown>;
}

interface NormalizedDailySummary {
  provider: string;
  date: string;                   // YYYY-MM-DD
  steps: number | null;
  caloriesTotal: number | null;
  caloriesActive: number | null;
  distanceMeters: number | null;
  restingHr: number | null;
  hrvMs: number | null;
  spo2Avg: number | null;
  recoveryScore: number | null;   // Whoop
  readinessScore: number | null;  // Oura
  bodyBattery: number | null;     // Garmin
  rawJson: Record<string, unknown>;
}
```

---

## Normalizer Files

One normalizer per provider, each exporting three functions:

```
normalizers/
  garminNormalizer.ts
  whoopNormalizer.ts
  ouraNormalizer.ts
  fitbitNormalizer.ts
  samsungNormalizer.ts
  stravaNormalizer.ts
```

Each normalizer implements:

```ts
export function normalizeActivity(raw: GarminActivity): NormalizedActivity { ... }
export function normalizeSleep(raw: GarminSleep): NormalizedSleep { ... }
export function normalizeDailySummary(raw: GarminDailySummary): NormalizedDailySummary { ... }
```

### Key Field Mappings (summary)

| Field | Garmin | Whoop | Oura | Fitbit |
|-------|--------|-------|------|--------|
| steps | `totalSteps` | -- | `activity.steps` | `summary.steps` |
| resting_hr | `restingHeartRate` | `recovery.resting_heart_rate` | `readiness.resting_heart_rate` | `summary.restingHeartRate` |
| hrv_ms | `hrvWeeklyAverage` | `recovery.hrv.rmssd_milli` | `readiness.hrv_balance.baseline` | -- |
| deep_minutes | `deepSleepSeconds / 60` | `sleep.slow_wave_sleep_milli / 60000` | `sleep.deep_sleep_duration / 60` | `sleep.summary.stages.deep` |
| recovery_score | -- | `recovery.score` | -- | -- |
| readiness_score | -- | -- | `readiness.score` | -- |
| body_battery | `bodyBatteryMax` | -- | -- | -- |

---

## Sync Engine

### Conflict Resolution

- **Activities:** `ON CONFLICT (user_id, provider, provider_activity_id) DO UPDATE` -- latest sync wins.
- **Daily Summaries:** `ON CONFLICT (user_id, provider, date) DO UPDATE` -- latest sync wins.
- **Sleep:** Special conflict resolution -- if multiple providers report sleep for the same date, the provider with the highest data fidelity (most non-null stage fields) is marked as `primary`. The readiness engine uses only the primary sleep record.

### Dedup via `ON CONFLICT`

All tables use composite unique constraints. Upserts are the default write strategy, eliminating duplicate records without client-side checks.

### Sleep Conflict Resolution Algorithm

```
1. Group sleep records by date.
2. For each date with multiple providers:
   a. Score each record: count of non-null fields among (rem, deep, light, awake, sleep_score).
   b. Tiebreaker: prefer the provider the user has marked as "primary wearable" in settings.
   c. The winning record's provider is used for readiness calculations.
```

---

## Food Federation

### Priority Waterfall

When the user searches for a food item, sources are queried in priority order. The first source to return a confident match wins.

```
1. Local cache (SQLite/MMKV)    -- instant, offline-capable
2. USDA FoodData Central        -- most accurate macros, free, no rate limit concerns
3. Nutritionix                   -- best for restaurant / branded foods, requires API key
4. OpenFoodFacts                 -- barcode scanner fallback, community-maintained
```

### Local Cache

- Food items selected by the user are cached locally with full macro data.
- Cache key: `food_source:food_id` (e.g., `usda:167512`).
- Cache TTL: 30 days. Eviction on LRU basis if cache exceeds 5000 items.

---

## MFP Import: CSV File-Based Import

### Flow

```
1. User exports their MyFitnessPal diary as CSV.
2. User uploads the CSV file in the app.
3. Edge Function parses the CSV:
   a. Extract date, meal, food_name, calories, protein, carbs, fat per row.
   b. For each food_name:
      i.   Exact match against local food database.
      ii.  Fuzzy match (Levenshtein distance <= 3 OR trigram similarity > 0.4).
      iii. If no match: mark as unmatched, log for manual review.
4. Matched rows are inserted into nutrition_logs.
5. Job status updated in mfp_import_jobs.
```

### Fuzzy Food Matching

```ts
function fuzzyMatchFood(mfpName: string, foodDatabase: FoodItem[]): FoodItem | null {
  // 1. Normalize: lowercase, remove special chars, trim
  // 2. Exact match on normalized name
  // 3. Trigram similarity (pg_trgm) > 0.4
  // 4. Levenshtein distance <= 3
  // 5. Return best match or null
}
```

---

## Integrations Screen

### `IntegrationCard` Component

Each provider has a card with the following states:

| State | Visual |
|-------|--------|
| `disconnected` | Provider logo + "Connect" button |
| `connecting` | Provider logo + spinner |
| `connected` | Provider logo + green checkmark + last sync time + "Settings" gear icon |
| `error` | Provider logo + red warning icon + error message + "Reconnect" button |
| `syncing` | Provider logo + sync animation + progress text |

### Data Toggles Panel

When a provider is connected, tapping "Settings" opens a panel with toggles for each data type:

```ts
interface DataToggle {
  key: string;            // e.g. 'sync_activities', 'sync_sleep', 'sync_daily_summary'
  label: string;          // e.g. 'Activities', 'Sleep', 'Daily Stats'
  enabled: boolean;
  applicable: boolean;    // some toggles don't apply to all providers
}
```

### Per-Provider Toggle Applicability Map

| Toggle | Garmin | Whoop | Oura | Fitbit | Samsung | Strava |
|--------|--------|-------|------|--------|---------|--------|
| Activities | yes | yes | no | yes | yes | yes |
| Sleep | yes | yes | yes | yes | yes | no |
| Daily Summary | yes | yes | yes | yes | yes | no |
| Heart Rate | yes | yes | yes | yes | yes | no |
| Recovery/Readiness | no | yes | yes | no | no | no |
| Auto-Push Workouts | no | no | no | no | no | yes |

---

## Store & Hook

### `integrationsStore`

```ts
interface IntegrationsStore {
  connections: Record<string, WearableConnection>;   // keyed by provider
  syncStatus: Record<string, SyncStatus>;
  dataToggles: Record<string, DataToggle[]>;

  setConnection: (provider: string, conn: WearableConnection) => void;
  removeConnection: (provider: string) => void;
  setSyncStatus: (provider: string, status: SyncStatus) => void;
  setDataToggle: (provider: string, key: string, enabled: boolean) => void;
}
```

### `useIntegrations` Hook

```ts
function useIntegrations() {
  // Provides: connections, connect(provider), disconnect(provider), syncNow(provider), dataToggles, setToggle
  // On mount: fetches current connection statuses from Supabase.
  // Handles OAuth redirect deep links.
}
```

---

## Environment Variables

```
# Wearable Providers
GARMIN_CONSUMER_KEY=
GARMIN_CONSUMER_SECRET=
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
OURA_CLIENT_ID=
OURA_CLIENT_SECRET=
FITBIT_CLIENT_ID=
FITBIT_CLIENT_SECRET=
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=

# Calendar
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=

# Food APIs
USDA_FOODDATA_API_KEY=
NUTRITIONIX_APP_ID=
NUTRITIONIX_API_KEY=

# Encryption
WEARABLE_TOKEN_ENCRYPTION_KEY=
```

---

## Build Sequence

### Phase 8: Wearables

| Sub-Phase | Description |
|-----------|-------------|
| 8A | Database migrations: all 7 tables. Generic OAuth service + PKCE. Provider config registry. |
| 8B | Garmin integration: OAuth 1.0a flow, webhook receiver Edge Function, normalizer. |
| 8C | Whoop + Oura integrations: OAuth 2.0 flows, webhook receivers, normalizers. |
| 8D | Fitbit integration: OAuth 2.0 flow, polling cron, normalizer. |
| 8E | Samsung Health: Health Connect on-device integration, normalizer. |
| 8F | Strava bidirectional: OAuth 2.0, webhook receiver, activity push on workout completion. Sync engine with conflict resolution + sleep conflict algorithm. |

### Phase 9: App Integrations

| Sub-Phase | Description |
|-----------|-------------|
| 9A | Google Calendar: OAuth 2.0, server-side polling cron, calendar_events table sync. |
| 9B | Apple Calendar: expo-calendar on-device integration, event read on scheduling screen. |
| 9C | Food federation: USDA + Nutritionix + OpenFoodFacts priority waterfall with local cache. |
| 9D | MFP CSV import: file upload, parsing, fuzzy matching, mfp_import_jobs tracking. Integrations screen UI with IntegrationCard + data toggles panel. |
