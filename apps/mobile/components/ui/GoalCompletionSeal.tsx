// =============================================================================
// TRANSFORMR -- GoalCompletionSeal
// Wraps any ring/metric and fires a one-per-day celebration when isComplete
// transitions to true.
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  useAnimatedStyle,
  cancelAnimation,
  makeMutable,
} from 'react-native-reanimated';
import { triggerHaptic } from '@/constants/haptics';

// ---------------------------------------------------------------------------
// Module-level: one celebration per goal per calendar day (session memory only)
// ---------------------------------------------------------------------------
const celebratedGoals = new Set<string>();

interface GoalCompletionSealProps {
  children: React.ReactNode;
  goalKey: string;
  isComplete: boolean;
  accentColor: string;
}

type Particle = {
  x: ReturnType<typeof makeMutable<number>>;
  y: ReturnType<typeof makeMutable<number>>;
  opacity: ReturnType<typeof makeMutable<number>>;
  angle: number;
};

export function GoalCompletionSeal({
  children,
  goalKey,
  isComplete,
  accentColor,
}: GoalCompletionSealProps) {
  const containerScale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  // Track whether we've fired the seal for the current "complete" window
  const hasSealed = useRef(false);

  // Pre-create 6 particles at mount — never in effect body
  const particles = useRef<Particle[]>(
    Array.from({ length: 6 }, (_, i) => ({
      x: makeMutable(0),
      y: makeMutable(0),
      opacity: makeMutable(0),
      angle: (i / 6) * Math.PI * 2,
    })),
  ).current;

  // Reset hasSealed when goal goes back to incomplete so it can celebrate again
  useEffect(() => {
    if (!isComplete) {
      hasSealed.current = false;
    }
  }, [isComplete]);

  // Cancel particle animations on unmount to prevent orphaned worklets
  useEffect(() => {
    return () => {
      particles.forEach((p) => {
        cancelAnimation(p.x);
        cancelAnimation(p.y);
        cancelAnimation(p.opacity);
      });
    };
  }, [particles]);

  useEffect(() => {
    if (!isComplete) return;

    const celebrationKey = `${goalKey}_${new Date().toDateString()}`;

    if (celebratedGoals.has(celebrationKey)) {
      // Already celebrated today — skip
      return;
    }

    if (hasSealed.current) {
      // Already celebrating in this session window
      return;
    }

    hasSealed.current = true;
    celebratedGoals.add(celebrationKey);

    void triggerHaptic('achievement');

    // Scale bounce
    containerScale.value = withSequence(
      withSpring(1.06, { stiffness: 300, damping: 20 }),
      withSpring(1.0, { stiffness: 300, damping: 20 }),
    );

    // Border flash
    borderOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 400 }),
    );

    // Particle burst — pure Reanimated 3, no setState, no setTimeout
    particles.forEach((p) => {
      p.x.value = 0;
      p.y.value = 0;
      p.opacity.value = 0;

      p.x.value = withTiming(Math.cos(p.angle) * 20, { duration: 500 });
      p.y.value = withTiming(Math.sin(p.angle) * 20, { duration: 500 });
      p.opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 400 }),
      );
    });
  }, [isComplete, goalKey, particles, containerScale, borderOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {children}

      {/* Celebration border overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.borderOverlay,
          { borderColor: accentColor },
          borderStyle,
        ]}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <ParticleView key={i} particle={p} color={accentColor} />
      ))}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Individual particle — isolated so each useAnimatedStyle reads its own mutable
// ---------------------------------------------------------------------------
function ParticleView({ particle, color }: { particle: Particle; color: string }) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: particle.x.value },
      { translateY: particle.y.value },
    ],
    opacity: particle.opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.particle, { backgroundColor: color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  borderOverlay: {
    borderRadius: 8,
    borderWidth: 2,
  },
  particle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: -2,
    marginLeft: -2,
  },
});
