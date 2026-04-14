// =============================================================================
// TRANSFORMR -- Onboarding: Welcome
// =============================================================================

import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
import { OnboardingHero } from '@components/onboarding/OnboardingHero';

const VIVID_PURPLE = '#A855F7';

const VALUE_PROPS = [
  { icon: '\uD83D\uDCAA', text: 'AI-powered workout tracking with ghost sets and PR detection' },
  { icon: '\uD83C\uDF4E', text: 'Smart nutrition logging via camera, barcode, and voice' },
  { icon: '\uD83D\uDCB0', text: 'Business and revenue tracking alongside your fitness goals' },
  { icon: '\uD83D\uDC65', text: 'Partner accountability with live sync and challenges' },
] as const;

export default function WelcomeScreen() {
  const { typography, spacing, borderRadius } = useTheme();
  const router = useRouter();

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(24);
  const propsOpacity = useSharedValue(0);
  const propsTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    contentTranslateY.value = withSpring(0, { damping: 15, stiffness: 200 });

    propsOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    propsTranslateY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 200 }));

    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const propsStyle = useAnimatedStyle(() => ({
    opacity: propsOpacity.value,
    transform: [{ translateY: propsTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <OnboardingHero
        imageUri="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80"
        heading="Your transformation starts here."
        subheading="TRANSFORMR is your AI-powered partner for total life transformation. Fitness. Nutrition. Business. Mindset. All in one place, all personalized to you."
        style={{ marginBottom: spacing.xl }}
      />

      {/* Value props */}
      <Animated.View style={[{ paddingHorizontal: spacing.xxl }, propsStyle]}>
        {VALUE_PROPS.map((prop, index) => (
          <View
            key={index}
            style={[
              styles.propRow,
              {
                backgroundColor: 'rgba(168,85,247,0.08)',
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                marginBottom: spacing.md,
                borderWidth: 1,
                borderColor: 'rgba(168,85,247,0.18)',
              },
            ]}
          >
            <Text style={{ fontSize: 22, marginRight: spacing.md }}>{prop.icon}</Text>
            <Text style={[typography.body, { color: '#C4B8E0', flex: 1, lineHeight: 20 }]}>
              {prop.text}
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[{ paddingHorizontal: spacing.xxl, marginTop: spacing.lg }, buttonStyle]}>
        <Button
          title="Let's Begin"
          onPress={() => router.push('/(auth)/onboarding/profile')}
          fullWidth
          size="lg"
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0C0A15' },
  propRow: { flexDirection: 'row', alignItems: 'center' },
});
