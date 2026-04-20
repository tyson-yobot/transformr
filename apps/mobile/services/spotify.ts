// =============================================================================
// TRANSFORMR — Spotify Service
//
// OAuth + real-time playback control via Supabase edge functions.
// Tokens never leave the server — all calls are proxied through edge functions.
// Requires Spotify Premium for playback control endpoints.
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
  description?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string | null;
  durationMs: number;
  progressMs?: number;
  isPlaying?: boolean;
}

export interface SpotifyConnectionStatus {
  connected: boolean;
  displayName?: string;
  imageUrl?: string | null;
  expiresAt?: number;
}

// ---------------------------------------------------------------------------
// Connection management
// ---------------------------------------------------------------------------

export async function getSpotifyStatus(): Promise<SpotifyConnectionStatus> {
  const { data, error } = await supabase.functions.invoke('spotify-oauth', {
    body: { action: 'status' },
  });
  if (error || !data) return { connected: false };
  return data as SpotifyConnectionStatus;
}

/** Connect using OAuth auth code from deep link callback */
export async function connectSpotify(userId: string, authCode?: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('spotify-oauth', {
    body: { action: 'connect', user_id: userId, auth_code: authCode ?? null },
  });
  if (error || !data?.connected) return false;
  await supabase.from('profiles').update({ spotify_connected: true }).eq('id', userId);
  return true;
}

export async function disconnectSpotify(userId: string): Promise<void> {
  await supabase.functions.invoke('spotify-oauth', {
    body: { action: 'disconnect', user_id: userId },
  });
  await supabase
    .from('profiles')
    .update({
      spotify_connected: false,
      spotify_access_token: null,
      spotify_refresh_token: null,
    })
    .eq('id', userId);
}

// ---------------------------------------------------------------------------
// Playback — all calls proxied via spotify-playback edge function so the
// access token never leaves the server.
// ---------------------------------------------------------------------------

export async function getCurrentTrack(): Promise<SpotifyTrack | null> {
  const { data, error } = await supabase.functions.invoke('spotify-playback', {
    body: { action: 'current_track' },
  });
  if (error || !data?.track) return null;
  return data.track as SpotifyTrack;
}

export async function getWorkoutPlaylists(): Promise<SpotifyPlaylist[]> {
  const { data, error } = await supabase.functions.invoke('spotify-playback', {
    body: { action: 'workout_playlists' },
  });
  if (error || !data?.playlists) return [];
  return data.playlists as SpotifyPlaylist[];
}

export async function playPlaylist(playlistId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('spotify-playback', {
    body: { action: 'play', playlist_id: playlistId },
  });
  if (error) throw error;
}

/** Start playing the best-match workout playlist for the given intensity */
export async function playWorkoutByIntensity(
  intensity: 'warmup' | 'moderate' | 'intense' | 'cooldown',
): Promise<void> {
  const { error } = await supabase.functions.invoke('spotify-playback', {
    body: { action: 'play_by_intensity', intensity },
  });
  if (error) throw error;
}

export async function pausePlayback(): Promise<void> {
  const { error } = await supabase.functions.invoke('spotify-playback', {
    body: { action: 'pause' },
  });
  if (error) throw error;
}

export async function resumePlayback(): Promise<void> {
  const { error } = await supabase.functions.invoke('spotify-playback', {
    body: { action: 'resume' },
  });
  if (error) throw error;
}

export async function skipNext(): Promise<void> {
  const { error } = await supabase.functions.invoke('spotify-playback', {
    body: { action: 'next' },
  });
  if (error) throw error;
}

export async function skipPrevious(): Promise<void> {
  const { error } = await supabase.functions.invoke('spotify-playback', {
    body: { action: 'previous' },
  });
  if (error) throw error;
}

export async function setVolume(volumePercent: number): Promise<void> {
  const { error } = await supabase.functions.invoke('spotify-playback', {
    body: { action: 'volume', volume_percent: Math.max(0, Math.min(100, volumePercent)) },
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// BPM-based playlist selection
// ---------------------------------------------------------------------------

export async function getPlaylistForWorkoutIntensity(
  intensity: 'warmup' | 'moderate' | 'intense' | 'cooldown',
): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('spotify-playback', {
    body: { action: 'recommend_playlist', intensity },
  });
  if (error || !data?.playlist_id) return null;
  return data.playlist_id as string;
}
