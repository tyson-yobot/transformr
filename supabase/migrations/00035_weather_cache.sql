-- =============================================================================
-- TRANSFORMR -- Weather Cache (Module 10)
-- Caches weather data per user location with a 3-hour TTL.
-- =============================================================================

CREATE TABLE weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  temperature_f NUMERIC,
  feels_like_f NUMERIC,
  humidity INTEGER,
  condition TEXT NOT NULL,
  condition_code TEXT,
  wind_mph NUMERIC,
  uv_index NUMERIC,
  aqi INTEGER,
  sunrise TEXT,
  sunset TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_weather_cache_user
  ON weather_cache(user_id);

CREATE INDEX idx_weather_cache_freshness
  ON weather_cache(user_id, fetched_at DESC);

ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own weather cache"
  ON weather_cache FOR ALL
  USING (auth.uid() = user_id);
