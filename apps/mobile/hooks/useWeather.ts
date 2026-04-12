// =============================================================================
// TRANSFORMR -- useWeather Hook (Module 10)
// TanStack Query hook that uses expo-location to get device coordinates,
// then fetches current weather + forecast from the weather service.
// Weather is cached for 30 minutes. Permission denial returns null gracefully.
// =============================================================================

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import {
  fetchCurrentWeather,
  fetchWeatherForecast,
  getWorkoutRecommendation,
} from '@services/weather';
import type {
  WeatherData,
  WeatherForecast,
  WorkoutWeatherContext,
} from '@services/weather';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeatherQueryResult {
  weather: WeatherData | null;
  forecast: WeatherForecast[];
  workoutContext: WorkoutWeatherContext | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

interface WeatherBundle {
  weather: WeatherData | null;
  forecast: WeatherForecast[];
  workoutContext: WorkoutWeatherContext | null;
}

async function fetchWeatherBundle(): Promise<WeatherBundle> {
  // Request location permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { weather: null, forecast: [], workoutContext: null };
  }

  let coords: { latitude: number; longitude: number };
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    coords = location.coords;
  } catch {
    // Location unavailable (e.g. emulator without mock location)
    return { weather: null, forecast: [], workoutContext: null };
  }

  const { latitude, longitude } = coords;

  const [weather, forecast] = await Promise.all([
    fetchCurrentWeather(latitude, longitude),
    fetchWeatherForecast(latitude, longitude),
  ]);

  const workoutContext = weather ? getWorkoutRecommendation(weather) : null;

  return { weather, forecast, workoutContext };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const WEATHER_QUERY_KEY = 'weather';
const STALE_TIME_MS = 30 * 60 * 1000; // 30 minutes

export function useWeather(): WeatherQueryResult {
  const { data, isLoading, error, refetch } = useQuery<WeatherBundle, Error>({
    queryKey: [WEATHER_QUERY_KEY],
    queryFn: fetchWeatherBundle,
    staleTime: STALE_TIME_MS,
    retry: 1,
    // Don't throw on error — weather is non-critical
  });

  const handleRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    weather: data?.weather ?? null,
    forecast: data?.forecast ?? [],
    workoutContext: data?.workoutContext ?? null,
    isLoading,
    error: error ?? null,
    refetch: handleRefetch,
  };
}
