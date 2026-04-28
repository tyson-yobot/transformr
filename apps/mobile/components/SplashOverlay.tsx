// =============================================================================
// TRANSFORMR -- Branded Splash Overlay
// Matches the login screen's visual identity: gym background, gradient,
// logo, TRANSFORMR text, tagline, and "By Automate AI" attribution.
// =============================================================================

import { type ComponentType } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const GYM_IMAGE = require('@assets/images/gym-hero.jpg') as number;
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const LOGO = require('@assets/icons/transformr-icon.png') as number;

interface SplashOverlayProps {
  visible: boolean;
  /** Called after the overlay's first layout paint — use to hide the native splash screen. */
  onReady?: () => void;
}

export function SplashOverlay({ visible, onReady }: SplashOverlayProps) {
  if (!visible) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(400)}
      style={styles.container}
      pointerEvents="none"
      onLayout={() => { onReady?.(); }}
    >
      {/* Gym background — same as login screen */}
      <Image
        source={GYM_IMAGE}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      {/* Dark gradient overlay — same treatment as login screen */}
      <LinearGradient
        colors={[
          'rgba(12,10,21,0.10)',
          'rgba(12,10,21,0.35)',
          'rgba(12,10,21,0.80)',
          'rgba(12,10,21,0.95)',
          '#0C0A15',
        ]}
        locations={[0, 0.25, 0.45, 0.65, 0.80]}
        style={StyleSheet.absoluteFill}
      />

      {/* Centered brand content */}
      <View style={styles.content}>
        {/* Logo glow effects — matches login screen */}
        <View style={styles.logoSection}>
          <View style={styles.iconGlowOuter} />
          <View style={styles.iconGlow} />
          <Image
            source={LOGO}
            style={styles.icon}
            contentFit="contain"
          />
        </View>

        {/* TRANSFORMR title with glow — matches login screen */}
        <View style={styles.brandBlock}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.heroTitle, styles.heroTitleGlow]}>
              TRANSFORM<Text style={{ color: 'rgba(236,72,153,0.3)' }}>R</Text>
            </Text>
            <Text style={styles.heroTitle}>
              TRANSFORM<Text style={{ color: '#EC4899' /* brand pink */ }}>R</Text>
            </Text>
          </View>
          <Text style={styles.tagline}>
            Transform Everything
          </Text>
        </View>
      </View>

      {/* "By Automate AI" at the bottom */}
      <View style={styles.bottomAttribution}>
        <Text style={styles.attributionText}>By Automate AI</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: '#0C0A15' /* brand-ok — fallback while image loads */,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  // Logo — matches login screen logoSection
  logoSection: { alignItems: 'center', marginBottom: 8 },
  iconGlowOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignSelf: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,85,247,0.25)',
    alignSelf: 'center',
  },
  icon: { width: 140, height: 140 },
  // Brand text — matches login screen
  brandBlock: { alignItems: 'center', marginBottom: 16 },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#E2CBFF' /* brand-ok */,
    letterSpacing: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(168,85,247,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  heroTitleGlow: {
    position: 'absolute',
    color: 'rgba(168,85,247,0.3)',
    textShadowRadius: 50,
    textShadowColor: 'rgba(168,85,247,0.6)',
  },
  tagline: {
    fontSize: 14,
    color: '#B8A8D8' /* brand-ok */,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Bottom attribution
  bottomAttribution: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  attributionText: {
    fontSize: 13,
    color: '#6B5E8A' /* brand-ok */,
    letterSpacing: 1,
    fontWeight: '500',
  },
});
