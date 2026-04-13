import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import type { WaterLog } from '../../types/database';

interface QuickAddOption {
  label: string;
  oz: number;
}

interface WaterTrackerProps {
  logs: WaterLog[];
  dailyGoalOz: number;
  onAddWater: (oz: number) => void;
  style?: ViewStyle;
}

const QUICK_ADD_OPTIONS: QuickAddOption[] = [
  { label: '+8oz', oz: 8 },
  { label: '+16oz', oz: 16 },
  { label: '+32oz', oz: 32 },
];

function formatLogTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function WaterGlassVisualization({
  fillPercent,
  size,
  color,
  trackColor,
}: {
  fillPercent: number;
  size: number;
  color: string;
  trackColor: string;
}) {
  const fillHeight = useSharedValue(0);

  React.useEffect(() => {
    fillHeight.value = withTiming(Math.min(1, Math.max(0, fillPercent)), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [fillPercent, fillHeight]);

  const animatedProps = useAnimatedStyle(() => {
    const h = fillHeight.value * (size - 20);
    return {
      height: h,
      width: size - 20,
      backgroundColor: color,
      position: 'absolute' as const,
      bottom: 10,
      left: 10,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      opacity: 0.8,
    };
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size - 10,
          height: size - 10,
          borderWidth: 3,
          borderColor: trackColor,
          borderRadius: 12,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Animated.View style={animatedProps} />
      </View>
    </View>
  );
}

export function WaterTracker({
  logs,
  dailyGoalOz,
  onAddWater,
  style,
}: WaterTrackerProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const totalOz = useMemo(
    () => logs.reduce((sum, log) => sum + log.amount_oz, 0),
    [logs],
  );

  const progress = dailyGoalOz > 0 ? totalOz / dailyGoalOz : 0;
  const remainingOz = Math.max(0, dailyGoalOz - totalOz);
  const percentage = Math.min(100, Math.round(progress * 100));

  const handleQuickAdd = useCallback(
    (oz: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onAddWater(oz);
    },
    [onAddWater],
  );

  const getProgressColor = (): string => {
    if (progress >= 1) return colors.accent.success;
    if (progress >= 0.6) return colors.accent.info;
    return colors.accent.info;
  };

  const progressColor = getProgressColor();

  const renderLogItem = useCallback(
    ({ item, index }: { item: WaterLog; index: number }) => (
      <Animated.View
        entering={FadeInUp.delay(index * 50).duration(200)}
        style={[
          styles.logItem,
          {
            backgroundColor: colors.background.tertiary,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            marginBottom: spacing.xs,
          },
        ]}
      >
        <Text style={[typography.caption, { color: colors.accent.info }]}>
          {'\u{1F4A7}'} {item.amount_oz}oz
        </Text>
        <Text style={[typography.tiny, { color: colors.text.muted }]}>
          {formatLogTime(item.logged_at)}
        </Text>
      </Animated.View>
    ),
    [colors, typography, spacing, borderRadius],
  );

  const keyExtractor = useCallback((item: WaterLog) => item.id, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
        },
        style,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Water intake: ${totalOz} of ${dailyGoalOz} ounces`}
    >
      <View style={styles.header}>
        <Text style={[typography.h3, { color: colors.text.primary }]}>
          {'\u{1F4A7}'} Water
        </Text>
        {progress >= 1 ? (
          <Text style={[typography.captionBold, { color: colors.accent.success }]}>
            Goal Reached!
          </Text>
        ) : null}
      </View>

      <View style={[styles.visualRow, { marginTop: spacing.lg }]}>
        <WaterGlassVisualization
          fillPercent={progress}
          size={100}
          color={progressColor}
          trackColor={colors.background.tertiary}
        />

        <View style={[styles.statsColumn, { marginLeft: spacing.xl }]}>
          <Text style={[typography.stat, { color: colors.text.primary }]}>
            {totalOz}
            <Text style={[typography.body, { color: colors.text.muted }]}> oz</Text>
          </Text>
          <View style={[styles.progressBarTrack, { backgroundColor: colors.background.tertiary, marginTop: spacing.sm }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: progressColor,
                  width: `${percentage}%`,
                },
              ]}
            />
          </View>
          <Text style={[typography.tiny, { color: colors.text.muted, marginTop: spacing.xs }]}>
            {remainingOz > 0
              ? `${remainingOz}oz remaining of ${dailyGoalOz}oz`
              : `${totalOz}oz / ${dailyGoalOz}oz`}
          </Text>
        </View>
      </View>

      <View style={[styles.quickAddRow, { marginTop: spacing.lg, gap: spacing.md }]}>
        {QUICK_ADD_OPTIONS.map((option) => (
          <QuickAddButton
            key={option.oz}
            label={option.label}
            onPress={() => handleQuickAdd(option.oz)}
            accentColor={colors.accent.info}
            bgColor={colors.background.tertiary}
            textColor={colors.text.primary}
            borderRadiusValue={borderRadius.md}
            spacingValue={spacing}
            typographyValue={typography}
          />
        ))}
      </View>

      {logs.length > 0 ? (
        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.captionBold, { color: colors.text.muted, marginBottom: spacing.sm }]}>
            TODAY&apos;S LOG
          </Text>
          <FlatList
            data={[...logs].reverse()}
            renderItem={renderLogItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
          />
        </View>
      ) : null}
    </View>
  );
}

interface QuickAddButtonProps {
  label: string;
  onPress: () => void;
  accentColor: string;
  bgColor: string;
  textColor: string;
  borderRadiusValue: number;
  spacingValue: { md: number; sm: number };
  typographyValue: typeof import('../../theme/typography').typography;
}

function QuickAddButton({
  label,
  onPress,
  accentColor,
  bgColor: _bgColor,
  textColor: _textColor,
  borderRadiusValue,
  spacingValue,
  typographyValue,
}: QuickAddButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  return (
    <Animated.View style={[styles.quickAddButtonWrapper, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.quickAddButton,
          {
            backgroundColor: `${accentColor}20`,
            borderRadius: borderRadiusValue,
            paddingVertical: spacingValue.md,
            paddingHorizontal: spacingValue.md,
            borderWidth: 1,
            borderColor: `${accentColor}40`,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Add ${label} of water`}
      >
        <Text style={[typographyValue.bodyBold, { color: accentColor }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visualRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsColumn: {
    flex: 1,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAddButtonWrapper: {
    flex: 1,
  },
  quickAddButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
