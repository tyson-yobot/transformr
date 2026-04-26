// =============================================================================
// VideoBackground — cycling pillar video background with crossfade
// =============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
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

export function VideoBackground({
  videos,
  cycleDurationMs = 8000,
  overlayOpacity = 0.55,
  onIndexChange,
  children,
}: VideoBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
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
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || !isMounted.current) return;
      setCurrentIndex((prev) => {
        const next = (prev + 1) % videos.length;
        onIndexChange?.(next);
        return next;
      });
      // Fade back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, videos.length, onIndexChange]);

  useEffect(() => {
    if (cycleTimer.current) clearInterval(cycleTimer.current);
    cycleTimer.current = setInterval(cycleToNext, cycleDurationMs);
    return () => {
      if (cycleTimer.current) clearInterval(cycleTimer.current);
    };
  }, [cycleToNext, cycleDurationMs]);

  const handleVideoError = useCallback(() => {
    // Skip to next video on error
    if (cycleTimer.current) clearInterval(cycleTimer.current);
    cycleToNext();
    cycleTimer.current = setInterval(cycleToNext, cycleDurationMs);
  }, [cycleToNext, cycleDurationMs]);

  const currentVideo = videos[currentIndex];

  return (
    <View style={styles.container}>
      {/* Video layer — fades in/out on cycle */}
      <Animated.View style={[styles.absoluteFill, { opacity: fadeAnim }]}>
        {currentVideo != null && (
          <Video
            key={currentIndex}
            source={currentVideo.source}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            volume={0}
            onError={handleVideoError}
          />
        )}
      </Animated.View>

      {/* Dark overlay for text readability */}
      <View
        style={[
          styles.absoluteFill,
          { backgroundColor: `rgba(12, 10, 21, ${overlayOpacity})` },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

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
