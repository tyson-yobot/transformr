// =============================================================================
// TRANSFORMR -- Strava Integration Service (Module 11)
// Connects to Strava API for importing activities. Uses OAuth2 flow via
// Supabase Edge Function for token exchange.
// =============================================================================

import { supabase } from '@services/supabase';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? '';

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  total_elevation_gain: number;
  average_heartrate: number | null;
  max_heartrate: number | null;
  calories: number;
  average_speed: number;
  max_speed: number;
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile_medium: string;
  city: string;
  state: string;
}

export async function connectStrava(): Promise<boolean> {
  const redirectUri = Linking.createURL('strava-callback');
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read,activity:read_all&approval_prompt=auto`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success') return false;

  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  if (!code) return false;

  const { error } = await supabase.functions.invoke('strava-token-exchange', {
    body: { code, redirect_uri: redirectUri },
  });

  return !error;
}

export async function fetchRecentActivities(
  limit: number = 20,
): Promise<StravaActivity[]> {
  const { data, error } = await supabase.functions.invoke('strava-activities', {
    body: { limit },
  });

  if (error) throw error;
  return (data as { activities: StravaActivity[] }).activities;
}

export async function importActivity(
  activity: StravaActivity,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const durationMinutes = Math.round(activity.moving_time / 60);
  const distanceMiles = Math.round((activity.distance / 1609.34) * 100) / 100;

  await supabase.from('workout_sessions').insert({
    user_id: user.id,
    started_at: activity.start_date,
    completed_at: new Date(
      new Date(activity.start_date).getTime() + activity.elapsed_time * 1000,
    ).toISOString(),
    duration_minutes: durationMinutes,
    total_volume: 0,
    calories_burned: activity.calories,
    notes: `Imported from Strava: ${activity.name} (${activity.type}, ${distanceMiles} mi)`,
    source: 'strava',
    external_id: String(activity.id),
  });
}

export async function disconnectStrava(): Promise<void> {
  const { error } = await supabase.functions.invoke('strava-disconnect');
  if (error) throw error;
}
