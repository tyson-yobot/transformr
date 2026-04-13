// =============================================================================
// TRANSFORMR -- AI Chat Floating Action Button
// Persistent entry point to the AI Chat Coach. Appears on primary screens
// and opens the /chat route when pressed.
// =============================================================================

import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View, ViewStyle, AccessibilityRole } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

interface ChatFABProps {
  bottom?: number;
  right?: number;
  style?: ViewStyle;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SIZE = 60;

export function ChatFAB({ bottom = 96, right = 20, style, onPress }: ChatFABProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const scale = useSharedValue(1);
  const glow = useSharedValue(0.6);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800 }),
        withTiming(0.6, { duration: 1800 }),
      ),
      -1,
      true,
    );
  }, [glow]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withSpring(0.92, { damping: 14, stiffness: 360 }),
      withSpring(1, { damping: 14, stiffness: 360 }),
    );
    if (onPress) {
      onPress();
    } else {
      router.push('/chat');
    }
  }, [router, onPress, scale]);

  return (
    <View
      style={[styles.wrapper, { bottom, right }, style]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: colors.accent.cyan,
            shadowColor: colors.accent.cyan,
          },
          glowStyle,
        ]}
        pointerEvents="none"
      />
      <AnimatedPressable
        onPress={handlePress}
        style={[
          styles.button,
          {
            backgroundColor: colors.accent.primary,
            shadowColor: colors.accent.primary,
          },
          pressStyle,
        ]}
        accessibilityRole={'button' as AccessibilityRole}
        accessibilityLabel="Open AI Chat Coach"
        accessibilityHint="Starts a conversation with your personalized AI wellness coach"
      >
        <Ionicons name="sparkles" size={26} color="#FFFFFF" />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  glow: {
    position: 'absolute',
    width: SIZE + 20,
    height: SIZE + 20,
    borderRadius: (SIZE + 20) / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 14,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
});
