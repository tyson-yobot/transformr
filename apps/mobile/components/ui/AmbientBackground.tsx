// =============================================================================
// TRANSFORMR -- AmbientBackground
// Three slow-drifting orbs that make the background feel alive.
// Motion is subconscious — users feel it, they don't notice it.
// =============================================================================

import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, InteractionManager, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  cancelAnimation,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@theme/index';

export function AmbientBackground() {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  // 6 shared values — 3 orbs × X/Y
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const orb3X = useSharedValue(0);
  const orb3Y = useSharedValue(0);

  // Phase offsets — calculated ONCE at mount, never in render body
  const phase1 = useRef(Math.random()).current;
  const phase2 = useRef(Math.random()).current;
  const phase3 = useRef(Math.random()).current;

  useFocusEffect(
    useCallback(() => {
      if (reduceMotion) return;

      const task = InteractionManager.runAfterInteractions(() => {
        // Orb 1 — top-center, 340px, purple, 34s cycle, ±18px / ±24px
        const halfCycle1 = 17000;
        orb1X.value = (phase1 - 0.5) * 18 * 2;
        orb1Y.value = (phase1 - 0.5) * 24 * 2;
        orb1X.value = withRepeat(
          withSequence(
            withTiming(18, { duration: halfCycle1, easing: Easing.inOut(Easing.sin) }),
            withTiming(-18, { duration: halfCycle1, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        );
        orb1Y.value = withRepeat(
          withSequence(
            withTiming(24, { duration: halfCycle1 * 1.15, easing: Easing.inOut(Easing.sin) }),
            withTiming(-24, { duration: halfCycle1 * 1.15, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        );

        // Orb 2 — bottom-left, 260px, blue, 28s cycle, ±18px / ±24px
        const halfCycle2 = 14000;
        orb2X.value = (phase2 - 0.5) * 18 * 2;
        orb2Y.value = (phase2 - 0.5) * 24 * 2;
        orb2X.value = withRepeat(
          withSequence(
            withTiming(18, { duration: halfCycle2, easing: Easing.inOut(Easing.sin) }),
            withTiming(-18, { duration: halfCycle2, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        );
        orb2Y.value = withRepeat(
          withSequence(
            withTiming(24, { duration: halfCycle2 * 1.15, easing: Easing.inOut(Easing.sin) }),
            withTiming(-24, { duration: halfCycle2 * 1.15, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        );

        // Orb 3 — upper-right, 200px, cyan, 42s cycle, ±18px / ±24px
        const halfCycle3 = 21000;
        orb3X.value = (phase3 - 0.5) * 18 * 2;
        orb3Y.value = (phase3 - 0.5) * 24 * 2;
        orb3X.value = withRepeat(
          withSequence(
            withTiming(18, { duration: halfCycle3, easing: Easing.inOut(Easing.sin) }),
            withTiming(-18, { duration: halfCycle3, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        );
        orb3Y.value = withRepeat(
          withSequence(
            withTiming(24, { duration: halfCycle3 * 1.15, easing: Easing.inOut(Easing.sin) }),
            withTiming(-24, { duration: halfCycle3 * 1.15, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        );
      });

      return () => {
        task.cancel();
        cancelAnimation(orb1X);
        cancelAnimation(orb1Y);
        cancelAnimation(orb2X);
        cancelAnimation(orb2Y);
        cancelAnimation(orb3X);
        cancelAnimation(orb3Y);
      };
    }, [reduceMotion, orb1X, orb1Y, orb2X, orb2Y, orb3X, orb3Y, phase1, phase2, phase3]),
  );

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb3X.value }, { translateY: orb3Y.value }],
  }));

  const orbOpacity = isDark ? 0.18 : 0.10;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {/* Orb 1 — top-center, purple */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: 340,
            height: 340,
            borderRadius: 170,
            backgroundColor: colors.accent.primary,
            opacity: orbOpacity,
            left: width * 0.5 - 170,
            top: height * 0.15 - 170,
          },
          orb1Style,
        ]}
      />
      {/* Orb 2 — bottom-left, blue */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: 260,
            height: 260,
            borderRadius: 130,
            backgroundColor: colors.accent.info,
            opacity: orbOpacity,
            left: width * 0.1 - 130,
            top: height * 0.75 - 130,
          },
          orb2Style,
        ]}
      />
      {/* Orb 3 — upper-right, cyan */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: colors.accent.cyan,
            opacity: orbOpacity,
            left: width * 0.85 - 100,
            top: height * 0.35 - 100,
          },
          orb3Style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: -1,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
  },
});
