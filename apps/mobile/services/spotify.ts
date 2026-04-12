import { supabase } from './supabase';

// Spotify integration service
// Uses react-native-spotify-remote for playback control

interface SpotifyPlaylist {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string | null;
  durationMs: number;
}

export async function connectSpotify(userId: string): Promise<boolean> {
  // OAuth flow would be handled here
  // For now, updates profile to indicate Spotify is connected
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

export function getWorkoutPlaylists(): SpotifyPlaylist[] {
  // Would fetch from Spotify API using stored access token
  // Returns curated workout playlists
  return [];
}

export function playPlaylist(_playlistId: string): void {
  // SpotifyRemote.playUri(`spotify:playlist:${playlistId}`)
}

export function pausePlayback(): void {
  // SpotifyRemote.pause()
}

export function resumePlayback(): void {
  // SpotifyRemote.resume()
}

export function skipNext(): void {
  // SpotifyRemote.skipToNext()
}

export function skipPrevious(): void {
  // SpotifyRemote.skipToPrevious()
}

export function getCurrentTrack(): SpotifyTrack | null {
  // SpotifyRemote.getPlayerState() -> track info
  return null;
}

// BPM-based playlist selection
export function getPlaylistForWorkoutIntensity(
  intensity: 'warmup' | 'moderate' | 'intense' | 'cooldown',
): string | null {
  // Would return appropriate playlist ID based on BPM ranges
  const bpmRanges: Record<string, { min: number; max: number }> = {
    warmup: { min: 90, max: 110 },
    moderate: { min: 120, max: 140 },
    intense: { min: 140, max: 180 },
    cooldown: { min: 70, max: 100 },
  };

  // In production, would query Spotify API for matching playlists
  void bpmRanges[intensity];
  return null;
}
