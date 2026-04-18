// apps/mobile/components/ui/NoiseOverlay.tsx
// =============================================================================
// TRANSFORMR -- NoiseOverlay
// Static SVG grain texture over the screen background.
// Gives the Deep Space #0C0A15 surface the feel of matte carbon fiber.
// Renders once. Never re-renders. No animation. No state. No effects.
// =============================================================================

import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Filter, FeTurbulence, FeColorMatrix, Rect } from 'react-native-svg';
import { useTheme } from '@theme/index';

function NoiseOverlayComponent() {
  const { width, height } = useWindowDimensions();
  const { isDark } = useTheme();
  const opacity = isDark ? 0.035 : 0.020;

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
