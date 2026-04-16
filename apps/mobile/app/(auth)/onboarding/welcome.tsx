// =============================================================================
// TRANSFORMR -- Onboarding: Welcome
// =============================================================================

import { useEffect, type ComponentType } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
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
import { OnboardingBackground } from '@components/ui/OnboardingBackground';
import { hapticMedium } from '@utils/haptics';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;

const HERO_URL = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80';
const BLUR_HASH = 'LKF}@q~q%MRj~qRjt7of4nWBM{WB';

const VALUE_PROPS = [
  { icon: '\uD83D\uDCAA', text: 'AI-powered workout tracking with ghost sets and PR detection' },
  { icon: '\uD83C\uDF4E', text: 'Smart nutrition logging via camera, barcode, and voice' },
  { icon: '\uD83D\uDCB0', text: 'Business and revenue tracking alongside your fitness goals' },
  { icon: '\uD83D\uDC65', text: 'Partner accountability with live sync and challenges' },
] as const;

export default function WelcomeScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();

  const propsOpacity = useSharedValue(0);
  const propsTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    propsOpacity.value = withDelay(300, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    propsTranslateY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 200 }));
    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const propsStyle = useAnimatedStyle(() => ({
    opacity: propsOpacity.value,
    transform: [{ translateY: propsTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <OnboardingBackground imageUrl={HERO_URL} blurHash={BLUR_HASH}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon + Headline */}
        <View style={styles.heroSection}>
          <Image
            source={require('@assets/images/transformr-icon.png')}
            style={styles.icon}
            contentFit="contain"
          />
          <Text style={styles.headline}>Your transformation{'\n'}starts right now.</Text>
          <Text style={styles.subheadline}>
            TRANSFORMR is your AI-powered partner for total life transformation. Fitness. Nutrition. Business. Mindset. All in one place.
          </Text>
        </View>

        {/* Value props */}
        <Animated.View style={[{ paddingHorizontal: spacing.xxl }, propsStyle]}>
          {VALUE_PROPS.map((prop, index) => (
            <View
              key={index}
              style={[
                styles.propRow,
                {
                  backgroundColor: 'rgba(168,85,247,0.12)',
                  borderRadius: borderRadius.md,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                  borderWidth: 1,
                  borderColor: 'rgba(168,85,247,0.22)',
                },
              ]}
            >
              <Text style={{ fontSize: 22, marginRight: spacing.md }}>{prop.icon}</Text>
              <Text style={[typography.body, { color: colors.text.secondary, flex: 1, lineHeight: 20 }]}>
                {prop.text}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[{ paddingHorizontal: spacing.xxl, marginTop: spacing.lg }, buttonStyle]}>
          <Button
            title="Let's Begin"
            onPress={() => { void hapticMedium(); router.push('/(auth)/onboarding/profile'); }}
            fullWidth
            size="lg"
            accessibilityLabel="Begin onboarding"
          />
        </Animated.View>
      </ScrollView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 100, paddingBottom: 40 },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  icon: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F0F0FC',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 38,
  },
  subheadline: {
    fontSize: 15,
    color: 'rgba(240, 240, 252, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  propRow: { flexDirection: 'row', alignItems: 'center' },
});
