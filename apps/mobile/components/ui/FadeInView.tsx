// =============================================================================
// TRANSFORMR -- FadeInView
// Worklet-safe fade-in-down entrance animation using useAnimatedStyle.
// Drop-in replacement for Animated.View entering={FadeInDown.delay(X).duration(Y)}
// which triggers "non-worklet anonymous function" errors on Fabric.
// =============================================================================

import React, { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface FadeInViewProps {
  /** Delay before the animation starts (ms). Default 0. */
  delay?: number;
  /** Duration of the animation (ms). Default 400. */
  duration?: number;
  /** Vertical offset to animate from (px). Default 12. */
  fromY?: number;
  /** Optional extra styles on the wrapper */
  style?: ViewStyle;
  children: React.ReactNode;
}

export function FadeInView({
  delay = 0,
  duration = 400,
  fromY = 12,
  style,
  children,
}: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(fromY);

  useEffect(() => {
    const timingConfig = { duration, easing: Easing.out(Easing.cubic) };
    opacity.value = withDelay(delay, withTiming(1, timingConfig));
    translateY.value = withDelay(delay, withTiming(0, timingConfig));
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
