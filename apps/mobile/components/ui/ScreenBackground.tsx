// =============================================================================
// TRANSFORMR -- ScreenBackground
// Static gradient glow layer that gives every screen atmospheric depth.
// Renders three soft radial glows (purple, indigo, pink) behind all content.
// Pair with AmbientBackground for animated floating orbs.
// =============================================================================

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Rect, RadialGradient, vec } from '@shopify/react-native-skia';
import { useTheme } from '@theme/index';

export const ScreenBackground = React.memo(function ScreenBackground() {
  const { width, height } = useWindowDimensions();
  const { isDark } = useTheme();

  // Slightly stronger in dark mode, subtler in light mode
  const baseOpacity = isDark ? 1 : 0.5;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Upper-left purple glow */}
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(width * 0.3, height * 0.15)}
            r={width * 0.7}
            colors={[
              `rgba(168, 85, 247, ${(0.08 * baseOpacity).toFixed(3)})`,
              'transparent',
            ]}
          />
        </Rect>
        {/* Center-right indigo glow */}
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(width * 0.75, height * 0.6)}
            r={width * 0.6}
            colors={[
              `rgba(99, 102, 241, ${(0.05 * baseOpacity).toFixed(3)})`,
              'transparent',
            ]}
          />
        </Rect>
        {/* Bottom-center pink glow */}
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(width * 0.5, height * 0.9)}
            r={width * 0.5}
            colors={[
              `rgba(236, 72, 153, ${(0.04 * baseOpacity).toFixed(3)})`,
              'transparent',
            ]}
          />
        </Rect>
      </Canvas>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    zIndex: -2,
    overflow: 'hidden',
  },
});
