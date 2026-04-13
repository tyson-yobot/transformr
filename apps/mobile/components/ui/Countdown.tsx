import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface CountdownProps {
  targetDate: Date;
  title?: string;
  emoji?: string;
  onComplete?: () => void;
  style?: ViewStyle;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
}

function calculateTimeRemaining(target: Date): TimeRemaining {
  const now = Date.now();
  const diff = target.getTime() - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isComplete: false };
}

function StatBlock({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.statBlock,
        {
          backgroundColor: colors.background.tertiary,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          minWidth: 64,
        },
      ]}
    >
      <Text style={[typography.stat, { color: colors.text.primary, textAlign: 'center' }]}>
        {String(value).padStart(2, '0')}
      </Text>
      <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center', marginTop: 2 }]}>
        {label}
      </Text>
    </View>
  );
}

export function Countdown({
  targetDate,
  title,
  emoji,
  onComplete,
  style,
}: CountdownProps) {
  const { colors, typography, spacing } = useTheme();
  const [time, setTime] = useState<TimeRemaining>(() => calculateTimeRemaining(targetDate));
  const completeCalled = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate);
      setTime(remaining);
      if (remaining.isComplete && !completeCalled.current) {
        completeCalled.current = true;
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  return (
    <View style={[styles.container, style]}>
      {(title || emoji) && (
        <View style={[styles.titleRow, { marginBottom: spacing.md }]}>
          {emoji && <Text style={styles.emoji}>{emoji}</Text>}
          {title && (
            <Text style={[typography.h3, { color: colors.text.primary, marginLeft: emoji ? spacing.sm : 0 }]}>
              {title}
            </Text>
          )}
        </View>
      )}
      <View style={styles.statsRow}>
        <StatBlock value={time.days} label="DAYS" />
        <Text style={[typography.stat, { color: colors.text.muted, marginHorizontal: spacing.xs }]}>:</Text>
        <StatBlock value={time.hours} label="HRS" />
        <Text style={[typography.stat, { color: colors.text.muted, marginHorizontal: spacing.xs }]}>:</Text>
        <StatBlock value={time.minutes} label="MIN" />
        <Text style={[typography.stat, { color: colors.text.muted, marginHorizontal: spacing.xs }]}>:</Text>
        <StatBlock value={time.seconds} label="SEC" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBlock: {
    alignItems: 'center',
  },
});
