// =============================================================================
// TRANSFORMR -- LogSuccessRipple
// Wraps any pressable child and emits a ripple + checkmark on trigger().
// =============================================================================

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  useAnimatedStyle,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { triggerHaptic } from '@/constants/haptics';

export interface LogSuccessRippleHandle {
  trigger(): void;
}

interface LogSuccessRippleProps {
  children?: React.ReactNode;
  size?: number;
}

export const LogSuccessRipple = forwardRef<LogSuccessRippleHandle, LogSuccessRippleProps>(
  ({ children, size = 200 }, ref) => {
    const { colors } = useTheme();

    // Pre-create all shared values at mount — never inside trigger()
    const rippleScale = useSharedValue(0);
    const rippleOpacity = useSharedValue(0);
    const checkmarkScale = useSharedValue(0);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cancel pending reset timer on unmount to prevent writing to shared values after unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      trigger() {
        // Cancel any in-flight animation
        cancelAnimation(rippleScale);
        cancelAnimation(rippleOpacity);
        cancelAnimation(checkmarkScale);

        // Clear any pending reset
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Reset to initial before animating
        rippleScale.value = 0;
        rippleOpacity.value = 0;
        checkmarkScale.value = 0;

        void triggerHaptic('confirmation');

        // Ripple: scale 0→1, opacity 0.30→0
        rippleScale.value = withTiming(1, { duration: 400 });
        rippleOpacity.value = withSequence(
          withTiming(0.30, { duration: 0 }),
          withTiming(0, { duration: 400 }),
        );

        // Checkmark: delayed spring bounce
        checkmarkScale.value = withDelay(
          200,
          withSequence(
            withSpring(1.2, { stiffness: 300, damping: 12 }),
            withSpring(1.0, { stiffness: 300, damping: 14 }),
          ),
        );

        // Auto-reset after 700ms (JS side, not worklet)
        timeoutRef.current = setTimeout(() => {
          cancelAnimation(rippleScale);
          cancelAnimation(rippleOpacity);
          cancelAnimation(checkmarkScale);
          rippleScale.value = 0;
          rippleOpacity.value = 0;
          checkmarkScale.value = 0;
          timeoutRef.current = null;
        }, 700);
      },
    }));

    const rippleStyle = useAnimatedStyle(() => ({
      transform: [{ scale: rippleScale.value }],
      opacity: rippleOpacity.value,
    }));

    const checkmarkStyle = useAnimatedStyle(() => ({
      transform: [{ scale: checkmarkScale.value }],
    }));

    return (
      <View style={styles.wrapper}>
        {children}

        {/* Ripple overlay — absolutely centered */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ripple,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -(size / 2),
              marginTop: -(size / 2),
            },
            rippleStyle,
          ]}
        />

        {/* Checkmark overlay — centered */}
        <Animated.View
          pointerEvents="none"
          style={[styles.checkmark, checkmarkStyle]}
        >
          <Ionicons
            name="checkmark-circle"
            size={28}
            color={colors.accent.success}
          />
        </Animated.View>
      </View>
    );
  },
);

LogSuccessRipple.displayName = 'LogSuccessRipple';

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: '#FFFFFF', /* design constant: ripple flash is always white */
  },
  checkmark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
