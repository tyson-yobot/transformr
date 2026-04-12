// =============================================================================
// TRANSFORMR -- Weather Fetch Edge Function (Module 10)
// Fetches weather from Open-Meteo (free, no API key), caches in weather_cache,
// and returns current conditions. 3-hour cache TTL.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WeatherResponse {
  temperature_f: number;
  feels_like_f: number;
  humidity: number;
  condition: string;
  condition_code: string;
  wind_mph: number;
  uv_index: number;
  aqi: number | null;
  sunrise: string;
  sunset: string;
  cached: boolean;
  workout_recommendation: string;
  hydration_note: string;
}

const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight showers",
  81: "Moderate showers",
  82: "Violent showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

function kphToMph(kph: number): number {
  return Math.round(kph * 0.621371 * 10) / 10;
}

function getWorkoutRecommendation(
  tempF: number,
  condition: string,
  uvIndex: number,
  windMph: number,
): string {
  if (condition.includes("Thunderstorm") || condition.includes("Heavy")) {
    return "Indoor workout recommended today — severe weather conditions outside.";
  }
  if (tempF > 95) {
    return "Extreme heat — if training outdoors, go early morning, stay hydrated, and reduce intensity.";
  }
  if (tempF > 85) {
    return "Hot conditions — consider a shorter outdoor session or move to an air-conditioned gym.";
  }
  if (tempF < 25) {
    return "Very cold — layer up if training outside, or opt for an indoor session.";
  }
  if (uvIndex >= 8) {
    return "High UV — apply sunscreen if training outdoors, and prefer shaded routes.";
  }
  if (windMph > 25) {
    return "Very windy — indoor training may be more productive today.";
  }
  if (condition.includes("rain") || condition.includes("Rain")) {
    return "Rainy conditions — indoor training preferred, or embrace the weather for a mental toughness session.";
  }
  if (tempF >= 55 && tempF <= 75 && uvIndex < 6) {
    return "Great conditions for outdoor training — enjoy it!";
  }
  return "Conditions are manageable for outdoor activity with normal preparation.";
}

function getHydrationNote(tempF: number, humidity: number): string {
  if (tempF > 90 || (tempF > 80 && humidity > 70)) {
    return "High heat/humidity — increase water intake by 50% during exercise. Consider electrolytes.";
  }
  if (tempF > 80) {
    return "Warm conditions — drink 16-20 oz extra water around your workout.";
  }
  if (humidity < 20) {
    return "Very dry air — you may not feel as thirsty but still need extra hydration.";
  }
  return "Standard hydration — aim for your daily water target.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { latitude, longitude } = await req.json();
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return new Response(
        JSON.stringify({ error: "latitude and longitude required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check cache
    const { data: cached } = await supabase
      .from("weather_cache")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at as string).getTime();
      if (age < CACHE_TTL_MS) {
        const tempF = cached.temperature_f as number;
        const humidity = cached.humidity as number;
        const uvIndex = cached.uv_index as number;
        const windMph = cached.wind_mph as number;
        const condition = cached.condition as string;

        const result: WeatherResponse = {
          temperature_f: tempF,
          feels_like_f: cached.feels_like_f as number,
          humidity,
          condition,
          condition_code: (cached.condition_code as string) ?? "",
          wind_mph: windMph,
          uv_index: uvIndex,
          aqi: (cached.aqi as number) ?? null,
          sunrise: (cached.sunrise as string) ?? "",
          sunset: (cached.sunset as string) ?? "",
          cached: true,
          workout_recommendation: getWorkoutRecommendation(
            tempF,
            condition,
            uvIndex,
            windMph,
          ),
          hydration_note: getHydrationNote(tempF, humidity),
        };

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch from Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index&daily=sunrise,sunset&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;

    const apiResponse = await fetch(url);
    const apiData = await apiResponse.json();

    const current = apiData.current;
    const daily = apiData.daily;

    const tempF = celsiusToFahrenheit(current.temperature_2m);
    const feelsLikeF = celsiusToFahrenheit(current.apparent_temperature);
    const humidity = current.relative_humidity_2m;
    const weatherCode = current.weather_code;
    const condition = WMO_CODES[weatherCode] ?? "Unknown";
    const windMph = kphToMph(current.wind_speed_10m);
    const uvIndex = current.uv_index ?? 0;
    const sunrise = daily?.sunrise?.[0] ?? "";
    const sunset = daily?.sunset?.[0] ?? "";

    // Upsert cache
    await supabase.from("weather_cache").upsert(
      {
        user_id: user.id,
        latitude,
        longitude,
        temperature_f: tempF,
        feels_like_f: feelsLikeF,
        humidity,
        condition,
        condition_code: String(weatherCode),
        wind_mph: windMph,
        uv_index: uvIndex,
        aqi: null,
        sunrise,
        sunset,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    const result: WeatherResponse = {
      temperature_f: tempF,
      feels_like_f: feelsLikeF,
      humidity,
      condition,
      condition_code: String(weatherCode),
      wind_mph: windMph,
      uv_index: uvIndex,
      aqi: null,
      sunrise,
      sunset,
      cached: false,
      workout_recommendation: getWorkoutRecommendation(
        tempF,
        condition,
        uvIndex,
        windMph,
      ),
      hydration_note: getHydrationNote(tempF, humidity),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
