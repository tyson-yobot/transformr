// =============================================================================
// TRANSFORMR -- Onboarding: Welcome
// =============================================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';

const VALUE_PROPS = [
  { icon: '\uD83D\uDCAA', text: 'AI-powered workout tracking with ghost sets and PR detection' },
  { icon: '\uD83C\uDF4E', text: 'Smart nutrition logging via camera, barcode, and voice' },
  { icon: '\uD83D\uDCB0', text: 'Business and revenue tracking alongside your fitness goals' },
  { icon: '\uD83D\uDC65', text: 'Partner accountability with live sync and challenges' },
] as const;

export default function WelcomeScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const propsOpacity = useSharedValue(0);
  const propsTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    titleTranslateY.value = withSpring(0, { damping: 15, stiffness: 200 });

    taglineOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    propsOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    propsTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 200 }));
    buttonOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const propsStyle = useAnimatedStyle(() => ({
    opacity: propsOpacity.value,
    transform: [{ translateY: propsTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary, padding: spacing.xxl }]}>
      <View style={styles.topSection}>
        <Animated.View style={[styles.heroSection, titleStyle]}>
          <Text
            style={[
              typography.hero,
              {
                color: colors.accent.primary,
                letterSpacing: 6,
                fontSize: 40,
                textAlign: 'center',
              },
            ]}
          >
            TRANSFORMR
          </Text>
        </Animated.View>

        <Animated.View style={taglineStyle}>
          <Text
            style={[
              typography.body,
              {
                color: colors.text.secondary,
                textAlign: 'center',
                marginTop: spacing.md,
                fontStyle: 'italic',
              },
            ]}
          >
            Every rep. Every meal. Every dollar. Every day.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.propsSection, propsStyle]}>
        {VALUE_PROPS.map((prop, index) => (
          <View
            key={index}
            style={[
              styles.propRow,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: 12,
                padding: spacing.lg,
                marginBottom: spacing.md,
              },
            ]}
          >
            <Text style={{ fontSize: 24, marginRight: spacing.md }}>{prop.icon}</Text>
            <Text
              style={[
                typography.body,
                { color: colors.text.primary, flex: 1 },
              ]}
            >
              {prop.text}
            </Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View style={[styles.buttonSection, buttonStyle]}>
        <Button
          title="Let's Go"
          onPress={() => router.push('/(auth)/onboarding/profile')}
          fullWidth
          size="lg"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  topSection: { alignItems: 'center', marginTop: 40 },
  heroSection: { alignItems: 'center' },
  propsSection: { flex: 1, justifyContent: 'center' },
  propRow: { flexDirection: 'row', alignItems: 'center' },
  buttonSection: { paddingBottom: 20 },
});
