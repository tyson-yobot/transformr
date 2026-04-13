import { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

type Recommendation = 'go_hard' | 'moderate' | 'light' | 'rest';

interface ComponentBreakdown {
  label: string;
  value: number; // 0–100
}

interface ReadinessCardProps {
  score: number; // 0–100
  recommendation: Recommendation;
  components: ComponentBreakdown[];
  style?: ViewStyle;
}

function getScoreColor(
  score: number,
  colors: ReturnType<typeof import('@theme/index').useTheme>['colors'],
): string {
  if (score >= 80) return colors.accent.success;
  if (score >= 60) return colors.accent.primary;
  if (score >= 40) return colors.accent.warning;
  return colors.accent.danger;
}

function getScoreEmoji(score: number): string {
  if (score >= 80) return '\uD83D\uDE0E';
  if (score >= 60) return '\uD83D\uDCAA';
  if (score >= 40) return '\uD83D\uDE10';
  return '\uD83D\uDE34';
}

const recommendationText: Record<Recommendation, string> = {
  go_hard: 'You are primed -- go all out today!',
  moderate: 'Solid readiness. Push with purpose.',
  light: 'Take it easy. Focus on technique.',
  rest: 'Recovery day recommended. Listen to your body.',
};

function MiniBar({
  label,
  value,
  scoreColor,
}: {
  label: string;
  value: number;
  scoreColor: string;
}) {
  const { colors, typography, spacing } = useTheme();
  const animWidth = useSharedValue(0);

  useEffect(() => {
    animWidth.value = withTiming(Math.max(0, Math.min(100, value)), {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, animWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animWidth.value}%` as unknown as number,
  }));

  return (
    <View style={[styles.miniBarWrap, { marginBottom: spacing.sm }]}>
      <View style={[styles.miniBarLabel, { marginBottom: spacing.xs }]}>
        <Text style={[typography.tiny, { color: colors.text.secondary }]}>
          {label}
        </Text>
        <Text style={[typography.tiny, { color: colors.text.primary }]}>
          {value}
        </Text>
      </View>
      <View
        style={[
          styles.miniBarTrack,
          {
            height: 4,
            backgroundColor: colors.background.tertiary,
            borderRadius: 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.miniBarFill,
            {
              height: 4,
              backgroundColor: scoreColor,
              borderRadius: 2,
            },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
}

export function ReadinessCard({
  score,
  recommendation,
  components,
  style,
}: ReadinessCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const scoreColor = getScoreColor(score, colors);
  const emoji = getScoreEmoji(score);
  const recText = recommendationText[recommendation];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {/* Header */}
      <Text
        style={[
          typography.h3,
          { color: colors.text.primary, marginBottom: spacing.lg },
        ]}
      >
        Daily Readiness
      </Text>

      {/* Score and emoji row */}
      <View style={[styles.scoreRow, { marginBottom: spacing.md }]}>
        <View style={styles.scoreWrap}>
          <Text
            style={{
              fontSize: 52,
              fontWeight: '700',
              color: scoreColor,
            }}
          >
            {score}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.text.muted, marginTop: spacing.xs },
            ]}
          >
            / 100
          </Text>
        </View>
        <Text style={{ fontSize: 40 }}>{emoji}</Text>
      </View>

      {/* Recommendation */}
      <View
        style={[
          styles.recWrap,
          {
            backgroundColor: `${scoreColor}15`,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Text style={[typography.body, { color: scoreColor }]}>
          {recText}
        </Text>
      </View>

      {/* Component breakdown */}
      {components.map((comp) => (
        <MiniBar
          key={comp.label}
          label={comp.label}
          value={comp.value}
          scoreColor={scoreColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreWrap: {
    alignItems: 'flex-start',
  },
  recWrap: {},
  miniBarWrap: {},
  miniBarLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniBarTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  miniBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
