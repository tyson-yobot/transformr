import { useCallback } from 'react';
import { View, Text, Image, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

interface PartnerCardProps {
  partnerName: string;
  avatarUrl?: string;
  currentActivity?: string;
  jointStreak: number;
  onNudge: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PartnerCard({
  partnerName,
  avatarUrl,
  currentActivity,
  jointStreak,
  onNudge,
  style,
}: PartnerCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const nudgeScale = useSharedValue(1);

  const nudgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nudgeScale.value }],
  }));

  const handleNudgePress = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    nudgeScale.value = withSpring(0.9, { damping: 8, stiffness: 400 }, () => {
      nudgeScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    });
    onNudge();
  }, [onNudge, nudgeScale]);

  const initials = partnerName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      <View style={styles.topRow}>
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: borderRadius.full,
              marginRight: spacing.md,
            },
          ]}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[styles.avatarImage, { borderRadius: borderRadius.full }]}
            />
          ) : (
            <Text style={[typography.bodyBold, { color: '#FFFFFF' /* brand-ok */
              {initials}
            </Text>
          )}
        </View>

        {/* Name and activity */}
        <View style={styles.infoWrap}>
          <Text
            style={[typography.bodyBold, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {partnerName}
          </Text>
          {currentActivity ? (
            <View style={[styles.activityRow, { marginTop: spacing.xs }]}>
              <View
                style={[
                  styles.activityDot,
                  { backgroundColor: colors.accent.success },
                ]}
              />
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.secondary, marginLeft: spacing.xs },
                ]}
                numberOfLines={1}
              >
                {currentActivity}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                typography.caption,
                { color: colors.text.muted, marginTop: spacing.xs },
              ]}
            >
              Offline
            </Text>
          )}
        </View>
      </View>

      {/* Bottom row: streak + nudge */}
      <View style={[styles.bottomRow, { marginTop: spacing.lg }]}>
        {/* Streak */}
        <View style={[styles.streakWrap, { gap: spacing.xs }]}>
          <Text style={{ fontSize: 18 }}>{'\uD83D\uDD25'}</Text>
          <Text style={[typography.bodyBold, { color: colors.accent.fire }]}>
            {jointStreak}
          </Text>
          <Text style={[typography.caption, { color: colors.text.secondary }]}>
            day streak
          </Text>
        </View>

        {/* Nudge button */}
        <AnimatedPressable
          onPress={handleNudgePress}
          style={[
            styles.nudgeButton,
            {
              backgroundColor: `${colors.accent.primary}20`,
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            },
            nudgeAnimStyle,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Nudge ${partnerName}`}
        >
          <Text style={{ fontSize: 16, marginRight: spacing.xs }}>
            {'\uD83D\uDC4B'}
          </Text>
          <Text
            style={[
              typography.captionBold,
              { color: colors.accent.primary },
            ]}
          >
            Nudge
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
  },
  infoWrap: {
    flex: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nudgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
