// =============================================================================
// TRANSFORMR -- OnboardingBackground
// Full-screen photography background with deep-space overlay.
// Used across all onboarding screens.
// =============================================================================

import { type ComponentType } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;

interface OnboardingBackgroundProps {
  imageUrl: string;
  blurHash?: string;
  /** Optional local asset (require()). When provided, used instead of imageUrl. */
  localSource?: number;
  /** Optional scroll offset shared value for subtle parallax on the background image. */
  scrollY?: SharedValue<number>;
  /** Override overlay darkness — 'light' for dark source photos, 'normal' (default) for most. */
  overlayIntensity?: 'light' | 'normal';
  children: React.ReactNode;
}

const OVERLAY_COLORS = {
  normal: ['rgba(12,10,21,0.15)', 'rgba(12,10,21,0.35)', 'rgba(12,10,21,0.70)'] as const,
  light: ['rgba(12,10,21,0.05)', 'rgba(12,10,21,0.20)', 'rgba(12,10,21,0.55)'] as const,
};

export function OnboardingBackground({ imageUrl, blurHash, localSource, scrollY, overlayIntensity = 'normal', children }: OnboardingBackgroundProps) {
  const parallaxStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    return { transform: [{ translateY: scrollY.value * 0.3 }] };
  });

  return (
    <View style={styles.container}>
      {/* Full-screen real photography background with optional parallax */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.parallaxImage, parallaxStyle]}>
        <Image
          source={localSource ?? { uri: imageUrl }}
          style={StyleSheet.absoluteFillObject}
          placeholder={blurHash ? { blurhash: blurHash } : undefined}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
      </Animated.View>
      {/* Deep Space overlay — light at top to show image, moderate at bottom for text */}
      <LinearGradient
        colors={OVERLAY_COLORS[overlayIntensity] as [string, string, string]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Content layer */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0A15' /* brand-ok */
  },
  parallaxImage: {
    top: -40,
    bottom: -40,
  },
  content: {
    flex: 1,
  },
});
