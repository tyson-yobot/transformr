// =============================================================================
// TRANSFORMR — MurphWorkout
// Murph challenge tracker: 1mi run + 100 pull-ups + 200 push-ups +
// 300 squats + 1mi run. Supports Cindy-style partitioned mode and YoY comparison.
// =============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Button } from '@components/ui/Button';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface MurphWorkoutProps {
  weightedVest:          boolean;
  partitioned:           boolean;
  previousBestSeconds?:  number;
  onComplete:            (elapsedSeconds: number) => void;
}

interface Segment {
  id:        string;
  label:     string;
  target:    number;
  completed: number;
  unit:      string;
  isRun:     boolean;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const CINDY_ROUNDS = 20;

const STANDARD_SEGMENTS: readonly Omit<Segment, 'completed'>[] = [
  { id: 'run1',    label: 'Run 1 Mile', target: 1,   unit: 'mi',  isRun: true  },
  { id: 'pullups', label: 'Pull-ups',   target: 100, unit: 'reps', isRun: false },
  { id: 'pushups', label: 'Push-ups',   target: 200, unit: 'reps', isRun: false },
  { id: 'squats',  label: 'Squats',     target: 300, unit: 'reps', isRun: false },
  { id: 'run2',    label: 'Run 1 Mile', target: 1,   unit: 'mi',  isRun: true  },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatHHMMSS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildStandardSegments(): Segment[] {
  return STANDARD_SEGMENTS.map((s) => ({ ...s, completed: 0 }));
}

function buildPartitionSegments(): Segment[] {
  return Array.from({ length: CINDY_ROUNDS }, (_, i) => ({
    id: `round-${i + 1}`, label: `Round ${i + 1}`, target: 1, completed: 0, unit: 'round', isRun: false,
  }));
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function MurphWorkout({ weightedVest, partitioned, previousBestSeconds, onComplete }: MurphWorkoutProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const initialSegments = useMemo(
    () => (partitioned ? buildPartitionSegments() : buildStandardSegments()),
    [partitioned],
  );

  const [segments,      setSegments]      = useState<Segment[]>(initialSegments);
  const [activeIndex,   setActiveIndex]   = useState(0);
  const [elapsed,       setElapsed]       = useState(0);
  const [isRunning,     setIsRunning]     = useState(false);
  const [isComplete,    setIsComplete]    = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    intervalRef.current = setInterval(() => { setElapsed((prev) => prev + 1); }, 1000);
  }, []);

  const handlePause = useCallback(() => { clearTick(); setIsRunning(false); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, [clearTick]);

  useEffect(() => { return () => clearTick(); }, [clearTick]);

  const addReps = useCallback((segIndex: number, amount: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSegments((prev) => {
      const updated = prev.map((seg, i) => {
        if (i !== segIndex) return seg;
        return { ...seg, completed: Math.min(seg.completed + amount, seg.target) };
      });
      const seg = updated[segIndex];
      if (seg && seg.completed >= seg.target) {
        const nextIdx = segIndex + 1;
        if (nextIdx < updated.length) {
          setActiveIndex(nextIdx);
          setExpandedIndex(null);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          clearTick();
          setIsRunning(false);
          setIsComplete(true);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setElapsed((cur) => { onComplete(cur); return cur; });
        }
      }
      return updated;
    });
  }, [clearTick, onComplete]);

  const completeRun = useCallback((segIndex: number) => { addReps(segIndex, 1); }, [addReps]);

  const splitLabel = useMemo((): string | null => {
    if (!previousBestSeconds || elapsed === 0) return null;
    const diff = elapsed - previousBestSeconds;
    const abs  = Math.abs(diff);
    return `${diff < 0 ? 'Ahead' : 'Behind'} by ${formatHHMMSS(abs)}`;
  }, [elapsed, previousBestSeconds]);

  const splitColor = splitLabel?.startsWith('Ahead') ? colors.accent.success : colors.accent.warning;

  const advanceScale = useSharedValue(1);
  const advanceStyle = useAnimatedStyle(() => ({ transform: [{ scale: advanceScale.value }] }));
  useEffect(() => {
    advanceScale.value = withTiming(1.06, { duration: 150 }, () => {
      advanceScale.value = withTiming(1, { duration: 150 });
    });
    // advanceScale is stable — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const isPR = isComplete && (previousBestSeconds === undefined || elapsed < previousBestSeconds);

  if (isComplete) {
    return (
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card variant={isPR ? 'gold' : 'success'} style={{ margin: spacing.lg }}>
          <View style={styles.centerBlock}>
            {isPR && <Badge label="NEW PR" variant="warning" style={{ marginBottom: spacing.md }} />}
            <Text style={[typography.pageTitle, { color: colors.text.primary, textAlign: 'center' }]}>MURPH COMPLETE</Text>
            {weightedVest && <Badge label="20lb vest" variant="danger" style={{ marginTop: spacing.sm }} />}
            <Text style={[typography.stat, { color: isPR ? colors.accent.gold : colors.accent.success, marginTop: spacing.xl, textAlign: 'center' }]}>
              {formatHHMMSS(elapsed)}
            </Text>
            <Text style={[typography.caption, { color: colors.text.muted, textAlign: 'center' }]}>Final time</Text>
            {previousBestSeconds !== undefined && (
              <Text style={[typography.captionBold, { color: splitColor, marginTop: spacing.md, textAlign: 'center' }]}>
                {splitLabel}
              </Text>
            )}
          </View>
        </Card>
      </Animated.View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
      {/* Header */}
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[typography.sectionTitle, { color: colors.text.muted }]}>ELAPSED</Text>
            <Text style={[typography.stat, { color: colors.text.primary }]}>{formatHHMMSS(elapsed)}</Text>
            {splitLabel && (
              <Text style={[typography.captionBold, { color: splitColor, marginTop: spacing.xs }]}>{splitLabel}</Text>
            )}
          </View>
          <View style={styles.headerBadges}>
            {weightedVest && <Badge label="20lb vest" variant="danger" style={{ marginBottom: spacing.xs }} />}
            {partitioned  && <Badge label="Cindy"     variant="info"   />}
          </View>
        </View>
        <View style={{ marginTop: spacing.lg }}>
          {!isRunning && <Button title={elapsed === 0 ? 'Start' : 'Resume'} onPress={handleStart} fullWidth />}
          {isRunning  && <Button title="Pause" onPress={handlePause} variant="secondary" fullWidth />}
        </View>
      </Card>

      {partitioned && (
        <Card variant="flat" style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
            20 rounds of: 5 pull-ups / 10 push-ups / 15 squats
          </Text>
          <ProgressBar
            progress={segments.filter((s) => s.completed >= s.target).length / CINDY_ROUNDS}
            label={`${segments.filter((s) => s.completed >= s.target).length} / ${CINDY_ROUNDS} rounds`}
            color={colors.accent.primary}
            height={6}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      )}

      {segments.map((seg, idx) => {
        const isActive   = idx === activeIndex;
        const isDone     = seg.completed >= seg.target;
        const isExpanded = expandedIndex === idx;
        const segProgress = seg.target > 0 ? seg.completed / seg.target : 0;

        return (
          <Animated.View
            key={seg.id}
            style={isActive ? advanceStyle : undefined}
            entering={FadeInDown.delay(idx * 40).duration(300)}
          >
            <Card
              variant={isDone ? 'success' : isActive ? 'elevated' : 'flat'}
              style={{ marginBottom: spacing.sm, opacity: isDone ? 0.7 : 1 }}
              onPress={isActive && isRunning && !isDone && !seg.isRun
                ? () => setExpandedIndex(isExpanded ? null : idx)
                : undefined
              }
            >
              <View style={styles.segHeaderRow}>
                <View style={styles.segLabelGroup}>
                  {isActive && !isDone && <Badge dot variant="success" style={{ marginRight: spacing.sm }} />}
                  <Text style={[typography.bodyBold, { color: isDone ? colors.accent.success : isActive ? colors.text.primary : colors.text.muted }]}>
                    {seg.label}
                  </Text>
                </View>
                <View style={styles.segCountGroup}>
                  <Text style={[typography.stat, { color: isActive ? colors.text.primary : colors.text.muted }]}>
                    {seg.isRun ? (isDone ? '✓' : '–') : seg.completed}
                  </Text>
                  {!seg.isRun && (
                    <Text style={[typography.caption, { color: colors.text.muted }]}>
                      {`/ ${seg.target} ${seg.unit}`}
                    </Text>
                  )}
                </View>
              </View>

              {!seg.isRun && (
                <ProgressBar
                  progress={segProgress}
                  color={isDone ? colors.accent.success : isActive ? colors.accent.primary : colors.border.default}
                  height={4}
                  style={{ marginTop: spacing.sm }}
                />
              )}

              {seg.isRun && isActive && isRunning && !isDone && (
                <Button
                  title="Mark Mile Complete"
                  onPress={() => completeRun(idx)}
                  variant="outline"
                  size="sm"
                  style={{ marginTop: spacing.md }}
                  fullWidth
                />
              )}

              {isExpanded && isActive && !isDone && !seg.isRun && (
                <View
                  style={[
                    styles.repPanel,
                    { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.background.tertiary, borderRadius: borderRadius.md },
                  ]}
                >
                  <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.sm }]}>Add reps</Text>
                  <View style={styles.repButtons}>
                    {([1, 5, 10, 25] as const).map((amount) => (
                      <Pressable
                        key={amount}
                        onPress={() => addReps(idx, amount)}
                        style={[
                          styles.repBtn,
                          { backgroundColor: colors.accent.primaryDim, borderRadius: borderRadius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${amount} reps`}
                      >
                        <Text style={[typography.bodyBold, { color: colors.accent.primary }]}>+{amount}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerBlock:   { alignItems: 'center', paddingVertical: 16 },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerBadges:  { alignItems: 'flex-end' },
  segHeaderRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segLabelGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  segCountGroup: { alignItems: 'flex-end' },
  repPanel:      {},
  repButtons:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  repBtn:        { alignItems: 'center', justifyContent: 'center' },
});
