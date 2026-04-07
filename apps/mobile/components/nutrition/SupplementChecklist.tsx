import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import type { Supplement, SupplementLog } from '../../types/database';

interface SupplementChecklistProps {
  supplements: Supplement[];
  todayLogs: SupplementLog[];
  onToggle: (supplementId: string) => void;
  style?: ViewStyle;
}

function formatTakenTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const CATEGORY_EMOJIS: Record<string, string> = {
  protein: '\u{1F4AA}',
  creatine: '\u{26A1}',
  vitamin: '\u{1F48A}',
  mineral: '\u{1F48E}',
  amino_acid: '\u{1F9EC}',
  pre_workout: '\u{1F525}',
  post_workout: '\u{1F3CB}',
  sleep: '\u{1F4A4}',
  other: '\u{2795}',
};

export function SupplementChecklist({
  supplements,
  todayLogs,
  onToggle,
  style,
}: SupplementChecklistProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const takenMap = useMemo(() => {
    const map = new Map<string, SupplementLog>();
    for (const log of todayLogs) {
      if (log.supplement_id) {
        map.set(log.supplement_id, log);
      }
    }
    return map;
  }, [todayLogs]);

  const activeSupplements = useMemo(
    () => supplements.filter((s) => s.is_active !== false),
    [supplements],
  );

  const allDone = activeSupplements.length > 0 &&
    activeSupplements.every((s) => takenMap.has(s.id));

  const completedCount = activeSupplements.filter((s) => takenMap.has(s.id)).length;

  const handleToggle = useCallback(
    (supplementId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onToggle(supplementId);
    },
    [onToggle],
  );

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
      accessibilityRole="list"
      accessibilityLabel={`Supplement checklist: ${completedCount} of ${activeSupplements.length} taken`}
    >
      <View style={styles.header}>
        <Text style={[typography.h3, { color: colors.text.primary }]}>
          {'\u{1F48A}'} Supplements
        </Text>
        <Text style={[typography.caption, { color: colors.text.secondary }]}>
          {completedCount}/{activeSupplements.length}
        </Text>
      </View>

      {activeSupplements.length === 0 ? (
        <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.lg, textAlign: 'center' }]}>
          No active supplements
        </Text>
      ) : (
        <View style={{ marginTop: spacing.md }}>
          {activeSupplements.map((supplement, index) => {
            const log = takenMap.get(supplement.id);
            const isTaken = !!log;
            const emoji = CATEGORY_EMOJIS[supplement.category ?? 'other'] ?? CATEGORY_EMOJIS.other;

            return (
              <SupplementItem
                key={supplement.id}
                supplement={supplement}
                isTaken={isTaken}
                takenAt={log?.taken_at}
                emoji={emoji}
                index={index}
                onToggle={handleToggle}
                colors={colors}
                typography={typography}
                spacing={spacing}
                borderRadius={borderRadius}
              />
            );
          })}
        </View>
      )}

      {allDone ? (
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          style={[
            styles.celebration,
            {
              backgroundColor: `${colors.accent.success}15`,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginTop: spacing.lg,
              borderWidth: 1,
              borderColor: `${colors.accent.success}30`,
            },
          ]}
        >
          <Text style={[styles.celebrationEmoji]}>
            {'\u{1F389}'}
          </Text>
          <Text
            style={[
              typography.bodyBold,
              { color: colors.accent.success, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            All supplements taken!
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs },
            ]}
          >
            Great job staying consistent
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

interface SupplementItemProps {
  supplement: Supplement;
  isTaken: boolean;
  takenAt: string | undefined;
  emoji: string;
  index: number;
  onToggle: (id: string) => void;
  colors: ReturnType<typeof import('@theme/index').useTheme>['colors'];
  typography: ReturnType<typeof import('@theme/index').useTheme>['typography'];
  spacing: ReturnType<typeof import('@theme/index').useTheme>['spacing'];
  borderRadius: ReturnType<typeof import('@theme/index').useTheme>['borderRadius'];
}

function SupplementItem({
  supplement,
  isTaken,
  takenAt,
  emoji,
  index,
  onToggle,
  colors,
  typography,
  spacing,
  borderRadius,
}: SupplementItemProps) {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(isTaken ? 1 : 0);

  React.useEffect(() => {
    checkScale.value = withSpring(isTaken ? 1 : 0, { damping: 12, stiffness: 200 });
  }, [isTaken, checkScale]);

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
    onToggle(supplement.id);
  }, [supplement.id, onToggle, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * 60).duration(250)}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        style={[
          styles.supplementItem,
          {
            backgroundColor: isTaken
              ? `${colors.accent.success}10`
              : colors.background.tertiary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
            borderWidth: 1,
            borderColor: isTaken
              ? `${colors.accent.success}30`
              : 'transparent',
          },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isTaken }}
        accessibilityLabel={`${supplement.name} ${isTaken ? 'taken' : 'not taken'}`}
      >
        <View
          style={[
            styles.checkbox,
            {
              width: 28,
              height: 28,
              borderRadius: borderRadius.sm,
              borderWidth: 2,
              borderColor: isTaken ? colors.accent.success : colors.border.default,
              backgroundColor: isTaken ? colors.accent.success : 'transparent',
              marginRight: spacing.md,
            },
          ]}
        >
          <Animated.View style={checkAnimatedStyle}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
              {'\u2713'}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.supplementInfo}>
          <View style={styles.supplementTitleRow}>
            <Text style={{ fontSize: 16, marginRight: 6 }}>{emoji}</Text>
            <Text
              style={[
                typography.bodyBold,
                {
                  color: isTaken ? colors.text.secondary : colors.text.primary,
                  textDecorationLine: isTaken ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {supplement.name}
            </Text>
          </View>
          <View style={styles.supplementDetails}>
            {supplement.dosage ? (
              <Text style={[typography.caption, { color: colors.text.muted }]}>
                {supplement.dosage}
              </Text>
            ) : null}
            {supplement.times && supplement.times.length > 0 ? (
              <Text style={[typography.tiny, { color: colors.text.muted, marginLeft: spacing.sm }]}>
                {supplement.times.join(', ')}
              </Text>
            ) : null}
          </View>
        </View>

        {isTaken && takenAt ? (
          <Text style={[typography.tiny, { color: colors.accent.success }]}>
            {formatTakenTime(takenAt)}
          </Text>
        ) : null}
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
  supplementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  supplementInfo: {
    flex: 1,
  },
  supplementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supplementDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  celebration: {
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 40,
  },
});
