import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Rect, RadialGradient, vec } from '@shopify/react-native-skia';
import { useTheme } from '@theme/index';

interface PurpleRadialBackgroundProps {
  opacity?: number;
  centerY?: number;
}

export function PurpleRadialBackground({ opacity = 1, centerY = 0 }: PurpleRadialBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const effectiveOpacity = (isDark ? 0.07 : 0.03) * opacity;
  const hexOpacity = Math.round(effectiveOpacity * 255).toString(16).padStart(2, '0');

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height}>
        <RadialGradient
          c={vec(width / 2, height * centerY)}
          r={width * 0.9}
          colors={[`${colors.accent.primary}${hexOpacity}`, 'transparent']}
        />
      </Rect>
    </Canvas>
  );
}
