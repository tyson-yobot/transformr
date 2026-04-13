// =============================================================================
// TRANSFORMR -- Share Card
// =============================================================================

import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ShareCardType =
  | 'pr'
  | 'streak'
  | 'weekly_grade'
  | 'weight_milestone'
  | 'challenge_complete'
  | 'achievement';

interface ShareCardData {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
}

interface ShareCardProps {
  type: ShareCardType;
  data: ShareCardData;
  onShare: () => void;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAGLINES: string[] = [
  'Built different.',
  'Consistency wins.',
  'The work speaks.',
  'No shortcuts.',
  'Every rep counts.',
];

const TYPE_ICONS: Record<ShareCardType, string> = {
  pr: '\uD83C\uDFC6',
  streak: '\uD83D\uDD25',
  weekly_grade: '\uD83D\uDCCA',
  weight_milestone: '\u2696\uFE0F',
  challenge_complete: '\u2705',
  achievement: '\u2B50',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShareCard({ type, data, onShare, onDismiss }: ShareCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const tagline = useMemo(() => {
    const index = Math.floor(Math.random() * TAGLINES.length);
    return TAGLINES[index];
  }, []);

  const displayIcon = data.icon ?? TYPE_ICONS[type];

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={styles.wrapper}
    >
      {/* Dismiss button */}
      <Pressable
        onPress={onDismiss}
        style={[
          styles.dismissButton,
          {
            backgroundColor: colors.background.tertiary,
            borderRadius: borderRadius.full,
          },
        ]}
        accessibilityLabel="Close share card"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={20} color={colors.text.secondary} />
      </Pressable>

      {/* Card body (ViewShot-ready) */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.primary,
            borderRadius: borderRadius.xl,
            borderTopWidth: 3,
            borderTopColor: colors.accent.primary,
            overflow: 'hidden',
          },
        ]}
      >
        {/* Gradient overlay (subtle tinted layers) */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.accent.primaryDim, opacity: 0.5 },
          ]}
          pointerEvents="none"
        />

        <View style={[styles.cardContent, { padding: spacing.xxl }]}>
          {/* Logo */}
          <Text
            style={[
              typography.captionBold,
              {
                color: colors.accent.primary,
                letterSpacing: 2,
                textAlign: 'center',
                textTransform: 'uppercase',
              },
            ]}
          >
            TRANSFORMR
          </Text>

          {/* Icon */}
          <Text style={[styles.icon, { marginTop: spacing.xl }]}>
            {displayIcon}
          </Text>

          {/* Large stat value */}
          <Text
            style={[
              typography.hero,
              {
                color: colors.text.primary,
                textAlign: 'center',
                marginTop: spacing.lg,
                fontSize: 40,
                fontWeight: '800',
              },
            ]}
          >
            {data.value}
          </Text>

          {/* Title */}
          <Text
            style={[
              typography.h3,
              {
                color: colors.text.primary,
                textAlign: 'center',
                marginTop: spacing.sm,
              },
            ]}
          >
            {data.title}
          </Text>

          {/* Subtitle */}
          {data.subtitle ? (
            <Text
              style={[
                typography.caption,
                {
                  color: colors.text.muted,
                  textAlign: 'center',
                  marginTop: spacing.xs,
                },
              ]}
            >
              {data.subtitle}
            </Text>
          ) : null}

          {/* Divider */}
          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.border.subtle,
                marginVertical: spacing.xl,
              },
            ]}
          />

          {/* Tagline */}
          <Text
            style={[
              typography.captionBold,
              {
                color: colors.text.secondary,
                textAlign: 'center',
                fontStyle: 'italic',
              },
            ]}
          >
            {tagline}
          </Text>
        </View>
      </View>

      {/* Share button */}
      <Pressable
        onPress={onShare}
        style={[
          styles.shareButton,
          {
            backgroundColor: colors.accent.primary,
            borderRadius: borderRadius.md,
            paddingVertical: spacing.lg,
            marginTop: spacing.lg,
          },
        ]}
        accessibilityLabel="Share achievement"
        accessibilityRole="button"
      >
        <Ionicons
          name="share-outline"
          size={20}
          color={colors.text.primary}
          style={{ marginRight: spacing.sm }}
        />
        <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
          Share
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  dismissButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
  },
  cardContent: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
  },
  divider: {
    width: '40%',
    height: 1,
    alignSelf: 'center',
  },
  shareButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
