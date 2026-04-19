// =============================================================================
// TRANSFORMR — PlankTimer
// Full-screen plank hold timer for the 30-Day Plank Challenge.
// Haptic pulse every 15s; Speech coaching at key intervals; PR detection.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, InteractionManager } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import { Button } from '@components/ui/Button';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface PlankTimerProps {
  targetSeconds:        number;
  previousBestSeconds?: number;
  onComplete:           (holdSeconds: number) => void;
}

type TimerState = 'idle' | 'running' | 'stopped' | 'completed';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatMMSS(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const m   = Math.floor(abs / 60);
  const s   = abs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function PlankTimer({ targetSeconds, previousBestSeconds, onComplete }: PlankTimerProps) {
  const { colors, typography, spacing } = useTheme();

  const [timerState,       setTimerState]       = useState<TimerState>('idle');
  const [elapsedSeconds,   setElapsedSeconds]   = useState(0);
  const [finalHoldSeconds, setFinalHoldSeconds] = useState<number | null>(null);
  const [isNewPR,          setIsNewPR]          = useState(false);

  const intervalRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const spokenMilestonesRef = useRef<Set<string>>(new Set());
  const completeFiredRef    = useRef(false);

  const ringPulse = useSharedValue(1);
  const prScale   = useSharedValue(0);

  // Idle breathing pulse
  useEffect(() => {
    if (timerState !== 'idle') {
      cancelAnimation(ringPulse);
      ringPulse.value = withTiming(1, { duration: 200 });
      return;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      ringPulse.value = withRepeat(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    });
    return () => {
      task.cancel();
      cancelAnimation(ringPulse);
    };
    // ringPulse is a stable SharedValue — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState]);

  useEffect(() => {
    prScale.value = isNewPR
      ? withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
      : 0;
    // prScale is stable — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewPR]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      void Speech.stop();
    };
  }, []);

  // Milestone checks: speech + haptics on each elapsed second
  useEffect(() => {
    if (timerState !== 'running' || elapsedSeconds === 0) return;

    const spoken = spokenMilestonesRef.current;

    if (elapsedSeconds % 15 === 0) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (previousBestSeconds !== undefined && elapsedSeconds > previousBestSeconds && !isNewPR) {
      setIsNewPR(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const q25 = Math.floor(targetSeconds * 0.25);
    const q50 = Math.floor(targetSeconds * 0.5);
    const q75 = Math.floor(targetSeconds * 0.75);

    if (elapsedSeconds === 1 && !spoken.has('start')) {
      spoken.add('start');
      Speech.speak(`${targetSeconds} second plank. Go.`);
    } else if (elapsedSeconds === q25 && !spoken.has('q25')) {
      spoken.add('q25');
      Speech.speak('Stay tight.');
    } else if (elapsedSeconds === q50 && !spoken.has('q50')) {
      spoken.add('q50');
      Speech.speak('Halfway. Core locked.');
    } else if (elapsedSeconds === q75 && !spoken.has('q75')) {
      spoken.add('q75');
      Speech.speak("Almost there. Don't quit.");
    } else if (elapsedSeconds === targetSeconds && !spoken.has('done')) {
      spoken.add('done');
      Speech.speak('Done. Rest.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (!completeFiredRef.current) {
        completeFiredRef.current = true;
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimerState('completed');
        setFinalHoldSeconds(elapsedSeconds);
        onComplete(elapsedSeconds);
      }
    } else if (
      elapsedSeconds > targetSeconds &&
      (elapsedSeconds - targetSeconds) % 15 === 0
    ) {
      const beyondKey = `beyond_${elapsedSeconds}`;
      if (!spoken.has(beyondKey)) {
        spoken.add(beyondKey);
        Speech.speak('New record territory. Keep going.');
      }
    }
    // elapsedSeconds is the reactive dep; others are refs or stable values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds, timerState]);

  const handleStart = useCallback(() => {
    if (timerState === 'running') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeFiredRef.current = false;
    spokenMilestonesRef.current.clear();
    setTimerState('running');

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [timerState]);

  const handleStop = useCallback(() => {
    if (timerState !== 'running') return;
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    void Speech.stop();

    setTimerState('stopped');
    setElapsedSeconds((prev) => {
      setFinalHoldSeconds(prev);
      if (previousBestSeconds !== undefined && prev > previousBestSeconds) {
        setIsNewPR(true);
      }
      return prev;
    });
  }, [timerState, previousBestSeconds]);

  const handleReset = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    void Speech.stop();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeFiredRef.current = false;
    spokenMilestonesRef.current.clear();
    setTimerState('idle');
    setElapsedSeconds(0);
    setFinalHoldSeconds(null);
    setIsNewPR(false);
  }, []);

  const progress = targetSeconds > 0 ? Math.min(elapsedSeconds / targetSeconds, 1) : 0;
  const remaining = targetSeconds - elapsedSeconds;

  const ringColor: string = (() => {
    if (timerState === 'idle') return colors.accent.primary;
    if (remaining <= 10 && remaining > 0) return colors.accent.danger;
    if (progress >= 0.75)                 return colors.accent.warning;
    return colors.accent.success;
  })();

  const displaySeconds = timerState === 'idle' ? targetSeconds : elapsedSeconds;

  const ringPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: ringPulse.value }] }));
  const prScaleStyle   = useAnimatedStyle(() => ({ transform: [{ scale: prScale.value }] }));

  const showResultCard =
    (timerState === 'stopped' || timerState === 'completed') && finalHoldSeconds !== null;

  return (
    <View style={styles.container}>
      {isNewPR && (
        <Animated.View style={[styles.prRow, prScaleStyle]}>
          <Card variant="gold" style={styles.prCard}>
            <Text style={[typography.bodyBold, { color: colors.accent.gold, textAlign: 'center' }]}>
              New PR! 🏆
            </Text>
          </Card>
        </Animated.View>
      )}

      <Animated.View style={ringPulseStyle}>
        <ProgressRing
          progress={progress}
          size={240}
          strokeWidth={16}
          color={ringColor}
          style={{ marginBottom: spacing.xl }}
        >
          <View style={styles.ringCenter}>
            <Text style={[typography.countdown, { color: colors.text.primary, fontSize: 44, textAlign: 'center' }]}>
              {formatMMSS(displaySeconds)}
            </Text>
            {timerState === 'running' && elapsedSeconds > targetSeconds && (
              <Badge label="Beyond Target" variant="success" size="sm" />
            )}
            {timerState === 'idle' && (
              <Text style={[typography.caption, { color: colors.text.muted, textAlign: 'center', marginTop: 4 }]}>
                target
              </Text>
            )}
          </View>
        </ProgressRing>
      </Animated.View>

      {previousBestSeconds !== undefined && timerState === 'idle' && (
        <Text style={[typography.caption, { color: colors.text.muted, textAlign: 'center', marginBottom: spacing.lg }]}>
          {`Personal best: ${formatMMSS(previousBestSeconds)}`}
        </Text>
      )}

      <View style={[styles.controls, { gap: spacing.md }]}>
        {timerState === 'idle' && (
          <Button title="Start" onPress={handleStart} fullWidth accessibilityLabel="Start plank timer" />
        )}
        {timerState === 'running' && (
          <>
            <Button
              title="Stop"
              onPress={handleStop}
              variant="danger"
              style={styles.halfButton}
              accessibilityLabel="Stop plank timer"
            />
            <Button
              title="Reset"
              onPress={handleReset}
              variant="secondary"
              style={styles.halfButton}
              accessibilityLabel="Reset plank timer"
            />
          </>
        )}
        {(timerState === 'stopped' || timerState === 'completed') && (
          <Button title="Reset" onPress={handleReset} variant="secondary" fullWidth accessibilityLabel="Reset plank timer" />
        )}
      </View>

      {showResultCard && finalHoldSeconds !== null && (
        <Card
          variant={timerState === 'completed' ? 'success' : 'default'}
          style={styles.resultCard}
        >
          {timerState === 'completed' ? (
            <>
              <Text style={[typography.h3, { color: colors.accent.success, textAlign: 'center', marginBottom: spacing.sm }]}>
                Plank complete!
              </Text>
              <Text style={[typography.stat, { color: colors.text.primary, textAlign: 'center' }]}>
                {formatMMSS(finalHoldSeconds)}
              </Text>
            </>
          ) : (
            <>
              <Text style={[typography.bodyBold, { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm }]}>
                Hold stopped early
              </Text>
              <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
                {`Hold: ${formatMMSS(finalHoldSeconds)}  /  Target: ${formatMMSS(targetSeconds)}`}
              </Text>
            </>
          )}
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  prRow:       { marginBottom: 16, alignSelf: 'stretch' },
  prCard:      { alignItems: 'center' },
  ringCenter:  { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  controls:    { flexDirection: 'row', alignSelf: 'stretch', marginTop: 24 },
  halfButton:  { flex: 1 },
  resultCard:  { alignSelf: 'stretch', marginTop: 24 },
});
