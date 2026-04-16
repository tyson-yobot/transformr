import { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

interface RestTimerProps {
  initialSeconds?: number;
  autoStart?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  style?: ViewStyle;
}

const PRESET_TIMES = [60, 90, 120, 180] as const;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function RestTimer({
  initialSeconds = 90,
  autoStart = false,
  onComplete,
  onSkip,
  style,
}: RestTimerProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ringSize = 180;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = ringSize / 2;

  const animatedProgress = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  // Start/restart the ring animation
  const animateRing = useCallback(
    (fromProgress: number, durationMs: number) => {
      cancelAnimation(animatedProgress);
      animatedProgress.value = fromProgress;
      animatedProgress.value = withTiming(1, {
        duration: durationMs,
        easing: Easing.linear,
      });
    },
    [animatedProgress],
  );

  // Start timer
  const startTimer = useCallback(
    (seconds: number) => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      const startedAt = Date.now();
      setRemainingSeconds(seconds);
      setIsRunning(true);

      const elapsed = totalSeconds - seconds;
      const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
      animateRing(progress, seconds * 1000);

      intervalRef.current = setInterval(() => {
        const elapsedMs = Date.now() - startedAt;
        const left = Math.max(0, seconds - Math.floor(elapsedMs / 1000));
        setRemainingSeconds(left);

        if (left <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onComplete?.();
        }
      }, 250);
    },
    [totalSeconds, animateRing, onComplete],
  );

  // Auto-start
  useEffect(() => {
    if (autoStart) {
      startTimer(initialSeconds);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePresetPress = useCallback(
    (seconds: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTotalSeconds(seconds);
      setRemainingSeconds(seconds);
      animatedProgress.value = 0;
      if (isRunning && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      startTimer(seconds);
    },
    [isRunning, startTimer, animatedProgress],
  );

  const handleStartPause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      cancelAnimation(animatedProgress);
      setIsRunning(false);
    } else {
      startTimer(remainingSeconds);
    }
  }, [isRunning, remainingSeconds, startTimer, animatedProgress]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (intervalRef.current) clearInterval(intervalRef.current);
    cancelAnimation(animatedProgress);
    animatedProgress.value = 1;
    setIsRunning(false);
    setRemainingSeconds(0);
    onSkip?.();
  }, [animatedProgress, onSkip]);

  const minutes = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeDisplay = `${minutes}:${String(secs).padStart(2, '0')}`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.xl,
        },
        style,
      ]}
    >
      {/* Circular countdown */}
      <View style={styles.ringWrap}>
        <Svg width={ringSize} height={ringSize}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.background.tertiary}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.accent.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>

        {/* Center time */}
        <View style={styles.ringCenter}>
          <Text
            style={{
              fontSize: 40,
              fontWeight: '700',
              color: colors.text.primary,
            }}
          >
            {timeDisplay}
          </Text>
          <Text style={[typography.tiny, { color: colors.text.muted, marginTop: spacing.xs }]}>
            {isRunning ? 'REST' : remainingSeconds === 0 ? 'DONE' : 'PAUSED'}
          </Text>
        </View>
      </View>

      {/* Preset buttons */}
      <View style={[styles.presetRow, { marginTop: spacing.xl, gap: spacing.sm }]}>
        {PRESET_TIMES.map((seconds) => (
          <Pressable
            key={seconds}
            onPress={() => handlePresetPress(seconds)}
            style={[
              styles.presetButton,
              {
                backgroundColor:
                  totalSeconds === seconds
                    ? colors.accent.primary
                    : colors.background.tertiary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${seconds} seconds rest`}
          >
            <Text
              style={[
                typography.captionBold,
                {
                  color:
                    totalSeconds === seconds
                      ? '#FFFFFF'
                      : colors.text.secondary,
                },
              ]}
            >
              {seconds >= 60 ? `${seconds / 60}m` : `${seconds}s`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Action buttons */}
      <View style={[styles.actionRow, { marginTop: spacing.lg, gap: spacing.md }]}>
        <Pressable
          onPress={handleStartPause}
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.md,
              flex: 1,
            },
          ]}
          accessibilityRole="button"
        >
          <Text style={[typography.bodyBold, { color: '#FFFFFF' /* brand-ok — white on accent button */, textAlign: 'center' }]}>
            {isRunning ? 'Pause' : remainingSeconds === 0 ? 'Restart' : 'Start'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.background.tertiary,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.xl,
            },
          ]}
          accessibilityRole="button"
        >
          <Text style={[typography.bodyBold, { color: colors.text.secondary, textAlign: 'center' }]}>
            Skip
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  ringWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetRow: {
    flexDirection: 'row',
  },
  presetButton: {},
  actionRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  actionButton: {},
});
