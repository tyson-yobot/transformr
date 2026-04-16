import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { Canvas, RoundedRect, BlurMask } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

type GlowIntensity = 'subtle' | 'medium' | 'intense';

const INTENSITY: Record<GlowIntensity, { blur: number; opacity: number }> = {
  subtle:  { blur: 8,  opacity: 0.35 },
  medium:  { blur: 14, opacity: 0.55 },
  intense: { blur: 22, opacity: 0.75 },
};

interface GlowCardProps {
  children: React.ReactNode;
  glowColor?: string;
  intensity?: GlowIntensity;
  animated?: boolean;
  cardBorderRadius?: number;
  padding?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function GlowCard({
  children, glowColor, intensity = 'subtle', animated = false,
  cardBorderRadius = 16, padding = 16, style, contentStyle,
}: GlowCardProps) {
  const { colors } = useTheme();
  const { width: sw } = useWindowDimensions();
  const color = glowColor ?? colors.accent.primary;
  const { blur, opacity } = INTENSITY[intensity];
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [animated, pulse]);

  const canvasAnim = useAnimatedStyle(() =>
    !animated ? {} : ({ opacity: interpolate(pulse.value, [0, 1], [opacity * 0.8, opacity]) }),
  );

  const pad = blur + 4;

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { zIndex: 0 }, canvasAnim]}
        pointerEvents="none"
      >
        <Canvas style={{ width: sw, height: sw, position: 'absolute', top: -pad, left: -pad }}>
          <RoundedRect
            x={pad} y={pad}
            width={sw - pad * 2} height={sw - pad * 2}
            r={cardBorderRadius}
            color={color}
            opacity={opacity}
            style="stroke"
            strokeWidth={2}
          >
            <BlurMask blur={blur} style="outer" respectCTM />
          </RoundedRect>
        </Canvas>
      </Animated.View>
      <View style={[{
        backgroundColor: colors.background.secondary,
        borderRadius: cardBorderRadius,
        borderWidth: 1,
        borderColor: `${color}28`,
        padding,
        zIndex: 1,
      }, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ wrapper: { position: 'relative' } });
