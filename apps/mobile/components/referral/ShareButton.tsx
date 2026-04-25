// =============================================================================
// TRANSFORMR — ShareButton
// Contextual share CTA with primary and outline variants.
// =============================================================================

import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';

type ShareButtonVariant = 'primary' | 'outline';
type ShareButtonSize = 'small' | 'medium';

interface ShareButtonProps {
  label?: string;
  onPress: () => void;
  variant?: ShareButtonVariant;
  size?: ShareButtonSize;
}

const SIZE_CONFIG: Record<ShareButtonSize, { height: number; iconSize: number; fontSize: number; paddingH: 'md' | 'lg' }> = {
  small: { height: 44, iconSize: 16, fontSize: 14, paddingH: 'md' },
  medium: { height: 48, iconSize: 18, fontSize: 16, paddingH: 'lg' },
};

export function ShareButton({
  label = 'Share',
  onPress,
  variant = 'primary',
  size = 'medium',
}: ShareButtonProps) {
  const { colors, spacing, borderRadius } = useTheme();

  const sizeConfig = SIZE_CONFIG[size];

  const baseStyle = {
    minHeight: sizeConfig.height,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[sizeConfig.paddingH],
  };

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityLabel={label}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[colors.accent.primary, colors.accent.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, baseStyle]}
        >
          <Ionicons
            name="share-social-outline"
            size={sizeConfig.iconSize}
            color={colors.text.inverse}
            style={{ marginRight: spacing.sm }}
          />
          <Text
            style={{
              color: colors.text.inverse,
              fontSize: sizeConfig.fontSize,
              fontWeight: '600',
            }}
          >
            {label}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  }

  // Outline variant
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.outlineButton,
        baseStyle,
        {
          borderColor: colors.accent.primary,
          borderWidth: 1.5,
          backgroundColor: pressed
            ? colors.accent.primaryDim
            : 'transparent',
        },
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons
        name="share-social-outline"
        size={sizeConfig.iconSize}
        color={colors.accent.primary}
        style={{ marginRight: spacing.sm }}
      />
      <Text
        style={{
          color: colors.accent.primary,
          fontSize: sizeConfig.fontSize,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ShareButton;
