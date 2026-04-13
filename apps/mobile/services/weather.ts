// =============================================================================
// TRANSFORMR -- Weather Service (Module 10)
// Fetches current conditions and 5-day forecast from OpenWeatherMap.
// Returns workout context recommendations based on conditions.
// Gracefully returns null if the API key is missing or requests fail.
// =============================================================================

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
// eslint-disable-next-line expo/no-dynamic-env-var
const API_KEY = process.env['EXPO_PUBLIC_OPENWEATHER_API_KEY'];

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'storm'
  | 'fog';

export type WorkoutSeverity = 'ideal' | 'okay' | 'avoid';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windSpeed: number;
  condition: WeatherCondition;
  uvIndex: number;
  aqi?: number;
}

export interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  condition: WeatherCondition;
  precipitationChance: number;
}

export interface WorkoutWeatherContext {
  isGoodForOutdoor: boolean;
  reason: string;
  icon: string;
  severity: WorkoutSeverity;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Maps OpenWeatherMap weather ID ranges to our simplified condition enum.
 * https://openweathermap.org/weather-conditions
 */
function mapOwmCondition(weatherId: number): WeatherCondition {
  if (weatherId >= 200 && weatherId < 300) return 'storm';
  if (weatherId >= 300 && weatherId < 600) return 'rain';
  if (weatherId >= 600 && weatherId < 700) return 'snow';
  if (weatherId >= 700 && weatherId < 800) return 'fog';
  if (weatherId === 800) return 'clear';
  if (weatherId > 800) return 'cloudy';
  return 'cloudy';
}

interface OwmCurrentResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  weather: {
    id: number;
    description: string;
  }[];
  uvi?: number;
}

interface OwmForecastResponse {
  list: {
    dt: number;
    main: {
      temp_max: number;
      temp_min: number;
    };
    weather: { id: number }[];
    pop: number;
  }[];
}

// ---------------------------------------------------------------------------
// fetchCurrentWeather
// ---------------------------------------------------------------------------

/**
 * Fetches current weather conditions for the given coordinates.
 * Returns null if the API key is missing or the request fails.
 */
export async function fetchCurrentWeather(
  lat: number,
  lon: number,
): Promise<WeatherData | null> {
  if (!API_KEY) return null;

  try {
    const url = `${OWM_BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as OwmCurrentResponse;

    const weatherEntry = data.weather[0];
    if (!weatherEntry) return null;

    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: weatherEntry.description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s → km/h
      condition: mapOwmCondition(weatherEntry.id),
      uvIndex: data.uvi ?? 0,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// fetchWeatherForecast
// ---------------------------------------------------------------------------

/**
 * Fetches 5-day weather forecast (one entry per calendar day).
 * Returns empty array if the API key is missing or the request fails.
 */
export async function fetchWeatherForecast(
  lat: number,
  lon: number,
): Promise<WeatherForecast[]> {
  if (!API_KEY) return [];

  try {
    const url = `${OWM_BASE}/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=40&appid=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = (await res.json()) as OwmForecastResponse;

    // Group forecast items by date and pick the highest/lowest temps per day
    const byDate = new Map<
      string,
      { highs: number[]; lows: number[]; conditions: number[]; pops: number[] }
    >();

    for (const entry of data.list) {
      const date = new Date(entry.dt * 1000).toISOString().split('T')[0] ?? '';
      const existing = byDate.get(date) ?? {
        highs: [],
        lows: [],
        conditions: [],
        pops: [],
      };
      existing.highs.push(entry.main.temp_max);
      existing.lows.push(entry.main.temp_min);
      if (entry.weather[0]) existing.conditions.push(entry.weather[0].id);
      existing.pops.push(entry.pop);
      byDate.set(date, existing);
    }

    return [...byDate.entries()]
      .slice(0, 5)
      .map(([date, agg]) => ({
        date,
        high: Math.round(Math.max(...agg.highs)),
        low: Math.round(Math.min(...agg.lows)),
        condition: mapOwmCondition(
          agg.conditions[Math.floor(agg.conditions.length / 2)] ??
            800,
        ),
        precipitationChance: Math.round(
          Math.max(...agg.pops) * 100,
        ),
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// getWorkoutRecommendation
// ---------------------------------------------------------------------------

/**
 * Returns a workout-suitability context object based on current weather.
 */
export function getWorkoutRecommendation(
  weather: WeatherData,
): WorkoutWeatherContext {
  const { condition, temp, windSpeed, uvIndex, humidity } = weather;

  // Storms — always avoid
  if (condition === 'storm') {
    return {
      isGoodForOutdoor: false,
      reason: 'Thunderstorm conditions — outdoor workouts are unsafe right now.',
      icon: '⛈️',
      severity: 'avoid',
    };
  }

  // Heavy rain/snow
  if (condition === 'rain' || condition === 'snow') {
    return {
      isGoodForOutdoor: false,
      reason:
        condition === 'rain'
          ? 'Rainy conditions — great day for an indoor session.'
          : 'Snowy conditions — opt for indoor training today.',
      icon: condition === 'rain' ? '🌧️' : '❄️',
      severity: 'avoid',
    };
  }

  // Extreme heat (> 35°C feels-like) or high UV
  if (temp > 35 || uvIndex > 8) {
    return {
      isGoodForOutdoor: false,
      reason:
        temp > 35
          ? `It feels like ${weather.feelsLike}°C — consider exercising early morning or indoors to avoid heat stress.`
          : `UV index is ${uvIndex} — high sun exposure risk. Wear sunscreen or train indoors.`,
      icon: '☀️',
      severity: 'avoid',
    };
  }

  // Extreme cold (< -10°C) or strong wind (> 60 km/h)
  if (temp < -10 || windSpeed > 60) {
    return {
      isGoodForOutdoor: false,
      reason:
        windSpeed > 60
          ? `Wind speeds of ${windSpeed} km/h may support moving indoors today.`
          : `Temperature of ${temp}°C — dress in warm layers or consider an indoor workout.`,
      icon: '💨',
      severity: 'avoid',
    };
  }

  // Fog — okay but caution
  if (condition === 'fog') {
    return {
      isGoodForOutdoor: true,
      reason: 'Low visibility due to fog — stay on familiar routes and wear bright clothing.',
      icon: '🌫️',
      severity: 'okay',
    };
  }

  // High humidity (> 80%) — okay but uncomfortable
  if (humidity > 80) {
    return {
      isGoodForOutdoor: true,
      reason: `Humidity is ${humidity}% — you may fatigue faster. Stay well hydrated and reduce intensity if needed.`,
      icon: '💧',
      severity: 'okay',
    };
  }

  // Cloudy — good for outdoor (no sun glare, moderate temp)
  if (condition === 'cloudy') {
    return {
      isGoodForOutdoor: true,
      reason: 'Overcast skies and mild conditions — solid day for outdoor training.',
      icon: '⛅',
      severity: temp < 5 || temp > 30 ? 'okay' : 'ideal',
    };
  }

  // Clear and mild — ideal
  return {
    isGoodForOutdoor: true,
    reason: `${weather.description.charAt(0).toUpperCase() + weather.description.slice(1)} at ${temp}°C — excellent conditions for an outdoor workout.`,
    icon: '☀️',
    severity: 'ideal',
  };
}
