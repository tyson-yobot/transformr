// =============================================================================
// TRANSFORMR -- OnboardingHero
// Hero image (top 240px) with a gradient fade into the dark background.
// =============================================================================

import { type ComponentType } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';
// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;
import { useTheme } from '@theme/index';

interface OnboardingHeroProps {
  imageUri: string;
  heading: string;
  subheading: string;
  style?: ViewStyle;
}

export function OnboardingHero({ imageUri, heading, subheading, style }: OnboardingHeroProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Hero image */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        {/* Gradient fade into background */}
        <LinearGradient
          colors={['transparent', colors.background.primary]}
          style={styles.fadeOut}
        />
      </View>

      {/* Heading block */}
      <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.lg }}>
        <Text style={[typography.h1, { color: colors.text.primary, marginBottom: spacing.sm }]}>
          {heading}
        </Text>
        <Text style={[typography.body, { color: colors.text.secondary }]}>
          {subheading}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  imageWrap: {
    height: 240,
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
    height: 80,
    opacity: 0.9,
  },
});
