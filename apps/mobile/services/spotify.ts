// =============================================================================
// TRANSFORMR — Spotify Service
//
// Uses Spotify Web API with tokens stored in Supabase profiles table.
// Requires Spotify Premium for playback control endpoints.
// No native SDK — all calls are REST via fetch.
// =============================================================================

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpotifyPlaylist {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string | null;
  durationMs: number;
  isPlaying: boolean;
}

interface SpotifyTokens {
  accessToken: string;
  refreshToken: string | null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getStoredTokens(userId: string): Promise<SpotifyTokens | null> {
  const { data } = await supabase
    .from('profiles')
    .select('spotify_access_token, spotify_refresh_token')
    .eq('id', userId)
    .single();

  if (!data?.spotify_access_token) return null;
  return {
    accessToken: data.spotify_access_token as string,
    refreshToken: (data.spotify_refresh_token as string | null) ?? null,
  };
}

export async function refreshSpotifyToken(userId: string): Promise<string | null> {
  const tokens = await getStoredTokens(userId);
  if (!tokens?.refreshToken) return null;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
      client_id: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '',
    }).toString(),
  });

  if (!response.ok) return null;

  const json = await response.json() as { access_token?: string; refresh_token?: string };
  const newAccess = json.access_token;
  const newRefresh = json.refresh_token ?? tokens.refreshToken;

  if (!newAccess) return null;

  await supabase
    .from('profiles')
    .update({
      spotify_access_token: newAccess,
      spotify_refresh_token: newRefresh,
    })
    .eq('id', userId);

  return newAccess;
}

async function spotifyFetch<T>(
  userId: string,
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  const tokens = await getStoredTokens(userId);
  if (!tokens) return null;

  const makeRequest = (token: string) =>
    fetch(`https://api.spotify.com/v1${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });

  let res = await makeRequest(tokens.accessToken);

  if (res.status === 401) {
    const newToken = await refreshSpotifyToken(userId);
    if (!newToken) return null;
    res = await makeRequest(newToken);
  }

  if (!res.ok || res.status === 204) return null;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Playlist API
// ---------------------------------------------------------------------------

export async function getWorkoutPlaylists(userId: string): Promise<SpotifyPlaylist[]> {
  interface SpotifyPlaylistsResponse {
    items: {
      id: string;
      name: string;
      images: { url: string }[];
      tracks: { total: number };
    }[];
  }

  const data = await spotifyFetch<SpotifyPlaylistsResponse>(
    userId,
    '/me/playlists?limit=20',
  );
  if (!data) return [];

  return data.items.map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.images[0]?.url ?? null,
    trackCount: item.tracks.total,
  }));
}

// ---------------------------------------------------------------------------
// Playback API (requires Spotify Premium)
// ---------------------------------------------------------------------------

export async function playPlaylist(userId: string, playlistId: string): Promise<void> {
  await spotifyFetch(userId, '/me/player/play', {
    method: 'PUT',
    body: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}` }),
  });
}

export async function pausePlayback(userId: string): Promise<void> {
  await spotifyFetch(userId, '/me/player/pause', { method: 'PUT' });
}

export async function resumePlayback(userId: string): Promise<void> {
  await spotifyFetch(userId, '/me/player/play', { method: 'PUT' });
}

export async function skipNext(userId: string): Promise<void> {
  await spotifyFetch(userId, '/me/player/next', { method: 'POST' });
}

export async function skipPrevious(userId: string): Promise<void> {
  await spotifyFetch(userId, '/me/player/previous', { method: 'POST' });
}

export async function getCurrentTrack(userId: string): Promise<SpotifyTrack | null> {
  interface PlayerStateResponse {
    is_playing: boolean;
    item: {
      id: string;
      name: string;
      duration_ms: number;
      artists: { name: string }[];
      album: { images: { url: string }[] };
    } | null;
  }

  const data = await spotifyFetch<PlayerStateResponse>(userId, '/me/player');
  if (!data?.item) return null;

  return {
    id: data.item.id,
    name: data.item.name,
    artist: data.item.artists.map((a) => a.name).join(', '),
    albumArt: data.item.album.images[0]?.url ?? null,
    durationMs: data.item.duration_ms,
    isPlaying: data.is_playing,
  };
}

// ---------------------------------------------------------------------------
// Connection helpers
// ---------------------------------------------------------------------------

export async function connectSpotify(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ spotify_connected: true })
    .eq('id', userId);
  return !error;
}

export async function disconnectSpotify(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({
      spotify_connected: false,
      spotify_access_token: null,
      spotify_refresh_token: null,
    })
    .eq('id', userId);
}

export function getPlaylistForWorkoutIntensity(
  intensity: 'warmup' | 'moderate' | 'intense' | 'cooldown',
): { min: number; max: number } {
  const bpmRanges: Record<string, { min: number; max: number }> = {
    warmup:   { min: 90,  max: 110 },
    moderate: { min: 120, max: 140 },
    intense:  { min: 140, max: 180 },
    cooldown: { min: 70,  max: 100 },
  };
  return bpmRanges[intensity] ?? { min: 120, max: 140 };
}
