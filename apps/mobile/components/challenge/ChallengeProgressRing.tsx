import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { ProgressRing } from '@components/ui/ProgressRing';

interface ChallengeProgressRingProps {
  currentDay: number;
  totalDays: number;
  restartCount?: number;
}

export function ChallengeProgressRing({
  currentDay,
  totalDays,
  restartCount = 0,
}: ChallengeProgressRingProps) {
  const { colors, typography, spacing } = useTheme();

  const progress = totalDays > 0 ? Math.min(currentDay / totalDays, 1) : 0;

  return (
    <View style={styles.container}>
      <ProgressRing
        progress={progress}
        size={180}
        strokeWidth={14}
        color={colors.accent.primary}
        trackColor={colors.background.tertiary}
        animationDuration={800}
      >
        <View style={styles.centerContent}>
          <Text
            style={[
              typography.caption,
              { color: colors.text.muted, marginBottom: 2 },
            ]}
          >
            DAY
          </Text>
          <Text
            style={[
              styles.dayNumber,
              { color: colors.text.primary },
            ]}
          >
            {currentDay}
          </Text>
        </View>
      </ProgressRing>

      {/* Day label below ring */}
      <Text
        style={[
          typography.body,
          {
            color: colors.text.secondary,
            marginTop: spacing.md,
            textAlign: 'center',
          },
        ]}
      >
        Day {currentDay} of {totalDays}
      </Text>

      {/* Restart indicator */}
      {restartCount > 0 && (
        <Text
          style={[
            typography.tiny,
            {
              color: colors.accent.warning,
              marginTop: spacing.xs,
              textAlign: 'center',
            },
          ]}
        >
          Restart #{restartCount}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },
});
