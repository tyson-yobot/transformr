// =============================================================================
// VideoBackground — dual-slot ping-pong video background with crossfade
// Architecture: AD-009 — two persistent VideoView slots, opacity crossfade,
// never unmount/remount Video components (avoids GPU decode pipeline teardown).
// =============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image as ExpoImage, type ImageProps } from 'expo-image';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const FallbackImage = ExpoImage as unknown as React.ComponentType<ImageProps>;

// Fallback hero image shown while video slots are deferred (first frame)
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const GYM_HERO_FALLBACK = require('@assets/images/gym-hero.jpg') as number;

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

// Crossfade duration in ms
const CROSSFADE_MS = 800;

/**
 * Dual-slot ping-pong architecture:
 * - Slot A and Slot B each hold a persistent VideoView + useVideoPlayer.
 * - The "active" slot is fully opaque; the "standby" slot is transparent.
 * - On cycle: load the next video into the standby slot, then crossfade
 *   opacity so standby becomes visible and active fades out.
 * - This avoids replaceAsync on a visible player (which causes decode
 *   pipeline teardown → visible flicker / cuts).
 */
function VideoBackgroundInner({
  videos,
  cycleDurationMs = 8000,
  overlayOpacity = 0.55,
  onIndexChange,
  children,
}: VideoBackgroundProps) {
  // Defer VideoView mounting on Android to unblock the first native draw pass.
  // SurfaceView registers an OnPreDrawListener that returns false until its
  // surface is allocated. If SurfaceViews exist during the FIRST draw traversal,
  // they deadlock the entire view tree: the draw never completes, onLayout never
  // fires, and the native splash screen (backgroundColor #0C0A15) stays forever.
  //
  // Strategy: keep videoReady=false on Android. The container's onLayout fires
  // once the first layout pass succeeds (with only the static fallback image).
  // After onLayout, we wait two animation frames so the compositor finishes the
  // first draw, THEN mount the VideoView SurfaceViews.
  const [videoReady, setVideoReady] = useState(Platform.OS !== 'android');
  const containerLaidOut = useRef(false);
  const onContainerLayout = useCallback(() => {
    if (Platform.OS !== 'android' || containerLaidOut.current) return;
    containerLaidOut.current = true;
    // Two rAF hops: first waits for the current frame to finish, second
    // ensures the compositor has actually drawn the frame to the display.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVideoReady(true);
      });
    });
  }, []);

  // Which slot (0 = A, 1 = B) is currently the visible/active one
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  // Current video index in the videos array
  const currentIndexRef = useRef(0);
  const isMounted = useRef(true);
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Opacity for each slot: active = 1, standby = 0
  const opacityA = useRef(new Animated.Value(1)).current;
  const opacityB = useRef(new Animated.Value(0)).current;

  // Slot A starts with the first video; Slot B starts with the second (or first if only 1 video)
  const playerA = useVideoPlayer(videos[0]?.source ?? null, (p) => {
    p.loop = true;
    p.muted = true;
    p.volume = 0;
    p.play();
  });

  const playerB = useVideoPlayer(videos[1]?.source ?? videos[0]?.source ?? null, (p) => {
    p.loop = true;
    p.muted = true;
    p.volume = 0;
    // Slot B starts paused — only one hardware decoder active at a time
    p.pause();
  });

  // Handle player errors — skip to next video on the errored slot
  useEffect(() => {
    const subA = playerA.addListener('statusChange', (payload) => {
      if (payload.status === 'error' && isMounted.current) {
        cycleToNext();
      }
    });
    const subB = playerB.addListener('statusChange', (payload) => {
      if (payload.status === 'error' && isMounted.current) {
        cycleToNext();
      }
    });
    return () => {
      subA.remove();
      subB.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerA, playerB]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (cycleTimer.current) clearInterval(cycleTimer.current);
    };
  }, []);

  const cycleToNext = useCallback(() => {
    if (!isMounted.current || videos.length <= 1) return;

    const nextIndex = (currentIndexRef.current + 1) % videos.length;
    currentIndexRef.current = nextIndex;
    const nextSource = videos[nextIndex]?.source;
    if (nextSource == null) return;

    setActiveSlot((prevSlot) => {
      const newActiveSlot: 0 | 1 = prevSlot === 0 ? 1 : 0;

      // Load the next video into the standby slot (which is about to become active)
      const standbyPlayer = newActiveSlot === 0 ? playerA : playerB;
      const activeOpacity = newActiveSlot === 0 ? opacityA : opacityB;
      const standbyOpacity = newActiveSlot === 0 ? opacityB : opacityA;

      // The player that is about to become invisible (old active)
      const oldActivePlayer = newActiveSlot === 0 ? playerB : playerA;

      // Replace source on the currently-invisible standby player (no visual glitch)
      void (async () => {
        try {
          await standbyPlayer.replaceAsync(nextSource);
          standbyPlayer.loop = true;
          standbyPlayer.muted = true;
          standbyPlayer.volume = 0;
          standbyPlayer.play();
        } catch {
          // source load failed — stay on current slot
          return;
        }

        if (!isMounted.current) return;

        // Pause the old player BEFORE starting the crossfade so it stops
        // pushing frames to its SurfaceTexture while the GL context is
        // being detached during the opacity fade-out.  The frozen last
        // frame fades out smoothly — visually identical to a live feed.
        oldActivePlayer.pause();

        // Crossfade: bring standby (now loaded) to 1, fade active to 0
        Animated.parallel([
          Animated.timing(activeOpacity, {
            toValue: 1,
            duration: CROSSFADE_MS,
            useNativeDriver: true,
          }),
          Animated.timing(standbyOpacity, {
            toValue: 0,
            duration: CROSSFADE_MS,
            useNativeDriver: true,
          }),
        ]).start();

        onIndexChange?.(nextIndex);
      })();

      return newActiveSlot;
    });
  }, [videos, playerA, playerB, opacityA, opacityB, onIndexChange]);

  // Start the cycle timer
  useEffect(() => {
    if (videos.length <= 1) return;
    if (cycleTimer.current) clearInterval(cycleTimer.current);
    cycleTimer.current = setInterval(cycleToNext, cycleDurationMs);
    return () => {
      if (cycleTimer.current) clearInterval(cycleTimer.current);
    };
  }, [cycleToNext, cycleDurationMs, videos.length]);

  // Notify parent of initial index
  useEffect(() => {
    onIndexChange?.(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      {/* Fallback hero image — visible until VideoView slots mount */}
      {!videoReady && (
        <FallbackImage
          source={GYM_HERO_FALLBACK}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      {/* Slot A — persistent, never unmounted (deferred on Android) */}
      {videoReady && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityA }]}>
          <VideoView
            player={playerA}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />
        </Animated.View>
      )}

      {/* Slot B — persistent, never unmounted (deferred on Android) */}
      {videoReady && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityB }]}>
          <VideoView
            player={playerB}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />
        </Animated.View>
      )}

      {/* Dark overlay for text readability */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: `rgba(12, 10, 21, ${overlayOpacity})` },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export const VideoBackground = React.memo(VideoBackgroundInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0A15',
  },
  content: {
    flex: 1,
  },
});

export default VideoBackground;
