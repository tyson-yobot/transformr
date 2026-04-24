// =============================================================================
// TRANSFORMR -- OnboardingBackground
// Full-screen photography background with deep-space overlay.
// Used across all onboarding screens.
// =============================================================================

import { type ComponentType } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;

interface OnboardingBackgroundProps {
  imageUrl: string;
  blurHash?: string;
  /** Optional local asset (require()). When provided, used instead of imageUrl. */
  localSource?: number;
  children: React.ReactNode;
}

export function OnboardingBackground({ imageUrl, blurHash, localSource, children }: OnboardingBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Full-screen real photography background */}
      <Image
        source={localSource ?? { uri: imageUrl }}
        style={StyleSheet.absoluteFillObject}
        placeholder={blurHash ? { blurhash: blurHash } : undefined}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
      />
      {/* Deep Space overlay — top lighter, bottom darker for text readability */}
      <LinearGradient
        colors={['rgba(12,10,21,0.55)', 'rgba(12,10,21,0.75)', 'rgba(12,10,21,0.95)']}
        locations={[0, 0.5, 1]}
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
  content: {
    flex: 1,
  },
});
