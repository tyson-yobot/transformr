// =============================================================================
// TRANSFORMR -- Strava Integration Service (Module 11)
// OAuth token exchange, activity fetching, and sync to the workout log.
// Tokens are stored in the profiles table (strava_access_token,
// strava_refresh_token, strava_token_expires_at).
// =============================================================================

import { supabase } from './supabase';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const CLIENT_ID = process.env['EXPO_PUBLIC_STRAVA_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['STRAVA_CLIENT_SECRET'] ?? '';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface StravaActivity {
  id: string;
  name: string;
  type: string;
  distance: number;       // meters
  movingTime: number;     // seconds
  elevationGain: number;  // meters
  startDate: string;      // ISO string
  polyline?: string;
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number };
}

interface StravaApiActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date: string;
  map?: { summary_polyline?: string };
}

// ---------------------------------------------------------------------------
// connectStrava
// ---------------------------------------------------------------------------

/**
 * Exchanges a Strava OAuth authorization code for tokens and persists them.
 * @returns true on success, false if the exchange fails
 */
export async function connectStrava(
  userId: string,
  authCode: string,
): Promise<boolean> {
  try {
    const res = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: authCode,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) return false;

    const tokens = (await res.json()) as StravaTokenResponse;

    const { error } = await supabase
      .from('profiles')
      .update({
        strava_access_token: tokens.access_token,
        strava_refresh_token: tokens.refresh_token,
        strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
        strava_athlete_id: tokens.athlete?.id?.toString() ?? null,
        strava_connected: true,
      })
      .eq('id', userId);

    return !error;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// disconnectStrava
// ---------------------------------------------------------------------------

/** Removes Strava tokens from the profile. */
export async function disconnectStrava(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({
      strava_access_token: null,
      strava_refresh_token: null,
      strava_token_expires_at: null,
      strava_athlete_id: null,
      strava_connected: false,
    })
    .eq('id', userId);
}

// ---------------------------------------------------------------------------
// isConnected
// ---------------------------------------------------------------------------

/** Returns true if the user has valid (non-expired) Strava tokens. */
export async function isConnected(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('strava_access_token, strava_token_expires_at, strava_connected')
    .eq('id', userId)
    .maybeSingle();

  if (!data?.strava_connected || !data.strava_access_token) return false;

  const expiresAt = data.strava_token_expires_at
    ? new Date(data.strava_token_expires_at as string).getTime()
    : 0;

  return expiresAt > Date.now();
}

// ---------------------------------------------------------------------------
// refreshTokenIfNeeded (internal)
// ---------------------------------------------------------------------------

async function getValidAccessToken(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
    .eq('id', userId)
    .maybeSingle();

  if (!data?.strava_access_token) return null;

  const expiresAt = data.strava_token_expires_at
    ? new Date(data.strava_token_expires_at as string).getTime()
    : 0;

  // Token is still valid
  if (expiresAt > Date.now() + 60_000) {
    return data.strava_access_token as string;
  }

  // Refresh the token
  try {
    const res = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: data.strava_refresh_token,
      }),
    });

    if (!res.ok) return null;

    const tokens = (await res.json()) as StravaTokenResponse;

    await supabase
      .from('profiles')
      .update({
        strava_access_token: tokens.access_token,
        strava_refresh_token: tokens.refresh_token,
        strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      })
      .eq('id', userId);

    return tokens.access_token;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// fetchRecentActivities
// ---------------------------------------------------------------------------

/**
 * Returns the user's most recent Strava activities.
 * @param limit - Maximum number of activities to return (default 10)
 */
export async function fetchRecentActivities(
  userId: string,
  limit = 10,
): Promise<StravaActivity[]> {
  const token = await getValidAccessToken(userId);
  if (!token) return [];

  try {
    const res = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?per_page=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) return [];

    const activities = (await res.json()) as StravaApiActivity[];

    return activities.map((a) => ({
      id: String(a.id),
      name: a.name,
      type: a.type,
      distance: a.distance,
      movingTime: a.moving_time,
      elevationGain: a.total_elevation_gain,
      startDate: a.start_date,
      polyline: a.map?.summary_polyline ?? undefined,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// syncStravaActivity
// ---------------------------------------------------------------------------

/**
 * Fetches a single Strava activity and inserts it into the TRANSFORMR
 * workout_sessions table. Skips silently if already synced.
 */
export async function syncStravaActivity(
  userId: string,
  activityId: string,
): Promise<void> {
  const token = await getValidAccessToken(userId);
  if (!token) return;

  try {
    const res = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;

    const a = (await res.json()) as StravaApiActivity;

    // Avoid duplicates by checking for existing strava_activity_id
    const { count } = await supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('strava_activity_id', String(a.id));

    if ((count ?? 0) > 0) return; // Already synced

    await supabase.from('workout_sessions').insert({
      user_id: userId,
      name: a.name,
      activity_type: a.type.toLowerCase(),
      started_at: a.start_date,
      duration_seconds: a.moving_time,
      distance_meters: a.distance,
      elevation_gain_m: a.total_elevation_gain,
      strava_activity_id: String(a.id),
      source: 'strava',
    });
  } catch {
    // Sync errors are non-fatal
  }
}
