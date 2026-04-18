// =============================================================================
// TRANSFORMR -- HeroCard Component
// Wraps children with an optional blurred photo backdrop + gradient overlay.
// No heroImage prop → renders like a plain View (zero visual regression).
// =============================================================================

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';

// Neutral deep-purple haze — color-accurate placeholder during load
const DEFAULT_BLURHASH = 'L03A-:of00j[_3j[00j[M{j[WBj[';

// expo-image <Image source> accepts ImageSource | string | number (local require).
// We expose the same union so callers can pass require('../assets/...) directly.
type HeroImageSource = ImageSource | string | number;

interface HeroCardProps {
  children: React.ReactNode;
  heroImage?: HeroImageSource;
  heroBlurRadius?: number;
  heroBlurhash?: string;
  style?: StyleProp<ViewStyle>;
}

export function HeroCard({
  children,
  heroImage,
  heroBlurRadius = 28,
  heroBlurhash,
  style,
}: HeroCardProps): React.ReactElement {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Reset error state when the image source changes so a new valid image isn't suppressed
  useEffect(() => { setImageError(false); }, [heroImage]);

  const showHeroLayer = !!heroImage && !imageError;

  const gradientColors: [string, string] = isDark
    ? ['rgba(12,10,21,0.72)', 'rgba(19,16,43,0.88)']
    : ['rgba(239,237,255,0.82)', 'rgba(239,237,255,0.92)'];

  return (
    <View style={[styles.root, style]}>
      {showHeroLayer && (
        <>
          <Image
            source={heroImage as ImageSource | string | number}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            blurRadius={heroBlurRadius}
            transition={300}
            placeholder={{ blurhash: heroBlurhash ?? DEFAULT_BLURHASH }}
            onError={() => setImageError(true)}
          />
          <LinearGradient
            colors={gradientColors}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
});
