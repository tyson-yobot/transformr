// =============================================================================
// TRANSFORMR -- PremiumEmptyState
// Photography-backed empty state with motivating copy and CTA.
// Falls back to icon if image source is not provided.
// =============================================================================

import React from 'react';
import { View, Text, ViewStyle, ImageSourcePropType } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { PhotoBackground } from './PhotoBackground';
import { GlowButton } from './GlowButton';

interface PremiumEmptyStateProps {
  image?: ImageSourcePropType;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
  style?: ViewStyle;
}

export function PremiumEmptyState({
  image,
  icon,
  iconColor,
  title,
  subtitle,
  ctaLabel,
  onCta,
  style,
}: PremiumEmptyStateProps) {
  const { colors } = useTheme();
  const accent = iconColor ?? colors.accent.primary;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
    }, style]}>
      {image ? (
        <PhotoBackground
          source={image}
          style={{
            width: 220,
            height: 160,
            borderRadius: 16,
            marginBottom: 24,
          }}
        />
      ) : icon ? (
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: `${accent}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          borderWidth: 1,
          borderColor: `${accent}25`,
          shadowColor: accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
        }}>
          <Ionicons name={icon} size={36} color={accent} />
        </View>
      ) : null}

      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: 8,
      }}>
        {title}
      </Text>

      <Text style={{
        fontSize: 14,
        color: colors.text.secondary,
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 22,
        marginBottom: ctaLabel ? 24 : 0,
      }}>
        {subtitle}
      </Text>

      {ctaLabel && onCta && (
        <GlowButton title={ctaLabel} onPress={onCta} />
      )}
    </Animated.View>
  );
}
