import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button = React.memo(function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [loading, disabled, onPress]);

  const sizeConfig: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: TextStyle }> = {
    sm: { height: 44, paddingHorizontal: spacing.md, fontSize: typography.caption },
    md: { height: 48, paddingHorizontal: spacing.xl, fontSize: typography.body },
    lg: { height: 56, paddingHorizontal: spacing.xxl, fontSize: typography.h3 },
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    const base: ViewStyle = {
      borderRadius: borderRadius.md,
      height: sizeConfig[size].height,
      paddingHorizontal: sizeConfig[size].paddingHorizontal,
    };

    switch (variant) {
      case 'primary':
        return {
          container: {
            ...base,
            backgroundColor: 'transparent',
            overflow: 'hidden',
            // Match the login screen Sign In button shadow exactly:
            shadowColor: colors.accent.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.50 : 0.28,
            shadowRadius: 20,
            elevation: 12,
          },
          text: { color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.5 },
        };
      case 'secondary':
        return {
          container: { ...base, backgroundColor: colors.background.tertiary },
          text: { color: colors.text.primary },
        };
      case 'outline':
        return {
          container: { ...base, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border.default },
          text: { color: colors.text.primary },
        };
      case 'ghost':
        return {
          container: { ...base, backgroundColor: 'transparent' },
          text: { color: colors.accent.primary },
        };
      case 'danger':
        return {
          container: { ...base, backgroundColor: colors.accent.danger },
          text: { color: colors.text.inverse },
        };
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const variantStyles = useMemo(() => getVariantStyles(), [variant, size, colors, spacing, borderRadius, isDark]);
  const isDisabled = disabled || loading;
  const currentSize = sizeConfig[size];

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      android_ripple={{ color: 'rgba(255,255,255,0.12)', borderless: false }}
      style={[
        styles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {variant === 'primary' && (
        <LinearGradient
          colors={[colors.accent.primary, colors.accent.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color as string}
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              currentSize.fontSize,
              { fontWeight: '600' },
              variantStyles.text,
              leftIcon ? { marginLeft: spacing.sm } : undefined,
              rightIcon ? { marginRight: spacing.sm } : undefined,
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
});
