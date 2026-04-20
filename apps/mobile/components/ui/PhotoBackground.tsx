// =============================================================================
// TRANSFORMR -- PhotoBackground
// Photography hero with gradient overlay matching splash screen DNA.
// =============================================================================

import React from 'react';
import { View, StyleSheet, ImageSourcePropType, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';

interface PhotoBackgroundProps {
  source: ImageSourcePropType;
  children?: React.ReactNode;
  style?: ViewStyle;
  overlayOpacity?: number;
}

export function PhotoBackground({
  source,
  children,
  style,
  overlayOpacity = 1,
}: PhotoBackgroundProps) {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      {isDark ? (
        <LinearGradient
          colors={[
            `rgba(12,10,21,${0.80 * overlayOpacity})`,
            `rgba(12,10,21,${0.50 * overlayOpacity})`,
            `rgba(12,10,21,${0.75 * overlayOpacity})`,
          ]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(248,247,255,${0.85 * overlayOpacity})` },
          ]}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
