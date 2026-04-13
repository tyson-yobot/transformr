import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

interface MacroValues {
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroRingsProps {
  targets: MacroValues;
  consumed: MacroValues;
  size?: number;
  strokeWidth?: number;
  style?: ViewStyle;
  animationDuration?: number;
}

interface RingConfig {
  key: keyof MacroValues;
  label: string;
  color: string;
  caloriesPerGram: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function AnimatedRing({
  cx,
  cy,
  radius,
  circumference,
  progress,
  color,
  strokeWidth,
  trackColor,
  duration,
}: {
  cx: number;
  cy: number;
  radius: number;
  circumference: number;
  progress: number;
  color: string;
  strokeWidth: number;
  trackColor: string;
  duration: number;
}) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(progress, 1), {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedProgress, duration]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <>
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </>
  );
}

export function MacroRings({
  targets,
  consumed,
  size = 180,
  strokeWidth = 12,
  style,
  animationDuration = 800,
}: MacroRingsProps) {
  const { colors, typography, spacing } = useTheme();

  const ringConfigs: RingConfig[] = useMemo(
    () => [
      { key: 'protein', label: 'Protein', color: colors.accent.success, caloriesPerGram: 4 },
      { key: 'carbs', label: 'Carbs', color: colors.accent.info, caloriesPerGram: 4 },
      { key: 'fat', label: 'Fat', color: colors.accent.warning, caloriesPerGram: 9 },
    ],
    [colors],
  );

  const center = size / 2;
  const ringGap = strokeWidth + 4;
  const trackColor = colors.background.tertiary;

  const totalCaloriesConsumed = useMemo(
    () =>
      consumed.protein * 4 + consumed.carbs * 4 + consumed.fat * 9,
    [consumed],
  );

  const totalCaloriesTarget = useMemo(
    () =>
      targets.protein * 4 + targets.carbs * 4 + targets.fat * 9,
    [targets],
  );

  const rings = useMemo(
    () =>
      ringConfigs.map((config, index) => {
        const radius = center - strokeWidth / 2 - index * ringGap;
        const circumference = 2 * Math.PI * radius;
        const target = targets[config.key];
        const current = consumed[config.key];
        const progress = target > 0 ? current / target : 0;
        return { ...config, radius, circumference, progress, current, target };
      }),
    [ringConfigs, center, strokeWidth, ringGap, targets, consumed],
  );

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {rings.map((ring) => (
            <AnimatedRing
              key={ring.key}
              cx={center}
              cy={center}
              radius={ring.radius}
              circumference={ring.circumference}
              progress={ring.progress}
              color={ring.color}
              strokeWidth={strokeWidth}
              trackColor={trackColor}
              duration={animationDuration}
            />
          ))}
        </Svg>

        {/* Center calories display */}
        <View style={[styles.centerContent, { width: size, height: size }]}>
          <Text style={[typography.stat, { color: colors.text.primary }]}>
            {Math.round(totalCaloriesConsumed)}
          </Text>
          <Text style={[typography.tiny, { color: colors.text.secondary }]}>
            / {Math.round(totalCaloriesTarget)} cal
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={[styles.legend, { marginTop: spacing.lg }]}>
        {rings.map((ring) => (
          <View key={ring.key} style={[styles.legendItem, { gap: spacing.sm }]}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: ring.color },
              ]}
            />
            <View style={styles.legendText}>
              <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                {ring.label}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.secondary }]}>
                {Math.round(ring.current)}g / {Math.round(ring.target)}g
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    position: 'relative',
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    alignItems: 'flex-start',
  },
});
