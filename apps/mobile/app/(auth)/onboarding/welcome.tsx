// =============================================================================
// TRANSFORMR -- Onboarding: Welcome
// =============================================================================

import { useEffect, type ComponentType } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { OnboardingBackground } from '@components/ui/OnboardingBackground';
import { hapticMedium } from '@utils/haptics';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;

const HERO_URL = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80';
const BLUR_HASH = 'LKF}@q~q%MRj~qRjt7of4nWBM{WB';

const VALUE_PROPS = [
  { icon: '\uD83D\uDCAA', text: 'AI-powered workout tracking with ghost sets and PR detection', accent: '#A855F7' },
  { icon: '\uD83C\uDF4E', text: 'Smart nutrition logging via camera, barcode, and voice', accent: '#22C55E' },
  { icon: '\uD83D\uDCB0', text: 'Business and revenue tracking alongside your fitness goals', accent: '#F59E0B' },
  { icon: '\uD83D\uDC65', text: 'Partner accountability with live sync and challenges', accent: '#EC4899' },
] as const;

export default function WelcomeScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
    },
  });

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
    <OnboardingBackground imageUrl={HERO_URL} blurHash={BLUR_HASH} localSource={require('@assets/images/gym-hero.jpg')} scrollY={scrollY}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Icon + Headline — matches SplashOverlay glow treatment */}
        <View style={styles.heroSection}>
          <View style={styles.logoSection}>
            <View style={styles.iconGlowOuter} />
            <View style={styles.iconGlow} />
            <Image
              source={require('@assets/icons/transformr-icon.png')}
              style={styles.icon}
              contentFit="contain"
            />
          </View>
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
                  backgroundColor: 'rgba(168,85,247,0.10)',
                  borderRadius: borderRadius.md,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                  borderWidth: 1,
                  borderColor: `${prop.accent}30`,
                  shadowColor: prop.accent,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.12,
                  shadowRadius: 10,
                  elevation: 3,
                },
              ]}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${prop.accent}22`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}>
                <Text style={{ fontSize: 22 }}>{prop.icon}</Text>
              </View>
              <Text style={[typography.body, { color: colors.text.primary, flex: 1, lineHeight: 22, fontSize: 15 }]}>
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
      </Animated.ScrollView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {},
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    height: 100,
    width: 200,
  },
  iconGlowOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,85,247,0.08)',
    top: -50,
  },
  iconGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(168,85,247,0.18)',
    top: -25,
  },
  icon: {
    width: 100,
    height: 100,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F0F0FC' /* brand-ok */,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 38,
  },
  subheadline: {
    fontSize: 15,
    color: 'rgba(240, 240, 252, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  propRow: { flexDirection: 'row', alignItems: 'center' },
});
