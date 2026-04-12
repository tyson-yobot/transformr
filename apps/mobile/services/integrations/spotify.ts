// =============================================================================
// TRANSFORMR -- Spotify Integration Service (Module 11)
// Connects to Spotify for workout playlists. Uses Expo AuthSession for OAuth.
// =============================================================================

import { supabase } from '@services/supabase';

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration_ms: number;
  preview_url: string | null;
  uri: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  tracks_total: number;
  uri: string;
}

export async function getWorkoutPlaylists(): Promise<SpotifyPlaylist[]> {
  const { data, error } = await supabase.functions.invoke(
    'spotify-playlists',
    { body: { category: 'workout' } },
  );

  if (error) throw error;
  return (data as { playlists: SpotifyPlaylist[] }).playlists;
}

export async function getPlaylistTracks(
  playlistId: string,
): Promise<SpotifyTrack[]> {
  const { data, error } = await supabase.functions.invoke(
    'spotify-playlist-tracks',
    { body: { playlist_id: playlistId } },
  );

  if (error) throw error;
  return (data as { tracks: SpotifyTrack[] }).tracks;
}

export async function generateBPMPlaylist(
  targetBPM: number,
  durationMinutes: number,
): Promise<SpotifyPlaylist | null> {
  const { data, error } = await supabase.functions.invoke(
    'spotify-generate-playlist',
    {
      body: {
        target_bpm: targetBPM,
        duration_minutes: durationMinutes,
      },
    },
  );

  if (error) throw error;
  return (data as { playlist: SpotifyPlaylist | null }).playlist;
}

export async function isConnected(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('profiles')
    .select('spotify_connected')
    .eq('id', user.id)
    .maybeSingle();

  return (data?.spotify_connected as boolean) ?? false;
}

export async function disconnect(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase
    .from('profiles')
    .update({
      spotify_connected: false,
      spotify_access_token: null,
      spotify_refresh_token: null,
    })
    .eq('id', user.id);
}
