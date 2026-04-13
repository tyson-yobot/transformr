import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface GhostSetData {
  setNumber: number;
  weight: number;
  reps: number;
}

interface GhostOverlayProps {
  exerciseName: string;
  previousSets: GhostSetData[];
  currentSets: GhostSetData[];
  style?: ViewStyle;
}

function SetComparisonRow({
  setNumber,
  previous,
  current,
}: {
  setNumber: number;
  previous: GhostSetData | undefined;
  current: GhostSetData | undefined;
}) {
  const { colors, typography, spacing } = useTheme();

  const prevWeight = previous?.weight ?? 0;
  const prevReps = previous?.reps ?? 0;
  const curWeight = current?.weight ?? 0;
  const curReps = current?.reps ?? 0;

  const beatingWeight = curWeight > prevWeight;
  const beatingReps = curReps > prevReps;
  const hasCurrentData = current !== undefined && (curWeight > 0 || curReps > 0);

  const weightColor = !hasCurrentData
    ? colors.text.muted
    : beatingWeight
      ? colors.accent.success
      : curWeight < prevWeight
        ? colors.accent.danger
        : colors.text.primary;

  const repsColor = !hasCurrentData
    ? colors.text.muted
    : beatingReps
      ? colors.accent.success
      : curReps < prevReps
        ? colors.accent.danger
        : colors.text.primary;

  return (
    <View style={[styles.setRow, { paddingVertical: spacing.sm }]}>
      <Text
        style={[
          typography.captionBold,
          { color: colors.text.secondary, width: 36 },
        ]}
      >
        S{setNumber}
      </Text>

      {/* Previous */}
      <View style={styles.valueCell}>
        <Text style={[typography.caption, { color: colors.text.muted }]}>
          {prevWeight}lb x {prevReps}
        </Text>
      </View>

      {/* Arrow */}
      <Text
        style={[
          typography.caption,
          { color: colors.text.muted, marginHorizontal: spacing.sm },
        ]}
      >
        {'\u2192'}
      </Text>

      {/* Current */}
      <View style={styles.valueCell}>
        {hasCurrentData ? (
          <Text>
            <Text style={[typography.bodyBold, { color: weightColor }]}>
              {curWeight}lb
            </Text>
            <Text style={[typography.caption, { color: colors.text.muted }]}>
              {' x '}
            </Text>
            <Text style={[typography.bodyBold, { color: repsColor }]}>
              {curReps}
            </Text>
          </Text>
        ) : (
          <Text style={[typography.caption, { color: colors.text.muted }]}>
            --
          </Text>
        )}
      </View>
    </View>
  );
}

export function GhostOverlay({
  exerciseName,
  previousSets,
  currentSets,
  style,
}: GhostOverlayProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const maxSets = Math.max(previousSets.length, currentSets.length);
  const setNumbers = Array.from({ length: maxSets }, (_, i) => i + 1);

  // Determine overall status
  const beatingCount = currentSets.filter((cs) => {
    const ps = previousSets.find((p) => p.setNumber === cs.setNumber);
    if (!ps) return false;
    return cs.weight > ps.weight || cs.reps > ps.reps;
  }).length;
  const completedSets = currentSets.filter(
    (s) => s.weight > 0 || s.reps > 0,
  ).length;
  const isBeating = completedSets > 0 && beatingCount >= completedSets / 2;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${colors.background.secondary}F0`,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: isBeating
            ? `${colors.accent.success}40`
            : `${colors.accent.danger}40`,
        },
        style,
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { marginBottom: spacing.md }]}>
        <Text style={{ fontSize: 18, marginRight: spacing.sm }}>
          {'\uD83D\uDC7B'}
        </Text>
        <Text style={[typography.bodyBold, { color: colors.text.primary, flex: 1 }]}>
          {exerciseName}
        </Text>
      </View>

      {/* Motivation text */}
      <View
        style={[
          styles.motivationWrap,
          {
            backgroundColor: isBeating
              ? `${colors.accent.success}15`
              : `${colors.accent.fire}15`,
            borderRadius: borderRadius.sm,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Text
          style={[
            typography.captionBold,
            {
              color: isBeating ? colors.accent.success : colors.accent.fire,
              textAlign: 'center',
            },
          ]}
        >
          {isBeating
            ? '\uD83D\uDCAA Beat the ghost! You are ahead!'
            : '\uD83D\uDD25 Push harder! Beat your last session!'}
        </Text>
      </View>

      {/* Column labels */}
      <View style={[styles.setRow, { paddingVertical: spacing.xs }]}>
        <Text style={[typography.tiny, { color: colors.text.muted, width: 36 }]}>
          Set
        </Text>
        <View style={styles.valueCell}>
          <Text style={[typography.tiny, { color: colors.text.muted }]}>
            Last Time
          </Text>
        </View>
        <View style={{ width: spacing.sm * 2 + 14 }} />
        <View style={styles.valueCell}>
          <Text style={[typography.tiny, { color: colors.text.muted }]}>
            Now
          </Text>
        </View>
      </View>

      {/* Set rows */}
      {setNumbers.map((num) => {
        const prev = previousSets.find((s) => s.setNumber === num);
        const cur = currentSets.find((s) => s.setNumber === num);
        return (
          <SetComparisonRow
            key={num}
            setNumber={num}
            previous={prev}
            current={cur}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  motivationWrap: {},
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueCell: {
    flex: 1,
  },
});
