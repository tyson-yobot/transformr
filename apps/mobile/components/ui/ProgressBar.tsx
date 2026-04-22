import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

interface ProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
  showPercentage?: boolean;
  color?: string;
  height?: number;
  style?: ViewStyle;
  animationDuration?: number;
}

export const ProgressBar = React.memo(function ProgressBar({
  progress,
  label,
  showPercentage = false,
  color,
  height = 8,
  style,
  animationDuration = 500,
}: ProgressBarProps) {
  const { colors, typography, spacing } = useTheme();

  const clamped = Math.max(0, Math.min(1, progress));
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(clamped, {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, animatedWidth, animationDuration]);

  const getProgressColor = (): string => {
    if (color) return color;
    if (clamped >= 0.8) return colors.accent.success;
    if (clamped >= 0.5) return colors.accent.primary;
    if (clamped >= 0.25) return colors.accent.warning;
    return colors.accent.danger;
  };

  const fillColor = getProgressColor();
  const percentage = Math.round(clamped * 100);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value * 100}%` as unknown as number,
  }));

  return (
    <View
      style={[styles.wrapper, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      {(label || showPercentage) && (
        <View style={[styles.labelRow, { marginBottom: spacing.xs }]}>
          {label && (
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text style={[typography.captionBold, { color: colors.text.primary }]}>
              {percentage}%
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: colors.background.tertiary,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              backgroundColor: fillColor,
              borderRadius: height / 2,
            },
            animatedFillStyle,
          ]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
