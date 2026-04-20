// =============================================================================
// TRANSFORMR -- GlassSkeleton
// Section-specific skeleton shapes with purple shimmer.
// =============================================================================

import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

type SkeletonPreset = 'card' | 'stat-row' | 'line' | 'circle' | 'quick-actions' | 'hero';

interface GlassSkeletonProps {
  preset?: SkeletonPreset;
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function ShimmerBlock({ width, height, borderRadius, style }: {
  width?: number | string;
  height: number;
  borderRadius: number;
  style?: ViewStyle;
}) {
  const { isDark } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [shimmer]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.8]),
  }));

  const baseColor = isDark ? 'rgba(22,18,42,0.6)' : 'rgba(0,0,0,0.04)';

  return (
    <Animated.View style={[{
      width: (width ?? '100%') as ViewStyle['width'],
      height,
      borderRadius,
      backgroundColor: baseColor,
    }, animStyle, style]} />
  );
}

export function GlassSkeleton({
  preset = 'card',
  width,
  height,
  borderRadius = 16,
  style,
}: GlassSkeletonProps) {
  switch (preset) {
    case 'card':
      return <ShimmerBlock width={width} height={height ?? 120} borderRadius={borderRadius} style={style} />;

    case 'stat-row':
      return (
        <View style={[{ flexDirection: 'row', gap: 12 }, style]}>
          {[0, 1, 2, 3].map((i) => (
            <ShimmerBlock key={i} width={72} height={72} borderRadius={12} />
          ))}
        </View>
      );

    case 'line':
      return <ShimmerBlock width={width ?? `${60 + Math.random() * 30}%`} height={height ?? 14} borderRadius={7} style={style} />;

    case 'circle':
      return <ShimmerBlock width={height ?? 72} height={height ?? 72} borderRadius={(height ?? 72) / 2} style={style} />;

    case 'quick-actions':
      return (
        <View style={[{ flexDirection: 'row', gap: 12 }, style]}>
          {[0, 1, 2].map((i) => (
            <ShimmerBlock key={i} width={undefined} height={76} borderRadius={12} style={{ flex: 1 }} />
          ))}
        </View>
      );

    case 'hero':
      return (
        <View style={[{ gap: 8 }, style]}>
          <ShimmerBlock width="80%" height={20} borderRadius={10} />
          <ShimmerBlock width="60%" height={14} borderRadius={7} />
        </View>
      );

    default:
      return <ShimmerBlock width={width} height={height ?? 120} borderRadius={borderRadius} style={style} />;
  }
}
