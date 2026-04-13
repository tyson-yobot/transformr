import { useCallback, useEffect } from 'react';
import { Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  style?: ViewStyle;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 26;
const THUMB_MARGIN = 3;

export function Toggle({
  value,
  onValueChange,
  label,
  disabled = false,
  activeColor,
  inactiveColor,
  style,
}: ToggleProps) {
  const { colors, typography, spacing } = useTheme();

  const onColor = activeColor ?? colors.accent.primary;
  const offColor = inactiveColor ?? colors.background.tertiary;

  const position = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    position.value = withSpring(value ? 1 : 0, { damping: 18, stiffness: 350 });
  }, [value, position]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(!value);
  }, [value, disabled, onValueChange]);

  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      position.value,
      [0, 1],
      [offColor, onColor],
    );
    return { backgroundColor };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const translateX = position.value * (TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, style]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      {label && (
        <Text
          style={[
            typography.body,
            { color: colors.text.primary, marginRight: spacing.md, flex: 1 },
          ]}
        >
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          styles.track,
          disabled && styles.disabled,
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: THUMB_MARGIN,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
});
