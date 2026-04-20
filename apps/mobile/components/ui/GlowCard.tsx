import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, useWindowDimensions, Pressable } from 'react-native';
import { Canvas, RoundedRect, BlurMask } from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

type GlowIntensity = 'subtle' | 'medium' | 'intense';

const INTENSITY: Record<GlowIntensity, { blur: number; opacity: number }> = {
  subtle:  { blur: 8,  opacity: 0.35 },
  medium:  { blur: 14, opacity: 0.55 },
  intense: { blur: 22, opacity: 0.75 },
};

interface GlowCardProps {
  children: React.ReactNode;
  // Legacy prop — prefer accentColor
  glowColor?: string;
  accentColor?: string;
  intensity?: GlowIntensity;
  animated?: boolean;
  cardBorderRadius?: number;
  padding?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  onPress?: () => void;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlowCard({
  children, glowColor, accentColor, intensity = 'subtle', animated = false,
  cardBorderRadius = 16, padding = 16, style, contentStyle, onPress, accessibilityLabel,
}: GlowCardProps) {
  const { colors, isDark } = useTheme();
  const { width: sw } = useWindowDimensions();
  const color = accentColor ?? glowColor ?? colors.accent.primary;
  const { blur, opacity } = INTENSITY[intensity];
  const pulse = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!animated) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [animated, pulse]);

  const canvasAnim = useAnimatedStyle(() =>
    !animated ? {} : ({ opacity: interpolate(pulse.value, [0, 1], [opacity * 0.8, opacity]) }),
  );

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(0.97, { damping: 14, stiffness: 400 });
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(1.0, { damping: 14, stiffness: 300 });
  }, [onPress, scale]);

  const pad = blur + 4;

  const cardBg = colors.background.glass;

  const innerContent = (
    <View style={[styles.wrapper, style]}>
      {animated ? (
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
      ) : null}
      <View style={[{
        backgroundColor: cardBg,
        borderRadius: cardBorderRadius,
        borderWidth: 1,
        borderColor: isDark ? `rgba(168,85,247,${INTENSITY[intensity].opacity * 0.5})` : `rgba(124,58,237,${INTENSITY[intensity].opacity * 0.3})`,
        padding,
        zIndex: 1,
        shadowColor: color,
        shadowOffset: { width: 0, height: isDark ? 8 : 4 },
        shadowOpacity: isDark ? INTENSITY[intensity].opacity * 0.55 : INTENSITY[intensity].opacity * 0.25,
        shadowRadius: isDark ? 22 : 12,
        elevation: isDark ? 8 : 3,
      }, contentStyle]}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={pressStyle}
      >
        {innerContent}
      </AnimatedPressable>
    );
  }

  return innerContent;
}

const styles = StyleSheet.create({ wrapper: { position: 'relative' } });
