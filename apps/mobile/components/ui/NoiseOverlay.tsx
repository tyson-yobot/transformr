// apps/mobile/components/ui/NoiseOverlay.tsx
// =============================================================================
// TRANSFORMR -- NoiseOverlay
// Static SVG grain texture over the screen background.
// Gives the Deep Space #0C0A15 surface the feel of matte carbon fiber.
// Renders once. Never re-renders. No animation. No state. No effects.
// =============================================================================

import React from 'react';
import { StyleSheet, useWindowDimensions, Platform } from 'react-native';
import Svg, { Filter, FeTurbulence, FeColorMatrix, Rect } from 'react-native-svg';

function NoiseOverlayComponent({ opacity = 0.032 }: { opacity?: number }) {
  const { width, height } = useWindowDimensions();

  // SVG filter pipeline (FeTurbulence) is not supported on Android in react-native-svg 15.x.
  // Silently renders a white rect instead of grain — return null to avoid washed-out screens.
  if (Platform.OS === 'android') return null;

  // react-native-svg filter support varies by version and platform.
  // If FeTurbulence is unavailable, render nothing — no fallback texture needed.
  if (!FeTurbulence) return null;

  return (
    <Svg
      width={width}
      height={height}
      style={styles.overlay}
      pointerEvents="none"
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
    >
      <Filter id="grain">
        <FeTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves={3}
          stitchTiles="stitch"
          result="noise"
        />
        <FeColorMatrix
          type="saturate"
          values="0"
          in="noise"
          result="grayNoise"
        />
      </Filter>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        filter="url(#grain)"
        opacity={opacity}
        fill="white"
      />
    </Svg>
  );
}

export const NoiseOverlay = React.memo(NoiseOverlayComponent);

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    // No zIndex — stacking controlled by sibling render order in the screen root View
  },
});
