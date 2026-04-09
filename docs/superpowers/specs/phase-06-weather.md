# Phase 06 -- Weather & Context Engine

## Overview

The Weather & Context Engine provides real-time environmental awareness that feeds into hydration targets, caffeine metabolism modeling, workout readiness scoring, and proactive safety notifications. All weather-dependent calculations are pure functions executed client-side against cached weather data.

---

## Architecture

### Data Source

- **OpenWeatherMap One Call API 3.0** -- single request returns current conditions, minutely/hourly/daily forecasts, and national weather alerts.

### Edge Function Proxy

- A Supabase Edge Function (`weather-sync`) acts as the sole proxy to OpenWeatherMap. The API key never leaves the server.
- Dual invocation modes:
  1. **User-initiated** -- called when the app enters the foreground or the user pulls to refresh.
  2. **Cron** -- scheduled job iterates all users with a stored location and refreshes their cache.

### Caching Strategy -- Stale-While-Revalidate

| Data Type | TTL   |
|-----------|-------|
| Current conditions | 30 minutes |
| Daily forecast | 3 hours |
| AQI | 1 hour |

The client reads from `weather_cache` and displays immediately. If the cached row is past its TTL the Edge Function fetches fresh data in the background; the stale value is shown until the new row lands.

---

## Database

### `weather_cache` Table

```sql
CREATE TABLE weather_cache (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lat             double precision NOT NULL,
  lng             double precision NOT NULL,
  current_json    jsonb NOT NULL,       -- temp, feels_like, humidity, wind, uv_index, weather_code
  daily_json      jsonb NOT NULL,       -- 7-day forecast array
  aqi_json        jsonb,                -- air_quality index + components
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX idx_weather_cache_expires ON weather_cache (expires_at);
```

### `caffeine_logs` Table

```sql
CREATE TABLE caffeine_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mg              smallint NOT NULL,          -- milligrams of caffeine
  source_label    text NOT NULL,              -- e.g. "Espresso", "Cold Brew", "Energy Drink"
  consumed_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_caffeine_logs_user_day ON caffeine_logs (user_id, consumed_at);
```

### `profiles` Table Additions

```sql
ALTER TABLE profiles
  ADD COLUMN weather_location_lat  double precision,
  ADD COLUMN weather_location_lng  double precision,
  ADD COLUMN caffeine_sensitivity  text CHECK (caffeine_sensitivity IN ('low', 'normal', 'high')) DEFAULT 'normal';
```

---

## Edge Function: `weather-sync/index.ts`

### Dual-Mode Handler

```
POST /weather-sync
  Body (user-initiated): { lat: number, lng: number }
  Body (cron):           { cron: true }

  1. If cron=true  --> query all profiles with non-null weather_location_lat/lng, iterate.
  2. Otherwise     --> use the lat/lng from the request body for the authenticated user.
  3. Call OpenWeatherMap One Call 3.0:
       GET https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lng}&appid={key}&units=imperial
  4. Optionally call AQI endpoint if AQI cache is expired.
  5. UPSERT into weather_cache (ON CONFLICT user_id).
  6. Return { ok: true, cached_until: expires_at }.
```

---

## Pure Calculations: `weatherContext.ts`

All functions are pure (no side effects, no network calls). They accept weather data and user profile data and return derived values.

### `calculateWorkoutContext(weather, preferences)`

Returns an object describing outdoor workout suitability:

```ts
interface WorkoutContext {
  outdoorSafe: boolean;         // false if AQI > 150 or heat index > 105 or UV > 10
  warnings: string[];           // human-readable warning strings
  suggestedHydrationMultiplier: number;  // 1.0 - 2.0
  uvProtectionNeeded: boolean;  // UV index >= 6
}
```

### `calculateWaterTarget(profile, weather, activityMinutes)`

**Water Algorithm:**

```
base_oz          = weight_lbs * 0.5

activityAdj_oz   = activityMinutes * 0.5

heatAdj_oz       = if temp_f > 70:
                      (temp_f - 70) * 0.5           -- progressive above 70 F
                    else: 0

humidityAdj_oz   = if humidity > 60%:
                      (humidity - 60) * 0.1
                    else: 0

workoutAdj_oz    = workout_intensity_factor * 8     -- 0 / 0.5 / 1.0 / 1.5

total_oz         = base_oz + activityAdj_oz + heatAdj_oz + humidityAdj_oz + workoutAdj_oz

cap              = base_oz * 2.0
final_oz         = Math.min(total_oz, cap)
```

The cap at 2x base prevents runaway targets on extreme days.

### `calculateCaffeineAnalysis(caffeineLogs, sensitivity, targetSleepTime)`

**Caffeine Half-Life Model:**

| Sensitivity | Half-Life |
|-------------|-----------|
| low         | 4.0 hours |
| normal      | 5.0 hours |
| high        | 6.5 hours |

```
SAFE_RESIDUAL_MG = 25

For each log entry:
  elapsed_h     = (now - consumed_at) / 3600000
  remaining_mg  = mg * (0.5 ^ (elapsed_h / half_life))

total_residual  = sum of all remaining_mg

cutoff_time     = target_sleep_time - (half_life * log2(last_intake_mg / SAFE_RESIDUAL_MG))
```

Returns:

```ts
interface CaffeineAnalysis {
  totalResidualMg: number;
  safeToCaffeinate: boolean;      // total_residual + planned dose < SAFE_RESIDUAL_MG at sleep time
  cutoffTime: Date;               // latest time to consume caffeine today
  projectedAtSleep: number;       // mg remaining at targetSleepTime
}
```

### `applyWeatherReadinessModifier(readinessScore, weather)`

A **post-sum multiplier** applied after the base readiness score is computed:

| Condition | Multiplier Range |
|-----------|-----------------|
| Temperature (extreme cold < 20 F or extreme heat > 100 F) | 0.70 - 0.90 |
| AQI > 100 (Unhealthy for sensitive groups) | 0.80 - 0.90 |
| AQI > 150 (Unhealthy) | 0.70 - 0.80 |
| UV Index > 8 | 0.90 - 0.95 |
| Mild / ideal conditions | 1.00 - 1.05 |

The multiplier is the product of all applicable condition modifiers, clamped to `[0.70, 1.05]`.

```ts
function applyWeatherReadinessModifier(readinessScore: number, weather: WeatherData): number {
  let modifier = 1.0;
  // apply temp modifier
  // apply AQI modifier
  // apply UV modifier
  modifier = Math.max(0.70, Math.min(1.05, modifier));
  return Math.round(readinessScore * modifier);
}
```

---

## Components

### `WeatherWidget`

Three size variants rendered by the same component:

| Size | Usage | Content |
|------|-------|---------|
| `small` | Dashboard card | Icon + temp + one-line summary |
| `medium` | Workout screen header | Temp, feels-like, AQI badge, UV badge, wind |
| `large` | Dedicated weather detail sheet | Full current + 7-day + AQI breakdown + hydration target |

### `CaffeineLogger`

- Quick-add buttons for common sources (Espresso 63 mg, Drip Coffee 95 mg, Cold Brew 200 mg, Energy Drink 160 mg, Tea 47 mg).
- Custom entry with mg input.
- Displays running residual estimate and cutoff time.

---

## Notifications

| Trigger | Notification |
|---------|-------------|
| AQI > 100 | "Air quality is degraded -- consider an indoor workout today." |
| Heat index > 95 F | "High heat advisory -- increase hydration and avoid midday outdoor exercise." |
| UV index >= 8 | "UV is very high -- wear sunscreen and sunglasses if training outside." |
| Approaching caffeine cutoff | "Last call for caffeine! After {cutoffTime} it may affect your sleep." |

Notifications are generated client-side from cached weather data and the caffeine analysis.

---

## Hook: `useWeather`

```ts
function useWeather() {
  // Subscribes to weatherStore
  // Registers AppState listener: on foreground -> call weather-sync if cache expired
  // Returns: { weather, waterTarget, caffeineAnalysis, workoutContext, readinessModifier, isLoading, refresh }
}
```

The `AppState` listener ensures that weather data is refreshed each time the user brings the app to the foreground, but only if the current cache has passed its TTL.

---

## Store: `weatherStore`

Zustand store with MMKV persistence.

```ts
interface WeatherStore {
  cache: WeatherCache | null;
  caffeineLogs: CaffeineLog[];
  setCacheFromServer: (data: WeatherCache) => void;
  addCaffeineLog: (log: CaffeineLog) => void;
  removeCaffeineLog: (id: string) => void;

  // Derived (computed via selectors)
  get waterTarget(): number;
  get caffeineAnalysis(): CaffeineAnalysis;
  get workoutContext(): WorkoutContext;
}
```

---

## Build Sequence

| Phase | Description |
|-------|-------------|
| 1 | Database migrations: `weather_cache`, `caffeine_logs`, `profiles` columns |
| 2 | Edge Function `weather-sync` with OpenWeatherMap integration |
| 3 | `weatherContext.ts` pure calculation functions + unit tests |
| 4 | `weatherStore` + `useWeather` hook with AppState listener |
| 5 | `WeatherWidget` (all 3 sizes) + `CaffeineLogger` component |
| 6 | Notification triggers (AQI, heat, UV, caffeine cutoff) |
| 7 | Cron mode for background refresh of all users |
