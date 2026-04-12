import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'react-native-svg';
import Svg, { Defs, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { ProgressBar } from '../ui/ProgressBar';

interface CountdownCardProps {
  title: string;
  emoji?: string;
  targetDate: string;
  startDate: string;
  style?: ViewStyle;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
}

function getTimeRemaining(targetDate: string): TimeRemaining {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const totalMs = Math.max(0, target - now);

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, totalMs };
}

function getElapsedProgress(startDate: string, targetDate: string): number {
  const start = new Date(startDate).getTime();
  const target = new Date(targetDate).getTime();
  const now = Date.now();

  const totalDuration = target - start;
  if (totalDuration <= 0) return 1;

  const elapsed = now - start;
  return Math.max(0, Math.min(1, elapsed / totalDuration));
}

function NumberBlock({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const animValue = useSharedValue(value);

  useEffect(() => {
    animValue.value = withSpring(value, { damping: 12, stiffness: 120 });
  }, [value, animValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1, { damping: 15, stiffness: 300 }) }],
  }));

  return (
    <View style={styles.numberBlock}>
      <Animated.View
        style={[
          styles.numberContainer,
          {
            backgroundColor: `${colors.accent.primary}20`,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
          },
          animatedStyle,
        ]}
      >
        <Text
          style={[
            typography.countdown,
            {
              color: colors.text.primary,
              fontSize: 40,
            },
          ]}
        >
          {String(value).padStart(2, '0')}
        </Text>
      </Animated.View>
      <Text
        style={[
          typography.tiny,
          {
            color: colors.text.secondary,
            marginTop: spacing.xs,
            textTransform: 'uppercase',
            letterSpacing: 1,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function Separator() {
  const { colors, typography } = useTheme();

  return (
    <Text
      style={[
        typography.hero,
        {
          color: colors.accent.primary,
          fontSize: 32,
          marginHorizontal: 2,
          marginBottom: 16,
        },
      ]}
    >
      :
    </Text>
  );
}

export function CountdownCard({
  title,
  emoji,
  targetDate,
  startDate,
  style,
}: CountdownCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [timeRemaining, setTimeRemaining] = React.useState<TimeRemaining>(
    getTimeRemaining(targetDate),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(targetDate));
    }, 60_000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const progress = useMemo(
    () => getElapsedProgress(startDate, targetDate),
    [startDate, targetDate],
  );

  const isComplete = timeRemaining.totalMs === 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityLabel={`${title}: ${timeRemaining.days} days remaining`}
    >
      {/* Gradient accent strip */}
      <Svg
        width="100%"
        height={4}
        style={styles.gradientStrip}
      >
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.accent.primary} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.accent.pink} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="4" fill="url(#grad)" />
      </Svg>

      {/* Title row */}
      <View style={[styles.titleRow, { marginBottom: spacing.lg }]}>
        {emoji ? (
          <Text style={{ fontSize: 24, marginRight: spacing.sm }}>{emoji}</Text>
        ) : null}
        <Text
          style={[
            typography.h3,
            { color: colors.text.primary, flex: 1 },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Countdown numbers */}
      {isComplete ? (
        <View style={[styles.completeContainer, { marginBottom: spacing.lg }]}>
          <Text style={[typography.h1, { color: colors.accent.success }]}>
            Complete!
          </Text>
        </View>
      ) : (
        <View style={[styles.numbersRow, { marginBottom: spacing.lg }]}>
          <NumberBlock value={timeRemaining.days} label="Days" />
          <Separator />
          <NumberBlock value={timeRemaining.hours} label="Hours" />
          <Separator />
          <NumberBlock value={timeRemaining.minutes} label="Min" />
        </View>
      )}

      {/* Progress bar */}
      <ProgressBar
        progress={progress}
        label="Time elapsed"
        showPercentage
        color={colors.accent.primary}
        height={6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
  },
  gradientStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBlock: {
    alignItems: 'center',
  },
  numberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  completeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
