// =============================================================================
// TRANSFORMR -- Supplement Days Remaining
// Mini inline indicator showing how many days of a supplement remain based on
// bottle_size, purchased_at, and consumption rate from logs.
// =============================================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { ProgressRing } from '@components/ui/ProgressRing';
import { MonoText } from '@components/ui/MonoText';

interface SupplementDaysRemainingProps {
  bottleSize: number;
  dosesTaken: number;
  dailyRate: number;
}

export function SupplementDaysRemaining({
  bottleSize,
  dosesTaken,
  dailyRate,
}: SupplementDaysRemainingProps) {
  const { colors, typography, spacing } = useTheme();

  const { daysLeft, progress, statusColor, label } = useMemo(() => {
    const remaining = Math.max(0, bottleSize - dosesTaken);
    const rate = Math.max(0.01, dailyRate);
    const days = Math.round(remaining / rate);
    const pct = remaining / Math.max(1, bottleSize);

    let color = colors.accent.success;
    let text = `${days}d left`;
    if (days <= 0) {
      color = colors.accent.danger;
      text = 'Empty';
    } else if (days <= 7) {
      color = colors.accent.danger;
      text = `${days}d left`;
    } else if (days <= 14) {
      color = colors.accent.warning;
      text = `${days}d left`;
    }

    return {
      daysLeft: days,
      progress: pct,
      statusColor: color,
      label: text,
    };
  }, [bottleSize, colors, dailyRate, dosesTaken]);

  return (
    <View style={styles.container}>
      <ProgressRing
        progress={progress}
        size={36}
        strokeWidth={3}
        color={statusColor}
      >
        <MonoText
          style={{
            fontSize: 9,
            color: statusColor,
            fontWeight: '700',
          }}
        >
          {daysLeft <= 0 ? '0' : daysLeft.toString()}
        </MonoText>
      </ProgressRing>
      <Text
        style={[
          typography.tiny,
          {
            color: statusColor,
            marginLeft: spacing.xs,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
