// =============================================================================
// TRANSFORMR -- GlassCard
// Lightweight glass-morphism surface card. For heavy glow effects, use GlowCard.
// DNA extracted from login screen form card.
// =============================================================================

import React, { useCallback } from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

type GlassCardVariant = 'default' | 'featured' | 'ai' | 'streak';

interface GlassCardProps {
  variant?: GlassCardVariant;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  variant = 'default',
  children,
  style,
  onPress,
  padding = 16,
  accessibilityLabel,
}: GlassCardProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(0.98, { damping: 14, stiffness: 400 });
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(1.0, { damping: 14, stiffness: 300 });
  }, [onPress, scale]);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardStyle = getCardStyle(variant, isDark, colors, padding);

  const content = (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

function getCardStyle(
  variant: GlassCardVariant,
  isDark: boolean,
  colors: ReturnType<typeof useTheme>['colors'],
  padding: number,
): ViewStyle {
  if (isDark) {
    const base: ViewStyle = {
      backgroundColor: '#16122A',
      borderWidth: 1,
      borderColor: '#2A2248',
      borderRadius: 16,
      padding,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    };

    switch (variant) {
      case 'featured':
        return {
          ...base,
          borderColor: 'rgba(168,85,247,0.25)',
          shadowColor: '#A855F7',
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 8,
        };
      case 'ai':
        return {
          ...base,
          borderColor: 'rgba(34,211,238,0.15)',
          shadowColor: '#22D3EE',
          shadowOpacity: 0.15,
          shadowRadius: 16,
        };
      case 'streak':
        return {
          ...base,
          borderColor: 'rgba(234,179,8,0.20)',
          shadowColor: '#EAB308',
          shadowOpacity: 0.15,
          shadowRadius: 16,
        };
      default:
        return base;
    }
  }

  // Light mode — NO visible borders, shadow depth instead
  const base: ViewStyle = {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding,
    overflow: 'hidden',
    shadowColor: '#0C0A15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  };

  switch (variant) {
    case 'featured':
      return {
        ...base,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(124,58,237,0.15)',
      };
    case 'ai':
      return {
        ...base,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(8,145,178,0.12)',
      };
    case 'streak':
      return {
        ...base,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(234,179,8,0.15)',
      };
    default:
      return base;
  }
}
