import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

type SkeletonVariant = 'text' | 'circle' | 'card';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  borderRadius: customBorderRadius,
  style,
}: SkeletonProps) {
  const { colors, borderRadius, spacing } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [shimmer]);

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'text':
        return {
          width: width ?? '100%',
          height: height ?? 16,
          borderRadius: customBorderRadius ?? borderRadius.sm,
        };
      case 'circle': {
        const size = height ?? 48;
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
        };
      }
      case 'card':
        return {
          width: width ?? '100%',
          height: height ?? 120,
          borderRadius: customBorderRadius ?? borderRadius.lg,
        };
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 1], [0.3, 0.7]);
    return { opacity };
  });

  const variantStyle = getVariantStyle();

  return (
    <Animated.View
      style={[
        styles.base,
        { backgroundColor: colors.background.tertiary },
        variantStyle,
        animatedStyle,
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
