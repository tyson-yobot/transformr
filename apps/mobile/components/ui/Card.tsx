import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'featured' | 'ai';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityRole?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  children,
  variant = 'default',
  header,
  footer,
  onPress,
  style,
  accessibilityLabel,
  accessibilityRole,
}: CardProps) {
  const { colors, spacing, borderRadius } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [onPress, scale]);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const getVariantStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
    };

    switch (variant) {
      case 'default':
        return base;
      case 'elevated':
        return {
          ...base,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        };
      case 'outlined':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border.default,
        };
      case 'featured':
        return {
          ...base,
          borderWidth: 1.5,
          borderColor: colors.border.glow,
          shadowColor: colors.accent.purpleGlow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 16,
          elevation: 8,
        };
      case 'ai':
        return {
          ...base,
          borderWidth: 1,
          borderColor: 'rgba(168,85,247,0.15)',
          borderLeftWidth: 3,
          borderLeftColor: colors.accent.cyan,
        };
    }
  };

  const variantStyle = getVariantStyle();

  const content = (
    <>
      {variant === 'ai' && (
        <View style={[styles.aiBadge, { backgroundColor: colors.accent.cyanDim, borderRadius: borderRadius.sm }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accent.cyan, letterSpacing: 0.5 }}>AI</Text>
        </View>
      )}
      {header && (
        <View style={[styles.section, { marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.subtle }]}>
          {header}
        </View>
      )}
      <View style={styles.body}>{children}</View>
      {footer && (
        <View style={[styles.section, { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.subtle }]}>
          {footer}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[variantStyle, animatedStyle, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View style={[variantStyle, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  body: {},
  aiBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 1,
  },
});
