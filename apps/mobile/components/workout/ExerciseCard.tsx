import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import { Badge } from '../ui/Badge';
import type { Exercise } from '../../types/database';

interface ExerciseCardProps {
  exercise: Exercise;
  targetSets?: number;
  targetReps?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const categoryBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  chest: 'danger',
  back: 'info',
  shoulders: 'warning',
  biceps: 'success',
  triceps: 'success',
  legs: 'danger',
  glutes: 'danger',
  abs: 'warning',
  cardio: 'info',
  compound: 'default',
  olympic: 'warning',
  stretching: 'success',
  mobility: 'success',
};

const equipmentLabels: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  bands: 'Bands',
  smith_machine: 'Smith Machine',
  trx: 'TRX',
  other: 'Other',
};

export const ExerciseCard = React.memo(function ExerciseCard({
  exercise,
  targetSets,
  targetReps,
  onPress,
  style,
}: ExerciseCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);
  const detailHeight = useSharedValue(0);

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const detailStyle = useAnimatedStyle(() => ({
    height: detailHeight.value,
    opacity: detailHeight.value > 0 ? 1 : 0,
    overflow: 'hidden' as const,
  }));

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      setExpanded((prev) => {
        const next = !prev;
        detailHeight.value = withTiming(next ? 120 : 0, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
        return next;
      });
    }
  }, [onPress, detailHeight]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const categoryVariant = exercise.category
    ? categoryBadgeVariant[exercise.category] ?? 'default'
    : 'default';

  const equipmentLabel = exercise.equipment
    ? equipmentLabels[exercise.equipment] ?? exercise.equipment
    : undefined;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
        },
        animatedScale,
        style,
      ]}
      accessibilityRole="button"
    >
      {/* Top row: name + category badge */}
      <View style={styles.topRow}>
        <View style={styles.nameWrap}>
          <Text
            style={[typography.bodyBold, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {exercise.name}
          </Text>
          {/* Muscle groups */}
          {exercise.muscle_groups.length > 0 ? (
            <Text
              style={[
                typography.caption,
                { color: colors.text.secondary, marginTop: spacing.xs },
              ]}
              numberOfLines={1}
            >
              {exercise.muscle_groups.join(', ')}
            </Text>
          ) : null}
        </View>

        {exercise.category ? (
          <Badge
            label={exercise.category}
            variant={categoryVariant}
            size="sm"
            style={{ marginLeft: spacing.sm }}
          />
        ) : null}
      </View>

      {/* Meta row: equipment + sets/reps */}
      <View style={[styles.metaRow, { marginTop: spacing.md, gap: spacing.md }]}>
        {equipmentLabel ? (
          <View style={styles.metaItem}>
            <Text style={[typography.tiny, { color: colors.text.muted }]}>
              Equipment
            </Text>
            <Text
              style={[
                typography.captionBold,
                { color: colors.text.primary, marginTop: 2 },
              ]}
            >
              {equipmentLabel}
            </Text>
          </View>
        ) : null}

        {targetSets !== undefined ? (
          <View style={styles.metaItem}>
            <Text style={[typography.tiny, { color: colors.text.muted }]}>
              Sets
            </Text>
            <Text
              style={[
                typography.captionBold,
                { color: colors.text.primary, marginTop: 2 },
              ]}
            >
              {targetSets}
            </Text>
          </View>
        ) : null}

        {targetReps ? (
          <View style={styles.metaItem}>
            <Text style={[typography.tiny, { color: colors.text.muted }]}>
              Reps
            </Text>
            <Text
              style={[
                typography.captionBold,
                { color: colors.text.primary, marginTop: 2 },
              ]}
            >
              {targetReps}
            </Text>
          </View>
        ) : null}

        {exercise.difficulty ? (
          <View style={styles.metaItem}>
            <Text style={[typography.tiny, { color: colors.text.muted }]}>
              Level
            </Text>
            <Text
              style={[
                typography.captionBold,
                { color: colors.text.primary, marginTop: 2 },
              ]}
            >
              {exercise.difficulty}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Expandable details */}
      <Animated.View style={detailStyle}>
        <View style={[styles.detailContent, { paddingTop: spacing.md }]}>
          {exercise.instructions ? (
            <View style={{ marginBottom: spacing.sm }}>
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.text.secondary, marginBottom: spacing.xs },
                ]}
              >
                Instructions
              </Text>
              <Text
                style={[typography.caption, { color: colors.text.primary }]}
                numberOfLines={3}
              >
                {exercise.instructions}
              </Text>
            </View>
          ) : null}
          {exercise.tips ? (
            <View>
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.text.secondary, marginBottom: spacing.xs },
                ]}
              >
                Tips
              </Text>
              <Text
                style={[typography.caption, { color: colors.text.primary }]}
                numberOfLines={2}
              >
                {exercise.tips}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      {/* Expand indicator */}
      {!onPress ? (
        <Text
          style={[
            typography.tiny,
            {
              color: colors.text.muted,
              textAlign: 'center',
              marginTop: spacing.sm,
            },
          ]}
        >
          {expanded ? 'Tap to collapse' : 'Tap for details'}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {},
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  nameWrap: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {},
  detailContent: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
});
