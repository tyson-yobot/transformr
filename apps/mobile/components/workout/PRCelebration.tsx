import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

interface PRCelebrationProps {
  exerciseName: string;
  recordValue: string;
  recordType: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLE_COUNT = 24;

interface ParticleConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
  delay: number;
}

function generateParticles(accentColors: string[]): ParticleConfig[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
    const distance = 120 + Math.random() * 200;
    return {
      startX: SCREEN_WIDTH / 2,
      startY: SCREEN_HEIGHT / 2 - 60,
      endX: SCREEN_WIDTH / 2 + Math.cos(angle) * distance,
      endY: SCREEN_HEIGHT / 2 - 60 + Math.sin(angle) * distance + Math.random() * 100,
      color: accentColors[i % accentColors.length],
      size: 4 + Math.random() * 8,
      delay: Math.random() * 300,
    };
  });
}

function Particle({ config }: { config: ParticleConfig }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const dx = config.endX - config.startX;
    const dy = config.endY - config.startY;

    scale.value = withDelay(
      config.delay,
      withSpring(1, { damping: 6, stiffness: 200 }),
    );
    translateX.value = withDelay(
      config.delay,
      withTiming(dx, { duration: 1200, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      config.delay,
      withTiming(dy, { duration: 1200, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withDelay(
      config.delay + 600,
      withTiming(0, { duration: 600 }),
    );
  }, [config, translateX, translateY, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: config.startX - config.size / 2,
          top: config.startY - config.size / 2,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
        },
        animStyle,
      ]}
    />
  );
}

export function PRCelebration({
  exerciseName,
  recordValue,
  recordType,
  onDismiss,
  autoDismissMs = 3000,
}: PRCelebrationProps) {
  const { colors, typography, spacing } = useTheme();

  const overlayOpacity = useSharedValue(0);
  const textScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const detailOpacity = useSharedValue(0);

  const particleColors = [
    colors.accent.gold,
    colors.accent.fire,
    colors.accent.primary,
    colors.accent.pink,
    colors.accent.success,
  ];
  const particles = React.useMemo(
    () => generateParticles(particleColors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const triggerDismiss = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 400 }, () => {
      runOnJS(onDismiss)();
    });
  }, [overlayOpacity, onDismiss]);

  useEffect(() => {
    // Haptic pattern
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 400);

    // Animations
    overlayOpacity.value = withTiming(1, { duration: 300 });
    textScale.value = withSequence(
      withSpring(1.2, { damping: 4, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 300 }),
    );
    glowOpacity.value = withSequence(
      withDelay(200, withTiming(0.8, { duration: 300 })),
      withTiming(0.3, { duration: 500 }),
      withTiming(0.6, { duration: 400 }),
      withTiming(0.2, { duration: 600 }),
    );
    detailOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 400 }),
    );

    // Auto-dismiss
    const timeout = setTimeout(() => {
      triggerDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timeout);
  }, [
    overlayOpacity,
    textScale,
    glowOpacity,
    detailOpacity,
    autoDismissMs,
    triggerDismiss,
  ]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const detailStyle = useAnimatedStyle(() => ({
    opacity: detailOpacity.value,
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="box-none">
      {/* Background scrim */}
      <View style={[styles.scrim, { backgroundColor: 'rgba(0,0,0,0.75)' }]} />

      {/* Particles */}
      {particles.map((p, i) => (
        <Particle key={i} config={p} />
      ))}

      {/* Glow effect behind text */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: colors.accent.gold,
            top: SCREEN_HEIGHT / 2 - 120,
            left: SCREEN_WIDTH / 2 - 100,
          },
          glowStyle,
        ]}
        pointerEvents="none"
      />

      {/* Center content */}
      <View style={styles.center}>
        <Animated.View style={textAnimStyle}>
          <Text
            style={[
              styles.prText,
              {
                color: colors.accent.gold,
                textShadowColor: colors.accent.gold,
              },
            ]}
          >
            NEW PR!
          </Text>
        </Animated.View>

        <Animated.View style={[styles.detailWrap, detailStyle]}>
          <Text
            style={[
              typography.h2,
              { color: colors.text.primary, textAlign: 'center', marginTop: spacing.lg },
            ]}
            numberOfLines={1}
          >
            {exerciseName}
          </Text>
          <Text
            style={[
              styles.recordValue,
              {
                color: colors.accent.gold,
                marginTop: spacing.md,
              },
            ]}
          >
            {recordValue}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.text.secondary, marginTop: spacing.sm },
            ]}
          >
            {recordType}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 0,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prText: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  recordValue: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  detailWrap: {
    alignItems: 'center',
  },
});
