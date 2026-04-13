// =============================================================================
// TRANSFORMR -- OnboardingHero
// Displays a hero image (top 35%) with a gradient fade into the dark background.
// =============================================================================

import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
      {/* Hero image — top 35% */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
          transition={400}
        />
        <LinearGradient
          colors={['transparent', colors.background.primary as string]}
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
  },
});
