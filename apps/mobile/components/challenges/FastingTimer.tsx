// =============================================================================
// TRANSFORMR — FastingTimer
// Intermittent fasting countdown timer with autophagy milestone markers.
// =============================================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, InteractionManager } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type FastingProtocol = '16:8' | '18:6' | '20:4' | '5:2';

interface FastingTimerProps {
  protocol: FastingProtocol;
  eatingWindowStart: string; // "HH:MM"
  onFastingComplete?: () => void;
}

interface ProtocolConfig {
  fastingHours: number;
  eatingHours:  number;
}

interface PhaseInfo {
  phase:               'FASTING' | 'EATING';
  elapsedMinutes:      number;
  totalMinutes:        number;
  countdownMinutes:    number;
  elapsedFastingHours: number;
}

interface Milestone {
  key:     string;
  hours:   number;
  label:   string;
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

// -----------------------------------------------------------------------------
// Static data
// -----------------------------------------------------------------------------

const AUTOPHAGY_MILESTONES: Milestone[] = [
  { key: '12h', hours: 12, label: 'Ketosis starting', variant: 'warning' },
  { key: '16h', hours: 16, label: 'Autophagy begins', variant: 'danger'  },
  { key: '18h', hours: 18, label: 'Deep autophagy',   variant: 'danger'  },
  { key: '24h', hours: 24, label: 'Peak autophagy',   variant: 'info'    },
];

// -----------------------------------------------------------------------------
// Pure helpers
// -----------------------------------------------------------------------------

function parseProtocol(protocol: FastingProtocol): ProtocolConfig {
  switch (protocol) {
    case '16:8': return { fastingHours: 16, eatingHours: 8 };
    case '18:6': return { fastingHours: 18, eatingHours: 6 };
    case '20:4': return { fastingHours: 20, eatingHours: 4 };
    case '5:2':  return { fastingHours: 0,  eatingHours: 0 };
  }
}

function parseWindowStart(start: string): { hours: number; minutes: number } {
  const parts = start.split(':');
  return {
    hours:   parseInt(parts[0] ?? '12', 10),
    minutes: parseInt(parts[1] ?? '0',  10),
  };
}

function computePhaseInfo(
  now: Date,
  protocol: FastingProtocol,
  eatingWindowStart: string,
): PhaseInfo {
  const config    = parseProtocol(protocol);
  const winStart  = parseWindowStart(eatingWindowStart);

  const nowMins      = now.getHours() * 60 + now.getMinutes();
  const eatStartMins = winStart.hours * 60 + winStart.minutes;
  const eatEndMins   = eatStartMins + config.eatingHours * 60;

  const inEating =
    eatEndMins <= 1440
      ? nowMins >= eatStartMins && nowMins < eatEndMins
      : nowMins >= eatStartMins || nowMins < eatEndMins % 1440;

  if (inEating) {
    const elapsed = ((nowMins - eatStartMins) + 1440) % 1440;
    const total   = config.eatingHours * 60;
    return {
      phase:               'EATING',
      elapsedMinutes:      elapsed,
      totalMinutes:        total,
      countdownMinutes:    Math.max(0, total - elapsed),
      elapsedFastingHours: 0,
    };
  }

  const fastStartMins = eatEndMins % 1440;
  const elapsed       = ((nowMins - fastStartMins) + 1440) % 1440;
  const total         = config.fastingHours * 60;

  return {
    phase:               'FASTING',
    elapsedMinutes:      elapsed,
    totalMinutes:        total,
    countdownMinutes:    Math.max(0, total - elapsed),
    elapsedFastingHours: elapsed / 60,
  };
}

function formatHHMM(totalMinutes: number): string {
  const h = Math.floor(Math.abs(totalMinutes) / 60);
  const m = Math.abs(totalMinutes) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function FastingTimer({
  protocol,
  eatingWindowStart,
  onFastingComplete,
}: FastingTimerProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [now, setNow]    = useState(() => new Date());
  const completeFiredRef = useRef(false);
  const textScale        = useSharedValue(1);
  const bgOpacity        = useSharedValue(0.08);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      textScale.value = withRepeat(
        withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    });
    return () => {
      task.cancel();
      cancelAnimation(textScale);
    };
    // textScale is a stable SharedValue ref — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phaseInfo = useMemo(
    () =>
      protocol === '5:2'
        ? null
        : computePhaseInfo(now, protocol, eatingWindowStart),
    [now, protocol, eatingWindowStart],
  );

  useEffect(() => {
    if (
      phaseInfo?.phase === 'FASTING' &&
      phaseInfo.countdownMinutes === 0 &&
      !completeFiredRef.current
    ) {
      completeFiredRef.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onFastingComplete?.();
    }
    if (phaseInfo?.phase === 'EATING') {
      completeFiredRef.current = false;
    }
  }, [phaseInfo, onFastingComplete]);

  useEffect(() => {
    const target =
      phaseInfo?.phase !== 'FASTING'
        ? 0.06
        : Math.min(0.06 + phaseInfo.elapsedFastingHours * 0.005, 0.18);
    bgOpacity.value = withTiming(target, { duration: 1200 });
    // bgOpacity is stable — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseInfo?.phase, phaseInfo?.elapsedFastingHours]);

  const textScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
  }));

  const bgTintStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  // ── 5:2 branch ──────────────────────────────────────────────────────────────
  if (protocol === '5:2') {
    return (
      <Card variant="flat" style={styles.card}>
        <View style={[styles.centeredRow, { marginBottom: spacing.md }]}>
          <Badge label="Restricted Day" variant="danger" />
        </View>
        <Text
          style={[
            typography.stat,
            { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm },
          ]}
        >
          500 cal
        </Text>
        <Text style={[typography.caption, { color: colors.text.muted, textAlign: 'center' }]}>
          Window protocols not applicable today
        </Text>
      </Card>
    );
  }

  if (phaseInfo === null) return null;

  const ringColor: string = (() => {
    if (phaseInfo.phase === 'EATING') return colors.accent.success;
    const h = phaseInfo.elapsedFastingHours;
    if (h >= 18) return colors.accent.danger;
    if (h >= 16) return colors.accent.fire;
    if (h >= 12) return colors.accent.primaryDark;
    return colors.accent.primary;
  })();

  const bgTintColor =
    phaseInfo.phase === 'FASTING'
      ? colors.accent.primarySubtle
      : colors.accent.successSubtle;

  const phaseColor =
    phaseInfo.phase === 'FASTING'
      ? colors.accent.primary
      : colors.accent.success;

  const progress =
    phaseInfo.totalMinutes > 0
      ? Math.min(phaseInfo.elapsedMinutes / phaseInfo.totalMinutes, 1)
      : 0;

  const reachedMilestones = AUTOPHAGY_MILESTONES.filter(
    (m) =>
      phaseInfo.phase === 'FASTING' && phaseInfo.elapsedFastingHours >= m.hours,
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.outerContainer}>
        {/* Animated background tint */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: bgTintColor, borderRadius: borderRadius.lg },
            bgTintStyle,
          ]}
          pointerEvents="none"
        />

        {/* Phase badge */}
        <View style={[styles.centeredRow, { marginBottom: spacing.lg }]}>
          <Badge
            label={phaseInfo.phase === 'FASTING' ? 'FASTING' : 'EATING'}
            variant={phaseInfo.phase === 'FASTING' ? 'default' : 'success'}
            size="md"
          />
        </View>

        {/* Progress ring */}
        <ProgressRing
          progress={progress}
          size={220}
          strokeWidth={14}
          color={ringColor}
          style={{ marginBottom: spacing.xl }}
        >
          <Animated.View style={[styles.ringCenter, textScaleStyle]}>
            <Text style={[typography.countdown, { color: phaseColor, textAlign: 'center' }]}>
              {formatHHMM(phaseInfo.countdownMinutes)}
            </Text>
            <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center', marginTop: 2 }]}>
              remaining
            </Text>
          </Animated.View>
        </ProgressRing>

        {phaseInfo.phase === 'FASTING' ? (
          <Text
            style={[
              typography.bodyBold,
              { color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xl },
            ]}
          >
            {`${formatHHMM(phaseInfo.elapsedMinutes)} into your fast`}
          </Text>
        ) : (
          <Text
            style={[
              typography.bodyBold,
              { color: colors.accent.success, textAlign: 'center', marginBottom: spacing.xl },
            ]}
          >
            {`Eating window closes in ${formatHHMM(phaseInfo.countdownMinutes)}`}
          </Text>
        )}

        {reachedMilestones.length > 0 && (
          <Card variant="flat" style={styles.milestonesCard}>
            <Text style={[typography.sectionTitle, { color: colors.text.muted, marginBottom: spacing.md }]}>
              MILESTONES REACHED
            </Text>
            <View style={styles.milestonesRow}>
              {reachedMilestones.map((m) => (
                <Badge
                  key={m.key}
                  label={m.label}
                  variant={m.variant}
                  size="sm"
                  style={{ marginRight: spacing.sm, marginBottom: spacing.sm }}
                />
              ))}
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  outerContainer: {
    alignItems:        'center',
    width:             '100%',
    paddingVertical:   24,
    paddingHorizontal: 16,
  },
  card:           { alignItems: 'center', width: '100%' },
  centeredRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ringCenter:     { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  milestonesCard: { width: '100%' },
  milestonesRow:  { flexDirection: 'row', flexWrap: 'wrap' },
});
