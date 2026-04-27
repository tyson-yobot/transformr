// =============================================================================
// TRANSFORMR -- NowPlayingBar
// Compact now-playing mini-bar shown during active workout sessions.
// Supports play/pause, skip, and volume — calls Spotify service functions.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Icon3D } from '@components/ui/Icon3D';
import { useTheme } from '@theme/index';
import {
  getCurrentTrack,
  pausePlayback,
  resumePlayback,
  skipNext,
  skipPrevious,
  type SpotifyTrack,
} from '@services/spotify';

interface NowPlayingBarProps {
  paused?: boolean;
  onError?: (msg: string) => void;
}

const POLL_INTERVAL_MS = 8000;

export function NowPlayingBar({ paused = false, onError }: NowPlayingBarProps) {
  const { colors, typography, spacing } = useTheme();
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subtle pulse on album art when playing
  const pulseAnim = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseAnim.value }] }));

  useEffect(() => {
    if (isPlaying) {
      pulseAnim.value = withRepeat(withTiming(1.05, { duration: 800 }), -1, true);
    } else {
      pulseAnim.value = withTiming(1, { duration: 200 });
    }
  }, [isPlaying, pulseAnim]);

  const fetchCurrent = useCallback(async () => {
    try {
      const current = await getCurrentTrack();
      if (current) {
        setTrack(current);
        setIsPlaying(current.isPlaying ?? true);
      }
    } catch {
      // Non-fatal — Spotify may not be connected
    }
  }, []);

  // Auto-pause when workout rest starts, resume when rest ends
  useEffect(() => {
    if (paused) {
      pausePlayback().catch(() => {});
      setIsPlaying(false);
    } else if (track) {
      resumePlayback().catch(() => {});
      setIsPlaying(true);
    }
  }, [paused, track]);

  // Poll for current track
  useEffect(() => {
    void fetchCurrent();
    pollRef.current = setInterval(() => { void fetchCurrent(); }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchCurrent]);

  const handlePlayPause = useCallback(async () => {
    setLoading(true);
    try {
      if (isPlaying) {
        await pausePlayback();
        setIsPlaying(false);
      } else {
        await resumePlayback();
        setIsPlaying(true);
      }
    } catch {
      onError?.('Spotify playback failed');
    } finally {
      setLoading(false);
    }
  }, [isPlaying, onError]);

  const handleNext = useCallback(async () => {
    try {
      await skipNext();
      setTimeout(() => { void fetchCurrent(); }, 500);
    } catch {
      onError?.('Could not skip track');
    }
  }, [onError, fetchCurrent]);

  const handlePrevious = useCallback(async () => {
    try {
      await skipPrevious();
      setTimeout(() => { void fetchCurrent(); }, 500);
    } catch {
      onError?.('Could not go back');
    }
  }, [onError, fetchCurrent]);

  if (!track) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutDown.duration(200)}
      style={[
        styles.bar,
        {
          backgroundColor: colors.background.secondary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      {/* Album art */}
      <Animated.View style={[styles.artContainer, pulseStyle]}>
        {track.albumArt ? (
          <Image source={{ uri: track.albumArt }} style={styles.albumArt} />
        ) : (
          <View style={[styles.albumArt, { backgroundColor: colors.background.tertiary, justifyContent: 'center', alignItems: 'center' }]}>
            <Icon3D name="music" size={16} />
          </View>
        )}
      </Animated.View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <Text style={[typography.captionBold, { color: colors.text.primary }]} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={[typography.caption, { color: colors.text.secondary }]} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable onPress={handlePrevious} accessibilityLabel="Previous track" style={styles.controlBtn}>
          <Ionicons name="play-skip-back" size={18} color={colors.text.secondary} />
        </Pressable>
        <Pressable
          onPress={() => { void handlePlayPause(); }}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          style={[styles.playBtn, { backgroundColor: colors.accent.primary }]}
          disabled={loading}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={16}
            color={colors.text.inverse}
          />
        </Pressable>
        <Pressable onPress={handleNext} accessibilityLabel="Next track" style={styles.controlBtn}>
          <Ionicons name="play-skip-forward" size={18} color={colors.text.secondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    gap: 10,
  },
  artContainer: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  albumArt: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    padding: 4,
  },
  playBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
