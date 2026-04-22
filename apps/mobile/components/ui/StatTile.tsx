// =============================================================================
// TRANSFORMR -- StatTile
// Stat display tile with animated value, optional animated flame for streaks,
// and streak milestone detection with haptic burst.
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, ViewStyle, InteractionManager } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  useAnimatedStyle,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { triggerHaptic } from '@/constants/haptics';
import { AnimatedNumber } from './AnimatedNumber';

// ---------------------------------------------------------------------------
// Streak milestone detection
// ---------------------------------------------------------------------------

const STREAK_MILESTONES = new Set([7, 14, 30, 60, 90, 180, 365]);

// ---------------------------------------------------------------------------
// AnimatedFlame (inline)
// ---------------------------------------------------------------------------

function AnimatedFlame({ color }: { color: string }) {
  const flameScale = useSharedValue(1.0);
  const flameRotation = useSharedValue(0);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 800 }),
          withTiming(1.0, { duration: 800 }),
        ),
        -1,
        false,
      );
      flameRotation.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 800 }),
          withTiming(3, { duration: 800 }),
        ),
        -1,
        false,
      );
    });

    return () => {
      task.cancel();
      cancelAnimation(flameScale);
      cancelAnimation(flameRotation);
    };
    // flameScale and flameRotation are stable SharedValues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: flameScale.value },
      { rotate: `${flameRotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="flame" size={20} color={color} />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// StatTile props
// ---------------------------------------------------------------------------

interface StatTileProps {
  label: string;
  value: number;
  unit?: string;
  showFlame?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// StatTile
// ---------------------------------------------------------------------------

export const StatTile = React.memo(function StatTile({
  label,
  value,
  unit,
  showFlame = false,
  style,
}: StatTileProps) {
  const { colors, typography, spacing } = useTheme();
  const lastMilestone = useRef<number>(0);
  const tileScale = useSharedValue(1.0);

  useEffect(() => {
    if (showFlame && value > 0 && STREAK_MILESTONES.has(value) && value !== lastMilestone.current) {
      lastMilestone.current = value;
      triggerHaptic('achievement');
      tileScale.value = withSequence(
        withSpring(1.5),
        withSpring(1.0),
      );
    }
    // tileScale is a stable SharedValue from useSharedValue
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, showFlame]);

  const tileAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tileScale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          alignItems: 'center',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        },
        tileAnimatedStyle,
        style,
      ]}
    >
      <Text
        style={[
          typography.captionBold,
          { color: colors.text.secondary, marginBottom: spacing.xs },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <AnimatedNumber
          value={value}
          style={[typography.monoBody, { color: colors.text.primary }]}
        />
        {showFlame && (
          <AnimatedFlame color={colors.accent.fire} />
        )}
      </View>

      {unit !== undefined && (
        <Text
          style={[typography.tiny, { color: colors.text.muted }]}
          numberOfLines={1}
        >
          {unit}
        </Text>
      )}
    </Animated.View>
  );
});
