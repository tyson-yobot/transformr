// =============================================================================
// VideoBackground — dual-slot ping-pong cycling with crossfade
//
// Performance design:
// • Two persistent Video components (Slot A + Slot B) — NEVER mount/unmount.
// • Ping-pong: while Slot A plays, Slot B silently buffers the next video.
//   On cycle, crossfade A→B, then reload A with the video after next.
// • progressUpdateIntervalMillis=0 eliminates 60fps JS-bridge callbacks.
// • shouldPlay only on the active slot — inactive slot buffers without decoding frames.
// • React.memo wrapper prevents re-renders from parent state changes.
// • Static gym-hero.jpg fallback behind both slots during initial load.
// =============================================================================

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  ImageBackground,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';

export interface PillarVideo {
  source: number; // require() local asset → number
  label: string;
}

interface VideoBackgroundProps {
  videos: PillarVideo[];
  /** How long each video shows before cycling (ms). Default: 8000 */
  cycleDurationMs?: number;
  /** Dark overlay opacity (0–1). Default: 0.55 */
  overlayOpacity?: number;
  /** Called whenever the active video index changes */
  onIndexChange?: (index: number) => void;
  children?: React.ReactNode;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Static fallback shown behind video slots while the first video buffers.
const FALLBACK_IMAGE = require('@assets/images/gym-hero.jpg');

function VideoBackgroundComponent({
  videos,
  cycleDurationMs = 8000,
  overlayOpacity = 0.55,
  onIndexChange,
  children,
}: VideoBackgroundProps) {
  const firstSource = videos[0]?.source ?? 0;
  const secondSource = videos.length > 1 ? (videos[1]?.source ?? firstSource) : firstSource;

  // Each slot has its own source and play-state.
  // Slot A starts active (opacity 1, playing). Slot B preloads (opacity 0, paused).
  const [slotASource, setSlotASource] = useState<number>(firstSource);
  const [slotBSource, setSlotBSource] = useState<number>(secondSource);
  const [slotAPlaying, setSlotAPlaying] = useState(true);
  const [slotBPlaying, setSlotBPlaying] = useState(false);

  const slotAOpacity = useRef(new Animated.Value(1)).current;
  const slotBOpacity = useRef(new Animated.Value(0)).current;

  const activeSlot = useRef<'A' | 'B'>('A');
  const currentIndex = useRef(0);
  const isMounted = useRef(true);
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (cycleTimer.current) clearInterval(cycleTimer.current);
    };
  }, []);

  const cycleToNext = useCallback(() => {
    if (videos.length <= 1) return;

    const nextIndex = (currentIndex.current + 1) % videos.length;
    const nextNextIndex = (nextIndex + 1) % videos.length;

    if (activeSlot.current === 'A') {
      // A is playing. B has already buffered nextIndex. Start B playing and crossfade.
      setSlotBPlaying(true);
      Animated.parallel([
        Animated.timing(slotAOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(slotBOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start(() => {
        if (!isMounted.current) return;
        currentIndex.current = nextIndex;
        activeSlot.current = 'B';
        onIndexChange?.(nextIndex);
        setSlotAPlaying(false);
        // Silently reload A with the next-next video while it's invisible.
        setSlotASource(videos[nextNextIndex]?.source ?? firstSource);
      });
    } else {
      // B is playing. A has already buffered nextIndex. Start A playing and crossfade.
      setSlotAPlaying(true);
      Animated.parallel([
        Animated.timing(slotBOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(slotAOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start(() => {
        if (!isMounted.current) return;
        currentIndex.current = nextIndex;
        activeSlot.current = 'A';
        onIndexChange?.(nextIndex);
        setSlotBPlaying(false);
        // Silently reload B with the next-next video while it's invisible.
        setSlotBSource(videos[nextNextIndex]?.source ?? firstSource);
      });
    }
  }, [videos, slotAOpacity, slotBOpacity, onIndexChange, firstSource]);

  useEffect(() => {
    if (videos.length <= 1) return;
    if (cycleTimer.current) clearInterval(cycleTimer.current);
    cycleTimer.current = setInterval(cycleToNext, cycleDurationMs);
    return () => {
      if (cycleTimer.current) clearInterval(cycleTimer.current);
    };
  }, [cycleToNext, cycleDurationMs, videos.length]);

  const handleSlotAError = useCallback(() => {
    if (cycleTimer.current) clearInterval(cycleTimer.current);
    cycleToNext();
    if (isMounted.current) {
      cycleTimer.current = setInterval(cycleToNext, cycleDurationMs);
    }
  }, [cycleToNext, cycleDurationMs]);

  const handleSlotBError = useCallback(() => {
    if (cycleTimer.current) clearInterval(cycleTimer.current);
    cycleToNext();
    if (isMounted.current) {
      cycleTimer.current = setInterval(cycleToNext, cycleDurationMs);
    }
  }, [cycleToNext, cycleDurationMs]);

  return (
    <View style={styles.container}>
      {/* Static fallback — visible only while first video buffers */}
      <ImageBackground source={FALLBACK_IMAGE} style={styles.absoluteFill} />

      {/* Slot A — starts active */}
      <Animated.View style={[styles.absoluteFill, { opacity: slotAOpacity }]}>
        <Video
          source={slotASource}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={slotAPlaying}
          isLooping
          isMuted
          volume={0}
          progressUpdateIntervalMillis={0}
          onError={handleSlotAError}
        />
      </Animated.View>

      {/* Slot B — starts preloading, invisible */}
      <Animated.View style={[styles.absoluteFill, { opacity: slotBOpacity }]}>
        <Video
          source={slotBSource}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={slotBPlaying}
          isLooping
          isMuted
          volume={0}
          progressUpdateIntervalMillis={0}
          onError={handleSlotBError}
        />
      </Animated.View>

      {/* Dark overlay for text readability — pointerEvents none so touches reach content */}
      <View
        style={[
          styles.absoluteFill,
          { backgroundColor: `rgba(12, 10, 21, ${overlayOpacity})` },
        ]}
        pointerEvents="none"
      />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export const VideoBackground = memo(VideoBackgroundComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0A15',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  content: {
    flex: 1,
  },
});

export default VideoBackground;
