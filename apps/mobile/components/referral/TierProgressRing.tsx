// =============================================================================
// TierProgressRing.tsx — Circular SVG progress ring for referral tier tracking
// =============================================================================
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@theme/index';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TierProgressRingProps {
  current: number;
  target: number;
  tierName: string;
  nextTierName: string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const RING_SIZE = 160;
const STROKE_WIDTH = 10;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TIER_COLORS: Record<string, string> = {
  Starter: '#A78BFA',
  Pro: '#3B82F6',
  Elite: '#F59E0B',
  Partners: '#EC4899',
  Lifetime: '#10B981',
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const TierProgressRing: React.FC<TierProgressRingProps> = ({
  current,
  target,
  tierName,
  nextTierName,
}) => {
  const { colors, spacing, borderRadius } = useTheme();

  const progress = useMemo(() => {
    if (target <= 0) return 1;
    return Math.min(current / target, 1);
  }, [current, target]);

  const strokeDashoffset = useMemo(
    () => CIRCUMFERENCE * (1 - progress),
    [progress],
  );

  const accentColor = TIER_COLORS[tierName] ?? colors.accent.primary;

  return (
    <View style={[styles.container, { padding: spacing.md }]}>
      <View style={styles.ringWrapper}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          {/* Background track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.background.secondary}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={accentColor}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>

        {/* Center text */}
        <View style={styles.centerText}>
          <Text
            style={[
              styles.currentCount,
              {
                color: colors.text.primary,
                fontSize: 32,
                fontWeight: '700',
              },
            ]}
          >
            {current}
          </Text>
          <Text
            style={[
              styles.targetCount,
              {
                color: colors.text.muted,
                fontSize: 14,
                fontWeight: '500',
              },
            ]}
          >
            / {target}
          </Text>
        </View>
      </View>

      {/* Tier label */}
      <Text
        style={[
          styles.tierName,
          {
            color: accentColor,
            fontSize: 16,
            fontWeight: '700',
            marginTop: spacing.sm,
          },
        ]}
      >
        {tierName}
      </Text>

      {current < target ? (
        <Text
          style={[
            styles.nextTier,
            {
              color: colors.text.secondary,
              fontSize: 12,
              marginTop: spacing.xs,
            },
          ]}
        >
          {target - current} more to reach {nextTierName}
        </Text>
      ) : (
        <Text
          style={[
            styles.nextTier,
            {
              color: colors.accent.success,
              fontSize: 12,
              marginTop: spacing.xs,
            },
          ]}
        >
          Tier unlocked!
        </Text>
      )}
    </View>
  );
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentCount: {
    textAlign: 'center',
  },
  targetCount: {
    textAlign: 'center',
  },
  tierName: {
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextTier: {
    textAlign: 'center',
  },
});

export default TierProgressRing;
