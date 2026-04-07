import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  containerStyle?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  secureTextEntry: initialSecure = false,
  multiline,
  containerStyle,
  ...textInputProps
}: InputProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(!initialSecure);
  const focusAnim = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);

  const isPassword = initialSecure;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
  }, [focusAnim]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
  }, [focusAnim]);

  const toggleSecure = useCallback(() => {
    setIsSecureVisible((prev) => !prev);
  }, []);

  const borderColor = error
    ? colors.accent.danger
    : isFocused
      ? colors.border.focus
      : colors.border.default;

  const animatedBorderStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      focusAnim.value,
      [0, 1],
      [colors.border.default, error ? colors.accent.danger : colors.border.focus],
    );
    return { borderColor: color };
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}
      <AnimatedView
        style={[
          styles.container,
          {
            backgroundColor: colors.background.input,
            borderRadius: borderRadius.md,
            borderWidth: 1.5,
            paddingHorizontal: spacing.md,
            minHeight: multiline ? 100 : 48,
          },
          animatedBorderStyle,
        ]}
      >
        {leftIcon && <View style={[styles.icon, { marginRight: spacing.sm }]}>{leftIcon}</View>}
        <TextInput
          ref={inputRef}
          {...textInputProps}
          multiline={multiline}
          secureTextEntry={isPassword && !isSecureVisible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.text.muted}
          style={[
            typography.body,
            styles.input,
            { color: colors.text.primary },
            multiline && styles.multiline,
          ]}
          accessibilityLabel={label}
        />
        {isPassword && (
          <Pressable onPress={toggleSecure} style={[styles.icon, { marginLeft: spacing.sm }]} hitSlop={8}>
            <Text style={[typography.caption, { color: colors.text.muted }]}>
              {isSecureVisible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
        {rightIcon && !isPassword && (
          <View style={[styles.icon, { marginLeft: spacing.sm }]}>{rightIcon}</View>
        )}
      </AnimatedView>
      {error && (
        <Text style={[typography.caption, { color: colors.accent.danger, marginTop: spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  multiline: {
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
