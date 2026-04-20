// =============================================================================
// TRANSFORMR -- GlowButton
// Premium CTA button. DNA extracted from login Sign In button.
// =============================================================================

import React, { useCallback } from 'react';
import { Text, ActivityIndicator, ViewStyle, Pressable, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

type GlowButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface GlowButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: GlowButtonVariant;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlowButton({
  title,
  onPress,
  loading = false,
  variant = 'primary',
  disabled = false,
  icon,
  style,
  fullWidth = false,
}: GlowButtonProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 14, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1.0, { damping: 14, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [disabled, loading, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const accent = isDark ? colors.accent.primary : colors.accent.primary;
  const btnStyle = getButtonStyle(variant, isDark, colors, accent);
  const textColor = getTextColor(variant, isDark, colors, accent);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        btnStyle,
        fullWidth && { alignSelf: 'stretch' },
        disabled && { opacity: 0.5 },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon && <Ionicons name={icon} size={18} color={textColor} />}
          <Text style={{
            color: textColor,
            fontSize: 17,
            fontWeight: '600',
            letterSpacing: 0.5,
          }}>
            {title}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

function getButtonStyle(
  variant: GlowButtonVariant,
  isDark: boolean,
  colors: ReturnType<typeof useTheme>['colors'],
  accent: string,
): ViewStyle {
  const base: ViewStyle = {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  };

  switch (variant) {
    case 'primary':
      return {
        ...base,
        backgroundColor: accent,
        shadowColor: accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.5 : 0.3,
        shadowRadius: 20,
        elevation: 12,
      };
    case 'secondary':
      return {
        ...base,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: accent,
      };
    case 'ghost':
      return {
        ...base,
        backgroundColor: isDark ? 'rgba(168,85,247,0.12)' : 'rgba(124,58,237,0.08)',
      };
    case 'danger':
      return {
        ...base,
        backgroundColor: colors.accent.danger,
        shadowColor: colors.accent.danger,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      };
  }
}

function getTextColor(
  variant: GlowButtonVariant,
  isDark: boolean,
  colors: ReturnType<typeof useTheme>['colors'],
  accent: string,
): string {
  switch (variant) {
    case 'primary':
      return '#FFFFFF';
    case 'secondary':
    case 'ghost':
      return accent;
    case 'danger':
      return '#FFFFFF';
  }
}
