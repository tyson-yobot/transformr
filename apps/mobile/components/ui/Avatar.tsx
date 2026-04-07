import React, { useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { useTheme } from '@theme/index';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: AvatarSize;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

const FONT_SCALE: Record<AvatarSize, number> = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 32,
};

const INDICATOR_SIZE: Record<AvatarSize, number> = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export function Avatar({
  source,
  name,
  size = 'md',
  showOnlineIndicator = false,
  isOnline = false,
  style,
}: AvatarProps) {
  const { colors, borderRadius } = useTheme();
  const [imageError, setImageError] = useState(false);
  const dimension = SIZE_MAP[size];

  const initials = useMemo(() => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
  }, [name]);

  const bgColor = useMemo(() => {
    if (!name) return colors.background.tertiary;
    // Deterministic color from name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const palette = [
      colors.accent.primary,
      colors.accent.secondary,
      colors.accent.success,
      colors.accent.info,
      colors.accent.fire,
      colors.accent.pink,
    ];
    const index = Math.abs(hash) % palette.length;
    return palette[index] ?? colors.accent.primary;
  }, [name, colors]);

  const indicatorDim = INDICATOR_SIZE[size];
  const showImage = source && !imageError;

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: bgColor,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={name ? `${name} avatar` : 'Avatar'}
    >
      {showImage ? (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: FONT_SCALE[size],
              color: '#FFFFFF',
            },
          ]}
        >
          {initials}
        </Text>
      )}
      {showOnlineIndicator && (
        <View
          style={[
            styles.indicator,
            {
              width: indicatorDim,
              height: indicatorDim,
              borderRadius: indicatorDim / 2,
              backgroundColor: isOnline ? colors.accent.success : colors.text.muted,
              borderColor: colors.background.primary,
              borderWidth: 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
