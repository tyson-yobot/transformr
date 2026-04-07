import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

interface LiveSyncIndicatorProps {
  isSynced: boolean;
  partnerName: string;
  partnerExercise?: string;
  partnerSetNumber?: number;
  partnerReps?: number;
  partnerWeight?: number;
  style?: ViewStyle;
}

function PulsingDot({
  color,
  isSynced,
}: {
  color: string;
  isSynced: boolean;
}) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (isSynced) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 800, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 800, easing: Easing.in(Easing.cubic) }),
        ),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 800 }),
          withTiming(0.6, { duration: 800 }),
        ),
        -1,
        false,
      );
    }
  }, [isSynced, pulseScale, pulseOpacity]);

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.dotContainer}>
      {isSynced ? (
        <Animated.View
          style={[
            styles.pulseRing,
            { borderColor: color },
            pulseRingStyle,
          ]}
        />
      ) : null}
      <View
        style={[
          styles.dot,
          { backgroundColor: color },
        ]}
      />
    </View>
  );
}

export function LiveSyncIndicator({
  isSynced,
  partnerName,
  partnerExercise,
  partnerSetNumber,
  partnerReps,
  partnerWeight,
  style,
}: LiveSyncIndicatorProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const dotColor = isSynced ? colors.accent.success : colors.text.muted;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        },
        style,
      ]}
    >
      <View style={styles.topRow}>
        <PulsingDot color={dotColor} isSynced={isSynced} />
        <Text
          style={[
            typography.captionBold,
            {
              color: isSynced ? colors.text.primary : colors.text.muted,
              marginLeft: spacing.sm,
            },
          ]}
        >
          {partnerName}
        </Text>
        <Text
          style={[
            typography.tiny,
            {
              color: isSynced ? colors.accent.success : colors.text.muted,
              marginLeft: spacing.sm,
            },
          ]}
        >
          {isSynced ? 'Live' : 'Offline'}
        </Text>
      </View>

      {isSynced && partnerExercise ? (
        <View style={[styles.dataRow, { marginTop: spacing.xs }]}>
          <Text
            style={[
              typography.caption,
              { color: colors.text.secondary, flex: 1 },
            ]}
            numberOfLines={1}
          >
            {partnerExercise}
          </Text>
          {partnerSetNumber !== undefined ? (
            <Text style={[typography.tiny, { color: colors.text.muted }]}>
              Set {partnerSetNumber}
              {partnerWeight !== undefined ? ` \u2022 ${partnerWeight}lb` : ''}
              {partnerReps !== undefined ? ` x ${partnerReps}` : ''}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotContainer: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
