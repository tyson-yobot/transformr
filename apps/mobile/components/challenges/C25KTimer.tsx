// =============================================================================
// TRANSFORMR — C25KTimer
// Couch-to-5K interval timer with audio cues, haptic transitions.
// =============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Button } from '@components/ui/Button';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface C25KTimerProps {
  weekNumber: number;
  runNumber:  number;
  intervals:  { type: 'run' | 'walk'; duration: number }[];
  onComplete: () => void;
}

type TimerState = 'idle' | 'running' | 'paused' | 'complete';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function totalDuration(intervals: { duration: number }[]): number {
  return intervals.reduce((sum, iv) => sum + iv.duration, 0);
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function C25KTimer({ weekNumber, runNumber, intervals, onComplete }: C25KTimerProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const isFallback      = intervals.length === 0;
  const fallbackDuration = 30 * 60;

  const [timerState,    setTimerState]    = useState<TimerState>('idle');
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [secondsLeft,   setSecondsLeft]   = useState(
    isFallback ? fallbackDuration : (intervals[0]?.duration ?? 0),
  );
  const [totalElapsed,  setTotalElapsed]  = useState(0);

  const intervalRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const warnedRef          = useRef(false);
  const announcedStartRef  = useRef(false);

  const workoutTotal     = isFallback ? fallbackDuration : totalDuration(intervals);
  const progressFraction = workoutTotal > 0 ? totalElapsed / workoutTotal : 0;

  const currentInterval = isFallback ? null : (intervals[currentIndex] ?? null);
  const nextInterval    = isFallback ? null : (intervals[currentIndex + 1] ?? null);

  const labelOpacity = useSharedValue(1);
  const labelAnimStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));

  const speakIntervalStart = useCallback((type: 'run' | 'walk') => {
    Speech.speak(type === 'run' ? 'Run now' : 'Walk now', { rate: 1.1, pitch: type === 'run' ? 1.2 : 1.0 });
  }, []);

  const speakWarning = useCallback((nextType: 'run' | 'walk') => {
    Speech.speak(`Get ready to ${nextType === 'run' ? 'run' : 'walk'} in 5 seconds`, { rate: 1.0 });
  }, []);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advanceInterval = useCallback(() => {
    if (isFallback) return;
    const nextIdx = currentIndex + 1;
    if (nextIdx >= intervals.length) {
      setTimerState('complete');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak('Workout complete! Great job!');
      onComplete();
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    labelOpacity.value = 0;
    labelOpacity.value = withTiming(1, { duration: 300 });
    warnedRef.current        = false;
    announcedStartRef.current = false;
    setCurrentIndex(nextIdx);
    setSecondsLeft(intervals[nextIdx]?.duration ?? 0);
    // labelOpacity, intervals are stable references — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFallback, currentIndex, intervals.length, onComplete]);

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev === 6 && !warnedRef.current && nextInterval) {
        warnedRef.current = true;
        speakWarning(nextInterval.type);
      }
      if (prev <= 1) { advanceInterval(); return 0; }
      return prev - 1;
    });
    setTotalElapsed((prev) => prev + 1);
  }, [advanceInterval, nextInterval, speakWarning]);

  const fallbackTick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        setTimerState('complete');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Speech.speak('Workout complete! Great job!');
        onComplete();
        return 0;
      }
      return prev - 1;
    });
    setTotalElapsed((prev) => prev + 1);
  }, [onComplete]);

  useEffect(() => {
    if (timerState === 'running' && !isFallback && currentInterval && !announcedStartRef.current) {
      announcedStartRef.current = true;
      speakIntervalStart(currentInterval.type);
    }
  }, [currentIndex, timerState, isFallback, currentInterval, speakIntervalStart]);

  const handleStart = useCallback(() => {
    setTimerState('running');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    warnedRef.current        = false;
    announcedStartRef.current = false;
    if (!isFallback && currentInterval) {
      speakIntervalStart(currentInterval.type);
      announcedStartRef.current = true;
    }
    intervalRef.current = setInterval(isFallback ? fallbackTick : tick, 1000);
  }, [isFallback, currentInterval, speakIntervalStart, fallbackTick, tick]);

  const handlePause = useCallback(() => {
    clearTick();
    setTimerState('paused');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.stop();
  }, [clearTick]);

  const handleResume = useCallback(() => {
    setTimerState('running');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    intervalRef.current = setInterval(isFallback ? fallbackTick : tick, 1000);
  }, [isFallback, fallbackTick, tick]);

  useEffect(() => { return () => { clearTick(); Speech.stop(); }; }, [clearTick]);

  const upcomingIntervals = useMemo(
    () => (isFallback ? [] : intervals.slice(currentIndex + 1, currentIndex + 4)),
    [isFallback, intervals, currentIndex],
  );

  const intervalColor =
    currentInterval?.type === 'run' ? colors.accent.success : colors.accent.info;

  if (timerState === 'complete') {
    return (
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card variant="success" style={{ margin: spacing.lg }}>
          <View style={styles.centerBlock}>
            <Text style={[typography.pageTitle, { color: colors.accent.success, textAlign: 'center' }]}>
              Workout Complete!
            </Text>
            <Text style={[typography.h3, { color: colors.text.secondary, marginTop: spacing.md, textAlign: 'center' }]}>
              Week {weekNumber}, Run {runNumber}
            </Text>
            <Text style={[typography.stat, { color: colors.text.primary, marginTop: spacing.xl, textAlign: 'center' }]}>
              {formatMMSS(totalElapsed)}
            </Text>
            <Text style={[typography.caption, { color: colors.text.muted, textAlign: 'center' }]}>Total time</Text>
          </View>
        </Card>
      </Animated.View>
    );
  }

  if (isFallback) {
    return (
      <Animated.View entering={FadeInDown.duration(300)}>
        <Card style={{ margin: spacing.lg }}>
          <Text style={[typography.sectionTitle, { color: colors.text.muted, textAlign: 'center', letterSpacing: 1.2, marginBottom: spacing.lg }]}>
            WEEK {weekNumber} — RUN {runNumber}
          </Text>
          <Text style={[typography.h1, { color: colors.accent.success, textAlign: 'center' }]}>🏃 RUN</Text>
          <Text style={[typography.countdown, { color: colors.text.primary, textAlign: 'center', marginTop: spacing.md }]}>
            {formatMMSS(secondsLeft)}
          </Text>
          <ProgressBar progress={progressFraction} color={colors.accent.success} height={6} style={{ marginTop: spacing.xl }} />
          <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center', marginTop: spacing.xs }]}>
            30:00 continuous run
          </Text>
          <View style={{ marginTop: spacing.xl }}>
            {timerState === 'idle'   && <Button title="Start"  onPress={handleStart}  fullWidth />}
            {timerState === 'running' && <Button title="Pause"  onPress={handlePause}  variant="secondary" fullWidth />}
            {timerState === 'paused' && <Button title="Resume" onPress={handleResume} fullWidth />}
          </View>
        </Card>
      </Animated.View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[typography.sectionTitle, { color: colors.text.muted, textAlign: 'center', letterSpacing: 1.2, marginBottom: spacing.lg }]}>
        WEEK {weekNumber} — RUN {runNumber}
      </Text>

      <Card borderAccent style={{ marginBottom: spacing.lg }}>
        <Animated.View style={labelAnimStyle}>
          <Text style={[typography.h1, { color: intervalColor, textAlign: 'center' }]}>
            {currentInterval?.type === 'run' ? '🏃 RUN' : '🚶 WALK'}
          </Text>
        </Animated.View>
        <Text
          style={[typography.countdown, { color: colors.text.primary, textAlign: 'center', marginTop: spacing.md }]}
          accessibilityLiveRegion="assertive"
          accessibilityLabel={`${secondsLeft} seconds remaining`}
        >
          {formatMMSS(secondsLeft)}
        </Text>
        <Text style={[typography.caption, { color: colors.text.muted, textAlign: 'center', marginTop: spacing.xs }]}>
          Interval {currentIndex + 1} of {intervals.length}
        </Text>
      </Card>

      <ProgressBar
        progress={progressFraction}
        label="Workout progress"
        showPercentage
        color={colors.accent.primary}
        height={8}
        style={{ marginBottom: spacing.xl }}
      />

      {upcomingIntervals.length > 0 && (
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.sectionTitle, { color: colors.text.muted, marginBottom: spacing.md }]}>
            UP NEXT
          </Text>
          {upcomingIntervals.map((iv, i) => (
            <View
              key={`upcoming-${currentIndex + 1 + i}`}
              style={[
                styles.upcomingRow,
                {
                  backgroundColor: colors.background.tertiary,
                  borderRadius:    borderRadius.sm,
                  padding:         spacing.md,
                  marginBottom:    spacing.sm,
                  opacity:         1 - i * 0.25,
                },
              ]}
            >
              <Text style={[typography.body, { color: colors.text.secondary }]}>
                {iv.type === 'run' ? '🏃 Run' : '🚶 Walk'}
              </Text>
              <Text style={[typography.captionBold, { color: colors.text.muted }]}>
                {formatMMSS(iv.duration)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View>
        {timerState === 'idle'   && <Button title="Start"  onPress={handleStart}  fullWidth />}
        {timerState === 'running' && <Button title="Pause"  onPress={handlePause}  variant="secondary" fullWidth />}
        {timerState === 'paused' && <Button title="Resume" onPress={handleResume} fullWidth />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerBlock: { alignItems: 'center', paddingVertical: 16 },
  upcomingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
