import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  FadeInRight,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import type { LiveWorkoutSync } from '../../types/database';

type WorkoutStatus = 'resting' | 'active' | 'completed';

interface ReactionOption {
  emoji: string;
  label: string;
}

interface LiveWorkoutFeedProps {
  partnerName: string;
  syncData: LiveWorkoutSync[];
  currentStatus: WorkoutStatus;
  onReact: (emoji: string) => void;
  style?: ViewStyle;
}

const REACTIONS: ReactionOption[] = [
  { emoji: '\u{1F4AA}', label: 'Flex' },
  { emoji: '\u{1F525}', label: 'Fire' },
  { emoji: '\u{1F44F}', label: 'Clap' },
  { emoji: '\u{1F680}', label: 'Rocket' },
  { emoji: '\u{26A1}', label: 'Lightning' },
];

const STATUS_CONFIG: Record<WorkoutStatus, { label: string; emoji: string }> = {
  active: { label: 'Working Out', emoji: '\u{1F3CB}' },
  resting: { label: 'Resting', emoji: '\u{23F8}' },
  completed: { label: 'Workout Done', emoji: '\u{2705}' },
};

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.pulsingDot,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

export function LiveWorkoutFeed({
  partnerName,
  syncData,
  currentStatus,
  onReact,
  style,
}: LiveWorkoutFeedProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const statusConfig = STATUS_CONFIG[currentStatus];

  const statusColor = useMemo(() => {
    switch (currentStatus) {
      case 'active':
        return colors.accent.success;
      case 'resting':
        return colors.accent.warning;
      case 'completed':
        return colors.accent.info;
    }
  }, [currentStatus, colors.accent]);

  const latestSync = syncData.length > 0 ? syncData[syncData.length - 1] : null;

  const handleReaction = useCallback(
    (emoji: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onReact(emoji);
    },
    [onReact],
  );

  const renderSyncItem = useCallback(
    ({ item, index }: { item: LiveWorkoutSync; index: number }) => {
      const isLatest = index === syncData.length - 1;

      return (
        <Animated.View
          entering={FadeInRight.delay(index * 50).duration(300).springify()}
          style={[
            styles.syncItem,
            {
              backgroundColor: isLatest
                ? `${colors.accent.primary}10`
                : colors.background.tertiary,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.sm,
              borderLeftWidth: 3,
              borderLeftColor: isLatest ? colors.accent.primary : colors.border.subtle,
            },
          ]}
        >
          <View style={styles.syncHeader}>
            <Text
              style={[typography.bodyBold, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {item.exercise_name ?? 'Unknown Exercise'}
            </Text>
            <StatusBadge
              status={(item.status ?? 'active') as WorkoutStatus}
              colors={colors}
              typography={typography}
              spacing={spacing}
              borderRadius={borderRadius}
            />
          </View>

          <View style={[styles.syncDetails, { marginTop: spacing.sm }]}>
            {item.set_number != null ? (
              <Text style={[typography.caption, { color: colors.text.secondary }]}>
                Set {item.set_number}
              </Text>
            ) : null}
            {item.reps != null ? (
              <Text style={[typography.caption, { color: colors.text.secondary, marginLeft: spacing.md }]}>
                {item.reps} reps
              </Text>
            ) : null}
            {item.weight != null ? (
              <Text style={[typography.caption, { color: colors.accent.fire, marginLeft: spacing.md }]}>
                {item.weight} lbs
              </Text>
            ) : null}
          </View>
        </Animated.View>
      );
    },
    [syncData.length, colors, typography, spacing, borderRadius],
  );

  const keyExtractor = useCallback((item: LiveWorkoutSync) => item.id, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
        },
        style,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${partnerName}'s live workout: ${statusConfig.label}`}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <PulsingDot color={statusColor} />
          <Text style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}>
            {partnerName}
          </Text>
        </View>
        <View
          style={[
            styles.statusChip,
            {
              backgroundColor: `${statusColor}20`,
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Text style={[typography.captionBold, { color: statusColor }]}>
            {statusConfig.emoji} {statusConfig.label}
          </Text>
        </View>
      </View>

      {latestSync && currentStatus !== 'completed' ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.currentExercise,
            {
              backgroundColor: `${colors.accent.primary}08`,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginTop: spacing.lg,
              borderWidth: 1,
              borderColor: `${colors.accent.primary}20`,
            },
          ]}
        >
          <Text style={[typography.tiny, { color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1 }]}>
            CURRENT EXERCISE
          </Text>
          <Text style={[typography.h2, { color: colors.text.primary, marginTop: spacing.xs }]}>
            {latestSync.exercise_name ?? 'Unknown'}
          </Text>
          <View style={[styles.currentStats, { marginTop: spacing.md }]}>
            {latestSync.set_number != null ? (
              <View style={styles.statBlock}>
                <Text style={[typography.stat, { color: colors.accent.primary }]}>
                  {latestSync.set_number}
                </Text>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>SET</Text>
              </View>
            ) : null}
            {latestSync.reps != null ? (
              <View style={styles.statBlock}>
                <Text style={[typography.stat, { color: colors.accent.success }]}>
                  {latestSync.reps}
                </Text>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>REPS</Text>
              </View>
            ) : null}
            {latestSync.weight != null ? (
              <View style={styles.statBlock}>
                <Text style={[typography.stat, { color: colors.accent.fire }]}>
                  {latestSync.weight}
                </Text>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>LBS</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      {currentStatus === 'completed' ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[
            styles.completedBanner,
            {
              backgroundColor: `${colors.accent.success}15`,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginTop: spacing.lg,
              borderWidth: 1,
              borderColor: `${colors.accent.success}30`,
            },
          ]}
        >
          <Text style={{ fontSize: 32 }}>{'\u{1F3C6}'}</Text>
          <Text
            style={[
              typography.bodyBold,
              { color: colors.accent.success, marginTop: spacing.sm },
            ]}
          >
            {partnerName} finished their workout!
          </Text>
        </Animated.View>
      ) : null}

      <View style={[styles.reactionsRow, { marginTop: spacing.lg, gap: spacing.sm }]}>
        {REACTIONS.map((reaction) => (
          <ReactionButton
            key={reaction.emoji}
            emoji={reaction.emoji}
            label={reaction.label}
            onPress={() => handleReaction(reaction.emoji)}
            bgColor={colors.background.tertiary}
            borderRadiusValue={borderRadius.md}
            spacingValue={spacing}
          />
        ))}
      </View>

      {syncData.length > 1 ? (
        <View style={{ marginTop: spacing.lg }}>
          <Text
            style={[
              typography.captionBold,
              { color: colors.text.muted, marginBottom: spacing.sm },
            ]}
          >
            EXERCISE LOG
          </Text>
          <FlatList
            data={[...syncData].reverse()}
            renderItem={renderSyncItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
          />
        </View>
      ) : null}
    </View>
  );
}

interface StatusBadgeProps {
  status: WorkoutStatus;
  colors: ReturnType<typeof import('@theme/index').useTheme>['colors'];
  typography: ReturnType<typeof import('@theme/index').useTheme>['typography'];
  spacing: ReturnType<typeof import('@theme/index').useTheme>['spacing'];
  borderRadius: ReturnType<typeof import('@theme/index').useTheme>['borderRadius'];
}

function StatusBadge({ status, colors, typography, spacing, borderRadius }: StatusBadgeProps) {
  const color = status === 'active'
    ? colors.accent.success
    : status === 'resting'
      ? colors.accent.warning
      : colors.accent.info;

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: `${color}20`,
          borderRadius: borderRadius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
        },
      ]}
    >
      <Text style={[typography.tiny, { color }]}>
        {status}
      </Text>
    </View>
  );
}

interface ReactionButtonProps {
  emoji: string;
  label: string;
  onPress: () => void;
  bgColor: string;
  borderRadiusValue: number;
  spacingValue: { sm: number };
}

function ReactionButton({
  emoji,
  label,
  onPress,
  bgColor,
  borderRadiusValue,
  spacingValue,
}: ReactionButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.85, { damping: 10, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  }, [scale]);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.reactionButton,
          {
            backgroundColor: bgColor,
            borderRadius: borderRadiusValue,
            padding: spacingValue.sm,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Send ${label} reaction`}
      >
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusChip: {},
  currentExercise: {},
  currentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBlock: {
    alignItems: 'center',
  },
  completedBanner: {
    alignItems: 'center',
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reactionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
  },
  syncItem: {},
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {},
});
