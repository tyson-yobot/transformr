import React, { useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import { ProgressBar } from '../ui/ProgressBar';

interface MilestoneCardProps {
  title: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  style?: ViewStyle;
}

export function MilestoneCard({
  title,
  targetValue,
  currentValue,
  unit = '',
  isCompleted,
  onToggleComplete,
  style,
}: MilestoneCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const celebrationScale = useSharedValue(1);
  const celebrationOpacity = useSharedValue(0);
  const checkScale = useSharedValue(isCompleted ? 1 : 0.8);

  const progress = targetValue > 0
    ? Math.min(1, currentValue / targetValue)
    : 0;

  const playCelebration = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    celebrationOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 1200 }),
    );
    celebrationScale.value = withSequence(
      withSpring(1.05, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
  }, [celebrationOpacity, celebrationScale]);

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    checkScale.value = withSequence(
      withSpring(0.7, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );
    if (!isCompleted) {
      playCelebration();
    }
    onToggleComplete();
  }, [isCompleted, onToggleComplete, checkScale, playCelebration]);

  const celebrationStyle = useAnimatedStyle(() => ({
    opacity: celebrationOpacity.value,
    transform: [{ scale: celebrationScale.value }],
  }));

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
        },
        celebrationStyle,
        style,
      ]}
    >
      {/* Celebration overlay */}
      {isCompleted ? (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Text style={{ fontSize: 24 }}>{'\uD83C\uDF89'}</Text>
        </View>
      ) : null}

      <View style={styles.topRow}>
        {/* Checkbox */}
        <Pressable
          onPress={handleToggle}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
        >
          <Animated.View
            style={[
              styles.checkbox,
              {
                borderWidth: 2,
                borderColor: isCompleted
                  ? colors.accent.success
                  : colors.border.default,
                backgroundColor: isCompleted
                  ? colors.accent.success
                  : 'transparent',
                borderRadius: borderRadius.sm,
                marginRight: spacing.md,
              },
              checkAnimStyle,
            ]}
          >
            {isCompleted ? (
              <Text style={styles.checkMark}>{'\u2713'}</Text>
            ) : null}
          </Animated.View>
        </Pressable>

        {/* Title and progress text */}
        <View style={styles.textWrap}>
          <Text
            style={[
              typography.bodyBold,
              {
                color: isCompleted
                  ? colors.text.muted
                  : colors.text.primary,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.text.secondary, marginTop: spacing.xs },
            ]}
          >
            {currentValue}{unit} / {targetValue}{unit}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ marginTop: spacing.md }}>
        <ProgressBar
          progress={progress}
          color={isCompleted ? colors.accent.success : colors.accent.primary}
          height={6}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 8,
    right: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textWrap: {
    flex: 1,
  },
});
