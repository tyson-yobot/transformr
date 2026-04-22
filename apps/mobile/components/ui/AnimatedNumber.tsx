// =============================================================================
// TRANSFORMR -- AnimatedNumber
// Animated count-up/count-down for numeric stat values.
// Runs entirely on the UI thread via AnimatedTextInput (Reanimated 3).
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { TextInput, StyleProp, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  value: number;
  /**
   * Applied to the static `defaultValue` only (initial render, SSR fallback).
   * Animated frames always display `String(Math.round(value))` — worklet
   * constraints prevent calling JS functions on the UI thread mid-animation.
   */
  formatFn?: (n: number) => string;
  style?: StyleProp<TextStyle>;
  overshoot?: boolean;
}

export const AnimatedNumber = React.memo(function AnimatedNumber({
  value,
  formatFn,
  style,
  overshoot = false,
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const prev = prevValue.current;
    prevValue.current = value;
    const diff = Math.abs(value - prev);
    const duration = Math.min(Math.max(diff * 0.8, 400), 1800);
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(overshoot ? Easing.back(1.3) : Easing.cubic),
    });
    return () => {
      cancelAnimation(animatedValue);
    };
  }, [value, overshoot, animatedValue]);

  const fmt = formatFn ?? String;

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const rounded = Math.round(animatedValue.value);
    const display = String(rounded);
    return {
      text: display,
      defaultValue: display,
    };
  });

  return (
    <AnimatedTextInput
      animatedProps={animatedProps}
      editable={false}
      pointerEvents="none"
      style={style}
      underlineColorAndroid="transparent"
      defaultValue={fmt(value)}
    />
  );
});
