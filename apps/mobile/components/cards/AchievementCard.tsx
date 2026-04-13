import { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';

interface AchievementCardProps {
  icon: string;
  title: string;
  description: string;
  tier: AchievementTier;
  earnedDate?: string;
  isNewUnlock?: boolean;
  style?: ViewStyle;
}

const tierConfig: Record<
  AchievementTier,
  { label: string; emoji: string }
> = {
  bronze: { label: 'Bronze', emoji: '\uD83E\uDD49' },
  silver: { label: 'Silver', emoji: '\uD83E\uDD48' },
  gold: { label: 'Gold', emoji: '\uD83E\uDD47' },
  diamond: { label: 'Diamond', emoji: '\uD83D\uDC8E' },
};

function getTierColor(
  tier: AchievementTier,
  colors: ReturnType<typeof import('@theme/index').useTheme>['colors'],
): string {
  switch (tier) {
    case 'bronze':
      return '#CD7F32';
    case 'silver':
      return '#C0C0C0';
    case 'gold':
      return colors.accent.gold;
    case 'diamond':
      return '#B9F2FF';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AchievementCard({
  icon,
  title,
  description,
  tier,
  earnedDate,
  isNewUnlock = false,
  style,
}: AchievementCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const tierColor = getTierColor(tier, colors);
  const { label: tierLabel, emoji: tierEmoji } = tierConfig[tier];

  // Unlock animation values
  const unlockScale = useSharedValue(isNewUnlock ? 0 : 1);
  const unlockOpacity = useSharedValue(isNewUnlock ? 0 : 1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isNewUnlock) {
      unlockOpacity.value = withTiming(1, { duration: 300 });
      unlockScale.value = withSequence(
        withSpring(1.15, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 300 }),
      );
      glowOpacity.value = withSequence(
        withDelay(200, withTiming(0.6, { duration: 300 })),
        withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [isNewUnlock, unlockScale, unlockOpacity, glowOpacity]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: unlockOpacity.value,
    transform: [{ scale: unlockScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: `${tierColor}40`,
        },
        cardAnimStyle,
        style,
      ]}
    >
      {/* Glow overlay for unlock */}
      {isNewUnlock ? (
        <Animated.View
          style={[
            styles.glowOverlay,
            {
              backgroundColor: tierColor,
              borderRadius: borderRadius.lg,
            },
            glowStyle,
          ]}
          pointerEvents="none"
        />
      ) : null}

      <View style={styles.topRow}>
        {/* Icon */}
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: `${tierColor}20`,
              borderRadius: borderRadius.md,
              marginRight: spacing.md,
            },
          ]}
        >
          <Text style={{ fontSize: 28 }}>{icon}</Text>
        </View>

        {/* Title and description */}
        <View style={styles.textWrap}>
          <Text
            style={[typography.bodyBold, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.text.secondary, marginTop: spacing.xs },
            ]}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>
      </View>

      {/* Bottom row: tier + date */}
      <View style={[styles.bottomRow, { marginTop: spacing.md }]}>
        <View
          style={[
            styles.tierBadge,
            {
              backgroundColor: `${tierColor}20`,
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Text style={{ fontSize: 12, marginRight: spacing.xs }}>
            {tierEmoji}
          </Text>
          <Text style={[typography.captionBold, { color: tierColor }]}>
            {tierLabel}
          </Text>
        </View>

        {earnedDate ? (
          <Text style={[typography.tiny, { color: colors.text.muted }]}>
            {formatDate(earnedDate)}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
