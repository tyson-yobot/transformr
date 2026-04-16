// =============================================================================
// TRANSFORMR -- Entry Redirect + Branded Splash
// =============================================================================

import { useEffect, useCallback, useRef, type ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@stores/authStore';
import { useProfileStore } from '@stores/profileStore';
import { useSettingsStore } from '@stores/settingsStore';
import { useGamificationStore } from '@stores/gamificationStore';
// Local asset — guaranteed resolvable by Metro within project root
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const ICON = require('../assets/images/transformr-icon.png') as number;
// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const HERO_IMAGE = require('../assets/images/gym-hero.jpg') as number;

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const router = useRouter();
  const hasNavigated = useRef(false);

  // Icon pulse: scale 1.0 → 1.03 → 1.0, 2s loop
  const scale = useSharedValue(1);
  // Fade-out on transition
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const navigate = useCallback((path: Parameters<typeof router.replace>[0]) => {
    opacity.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) });
    setTimeout(() => router.replace(path), 320);
  }, [router, opacity]);

  useEffect(() => {
    if (loading) return;
    if (hasNavigated.current) return;

    if (!session) {
      hasNavigated.current = true;
      navigate('/(auth)/login');
      return;
    }

    // User is authenticated — check onboarding status
    fetchProfile()
      .then(() => {
        const currentProfile = useProfileStore.getState().profile;

        // Hydrate local stores from profile so settings follow the user across devices
        if (currentProfile) {
          useSettingsStore.getState().loadFromProfile(currentProfile);
          if (currentProfile.coaching_tone) {
            useGamificationStore.getState().setTone(currentProfile.coaching_tone);
          }
        }

        if (!currentProfile?.onboarding_completed) {
          hasNavigated.current = true;
          navigate('/(auth)/onboarding/welcome');
          return;
        }

        // Check if daily briefing should be shown
        const { briefingEnabled, lastBriefingDate } = useSettingsStore.getState();
        const today = new Date().toDateString();
        hasNavigated.current = true;
        if (briefingEnabled && lastBriefingDate !== today) {
          navigate('/daily-briefing');
        } else {
          navigate('/(tabs)/dashboard');
        }
      })
      .catch(() => {
        // Profile fetch failed — go to onboarding (profile will be created on first save)
        hasNavigated.current = true;
        navigate('/(auth)/onboarding/welcome');
      });
  }, [session, loading, fetchProfile, navigate]);

  return (
    <Animated.View style={[styles.root, containerStyle]}>
      {/* Hero background photo */}
      <Image
        source={HERO_IMAGE}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        accessibilityIgnoresInvertColors
      />

      {/* Dark gradient overlay: lighter at top, heavier at bottom */}
      <LinearGradient
        colors={['rgba(12,10,21,0.6)', 'rgba(12,10,21,0.85)']}
        locations={[0, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Center content */}
      <View style={styles.center}>
        {/* Prism icon wrapped in Animated.View for scale pulse */}
        <Animated.View style={[styles.iconWrap, iconStyle]}>
          <Image
            source={ICON}
            style={styles.icon}
            contentFit="contain"
            accessibilityLabel="TRANSFORMR icon"
          />
        </Animated.View>

        {/* Brand name */}
        <Text style={styles.brandName} accessibilityRole="text" accessibilityLabel="TRANSFORMR">
          TRANSFORMR
        </Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Every rep. Every meal. Every dollar. Every day.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>By Automate AI</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgb(12,10,21)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F0F0FC', /* brand-ok */
    letterSpacing: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(138, 92, 246, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 13,
    color: '#9B8FC0', /* brand-ok */
    letterSpacing: 1.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#6B5E8A', /* brand-ok */
    letterSpacing: 1,
  },
});
