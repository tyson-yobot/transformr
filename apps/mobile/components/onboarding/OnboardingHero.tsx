// =============================================================================
// TRANSFORMR -- OnboardingHero
// Hero image (top 40% of screen) with gradient fade into Deep Space (#0C0A15).
// Dots progress overlay sits on top (rendered by _layout.tsx).
// =============================================================================

import { type ComponentType } from 'react';
import { View, Text, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';
// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;

const DEEP_SPACE = '#0C0A15'; /* brand-ok */
const BLUR_HASH = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';

interface OnboardingHeroProps {
  imageUri: string | number;
  heading: string;
  subheading: string;
  style?: ViewStyle;
}

export function OnboardingHero({ imageUri, heading, subheading, style }: OnboardingHeroProps) {
  const { typography, spacing } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const imageHeight = screenHeight * 0.4;

  return (
    <View style={[style]}>
      {/* Hero image — edge-to-edge, top 40% */}
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        <Image
          source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          placeholder={{ blurhash: BLUR_HASH }}
          transition={300}
        />
        {/* Gradient over bottom half: transparent → Deep Space */}
        <LinearGradient
          colors={['transparent', DEEP_SPACE]}
          locations={[0.4, 1]}
          style={styles.fadeOut}
        />
      </View>

      {/* Heading block */}
      <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.lg }}>
        <Text style={[typography.h1, { color: '#F0F0FC', marginBottom: spacing.sm }]}>{/* brand-ok — near-white on always-dark onboarding */}
          {heading}
        </Text>
        <Text style={[typography.body, { color: '#9B8FC0', lineHeight: 22 }]}>{/* brand-ok — muted lavender on always-dark onboarding */}
          {subheading}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fadeOut: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
});
