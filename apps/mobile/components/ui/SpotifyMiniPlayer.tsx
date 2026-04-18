// =============================================================================
// TRANSFORMR — SpotifyMiniPlayer
//
// Shows currently playing Spotify track with play/pause and skip controls.
// Polls getCurrentTrack every 5 seconds while visible.
// Requires Spotify Premium for playback endpoints.
// =============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import {
  getCurrentTrack,
  pausePlayback,
  resumePlayback,
  skipNext,
  skipPrevious,
  type SpotifyTrack,
} from '@services/spotify';

interface Props {
  userId: string;
}

export function SpotifyMiniPlayer({ userId }: Props) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [track, setTrack] = useState<SpotifyTrack | null>(null);

  const refresh = useCallback(async () => {
    const current = await getCurrentTrack(userId).catch(() => null);
    setTrack(current);
  }, [userId]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => { void refresh(); }, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const handlePlayPause = useCallback(async () => {
    if (!track) return;
    if (track.isPlaying) {
      await pausePlayback(userId).catch(() => undefined);
    } else {
      await resumePlayback(userId).catch(() => undefined);
    }
    await refresh();
  }, [track, userId, refresh]);

  const handleNext = useCallback(async () => {
    await skipNext(userId).catch(() => undefined);
    setTimeout(() => { void refresh(); }, 500);
  }, [userId, refresh]);

  const handlePrev = useCallback(async () => {
    await skipPrevious(userId).catch(() => undefined);
    setTimeout(() => { void refresh(); }, 500);
  }, [userId, refresh]);

  if (!track) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          borderColor: colors.border.default,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      {track.albumArt && (
        <Image
          source={{ uri: track.albumArt }}
          style={[styles.albumArt, { borderRadius: borderRadius.sm }]}
        />
      )}

      <View style={styles.info}>
        <Text
          style={[typography.captionBold, { color: colors.text.primary }]}
          numberOfLines={1}
        >
          {track.name}
        </Text>
        <Text
          style={[typography.caption, { color: colors.text.secondary }]}
          numberOfLines={1}
        >
          {track.artist}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={handlePrev}
          accessibilityLabel="Previous track"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="play-skip-back" size={18} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          accessibilityLabel={track.isPlaying ? 'Pause' : 'Play'}
          accessibilityRole="button"
          style={[
            styles.playBtn,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: 20,
              marginHorizontal: spacing.xs,
            },
          ]}
        >
          <Ionicons
            name={track.isPlaying ? 'pause' : 'play'}
            size={16}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          accessibilityLabel="Next track"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="play-skip-forward" size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  albumArt: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
