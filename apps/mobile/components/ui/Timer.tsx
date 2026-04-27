import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { useTheme } from '@theme/index';
import { ProgressRing } from './ProgressRing';

type TimerState = 'idle' | 'running' | 'paused';

interface TimerProps {
  durationSeconds: number;
  title?: string;
  size?: number;
  onComplete?: () => void;
  enableSound?: boolean;
  style?: ViewStyle;
}

export function Timer({
  durationSeconds,
  title,
  size = 180,
  onComplete,
  enableSound = true,
  style,
}: TimerProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  const progress = durationSeconds > 0 ? remainingSeconds / durationSeconds : 0;

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const playCompletionSound = useCallback(() => {
    if (!enableSound) return;
    try {
      // Clean up previous player if any
      if (playerRef.current) {
        playerRef.current.release();
      }
      const player = createAudioPlayer(
        // Use a system-compatible approach; falls back silently if unavailable
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869.wav' },
      );
      player.volume = 0.5;
      player.play();
      playerRef.current = player;
    } catch {
      // Sound playback is best-effort
    }
  }, [enableSound]);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    playCompletionSound();
    onComplete?.();
  }, [onComplete, playCompletionSound]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      playerRef.current?.remove();
    };
  }, [clearTimer]);

  useEffect(() => {
    setRemainingSeconds(durationSeconds);
    setTimerState('idle');
    clearTimer();
  }, [durationSeconds, clearTimer]);

  const start = useCallback(() => {
    if (remainingSeconds <= 0) return;
    setTimerState('running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearTimer();
          setTimerState('idle');
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [remainingSeconds, clearTimer, handleComplete]);

  const pause = useCallback(() => {
    clearTimer();
    setTimerState('paused');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setRemainingSeconds(durationSeconds);
    setTimerState('idle');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [durationSeconds, clearTimer]);

  const getProgressColor = (): string => {
    if (progress > 0.5) return colors.accent.success;
    if (progress > 0.25) return colors.accent.warning;
    return colors.accent.danger;
  };

  return (
    <View style={[styles.container, style]}>
      {title && (
        <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.lg, textAlign: 'center' }]}>
          {title}
        </Text>
      )}
      <ProgressRing
        progress={progress}
        size={size}
        strokeWidth={size * 0.06}
        color={getProgressColor()}
      >
        <Text style={[typography.hero, { color: colors.text.primary }]}>
          {formatTime(remainingSeconds)}
        </Text>
      </ProgressRing>
      <View style={[styles.controls, { marginTop: spacing.xl, gap: spacing.md }]}>
        {timerState === 'idle' && (
          <Pressable
            onPress={start}
            style={[
              styles.controlButton,
              {
                backgroundColor: colors.accent.primary,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.xxl,
                paddingVertical: spacing.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Start timer"
          >
            <Text style={[typography.bodyBold, { color: '#FFFFFF' /* brand-ok — white on accent button */ }]}>Start</Text>
          </Pressable>
        )}
        {timerState === 'running' && (
          <Pressable
            onPress={pause}
            style={[
              styles.controlButton,
              {
                backgroundColor: colors.accent.warning,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.xxl,
                paddingVertical: spacing.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Pause timer"
          >
            <Text style={[typography.bodyBold, { color: '#FFFFFF' /* brand-ok — white on accent button */ }]}>Pause</Text>
          </Pressable>
        )}
        {timerState === 'paused' && (
          <>
            <Pressable
              onPress={start}
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.accent.success,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Resume timer"
            >
              <Text style={[typography.bodyBold, { color: '#FFFFFF' /* brand-ok — white on accent button */ }]}>Resume</Text>
            </Pressable>
            <Pressable
              onPress={reset}
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.background.tertiary,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Reset timer"
            >
              <Text style={[typography.bodyBold, { color: colors.text.secondary }]}>Reset</Text>
            </Pressable>
          </>
        )}
        {timerState !== 'idle' && timerState !== 'paused' && (
          <Pressable
            onPress={reset}
            style={[
              styles.controlButton,
              {
                backgroundColor: colors.background.tertiary,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reset timer"
          >
            <Text style={[typography.bodyBold, { color: colors.text.secondary }]}>Reset</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
