import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

interface GhostData {
  weight: number;
  reps: number;
}

interface SetLoggerProps {
  setNumber: number;
  weight: string;
  reps: string;
  rpe?: number;
  isWarmup?: boolean;
  isDropset?: boolean;
  isFailure?: boolean;
  isPR?: boolean;
  ghostData?: GhostData;
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onRpeChange?: (value: number) => void;
  onToggleWarmup?: () => void;
  onToggleDropset?: () => void;
  onToggleFailure?: () => void;
  onDelete?: () => void;
  showRpe?: boolean;
  style?: ViewStyle;
}

function TogglePill({
  label,
  isActive,
  onPress,
  activeColor,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  activeColor: string;
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.togglePill,
        {
          backgroundColor: isActive ? `${activeColor}20` : colors.background.tertiary,
          borderRadius: borderRadius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderWidth: 1,
          borderColor: isActive ? activeColor : 'transparent',
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <Text
        style={[
          typography.tiny,
          { color: isActive ? activeColor : colors.text.muted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RpeSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const rpeValues = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];

  return (
    <View style={[styles.rpeRow, { gap: spacing.xs, marginTop: spacing.sm }]}>
      <Text style={[typography.tiny, { color: colors.text.muted, marginRight: spacing.xs }]}>
        RPE
      </Text>
      {rpeValues.map((rpe) => (
        <Pressable
          key={rpe}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(rpe);
          }}
          style={[
            styles.rpeChip,
            {
              backgroundColor:
                value === rpe ? colors.accent.primary : colors.background.tertiary,
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.xs,
              paddingVertical: 2,
            },
          ]}
        >
          <Text
            style={[
              typography.tiny,
              {
                color: value === rpe ? '#FFFFFF' : colors.text.muted,
                fontWeight: value === rpe ? '700' : '400',
              },
            ]}
          >
            {rpe}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function SetLogger({
  setNumber,
  weight,
  reps,
  rpe,
  isWarmup = false,
  isDropset = false,
  isFailure = false,
  isPR = false,
  ghostData,
  onWeightChange,
  onRepsChange,
  onRpeChange,
  onToggleWarmup,
  onToggleDropset,
  onToggleFailure,
  onDelete,
  showRpe = false,
  style,
}: SetLoggerProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const translateX = useSharedValue(0);
  const prScale = useSharedValue(1);

  // Swipe-to-delete gesture
  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (onDelete && e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -100);
      }
    })
    .onEnd((e) => {
      if (onDelete && e.translationX < -60) {
        translateX.value = withSpring(-200, { damping: 15 }, () => {
          runOnJS(onDelete)();
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // PR celebration mini-animation
  React.useEffect(() => {
    if (isPR) {
      prScale.value = withSequence(
        withSpring(1.1, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 200 }),
      );
    }
  }, [isPR, prScale]);

  const prAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: prScale.value }],
  }));

  const weightNum = parseFloat(weight) || 0;
  const repsNum = parseInt(reps, 10) || 0;
  const beatingGhostWeight = ghostData ? weightNum > ghostData.weight : false;
  const beatingGhostReps = ghostData ? repsNum > ghostData.reps : false;

  return (
    <View style={[styles.outerWrap, style]}>
      {/* Delete background */}
      {onDelete ? (
        <View
          style={[
            styles.deleteBackground,
            {
              backgroundColor: colors.accent.danger,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Text style={[typography.captionBold, { color: '#FFFFFF', /* brand-ok */
            Delete
          </Text>
        </View>
      ) : null}

      <GestureDetector gesture={swipeGesture}>
        <Animated.View
          style={[
            styles.row,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              borderLeftWidth: 3,
              borderLeftColor: isWarmup
                ? colors.accent.warning
                : isPR
                  ? colors.accent.gold
                  : colors.background.secondary,
            },
            swipeStyle,
          ]}
        >
          {/* Set number */}
          <View style={[styles.setNumberWrap, { marginRight: spacing.md }]}>
            <Text
              style={[
                typography.captionBold,
                { color: isWarmup ? colors.accent.warning : colors.text.secondary },
              ]}
            >
              {isWarmup ? 'W' : setNumber}
            </Text>
          </View>

          {/* Weight input */}
          <View style={[styles.inputGroup, { marginRight: spacing.sm }]}>
            <Text style={[typography.tiny, { color: colors.text.muted, marginBottom: 2 }]}>
              Weight
            </Text>
            <TextInput
              value={weight}
              onChangeText={onWeightChange}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.tertiary,
                  borderRadius: borderRadius.sm,
                  color: beatingGhostWeight
                    ? colors.accent.success
                    : colors.text.primary,
                  ...typography.bodyBold,
                },
              ]}
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              accessibilityLabel={`Weight for set ${setNumber}`}
            />
            {ghostData ? (
              <Text
                style={[
                  typography.tiny,
                  {
                    color: beatingGhostWeight
                      ? colors.accent.success
                      : colors.text.muted,
                    marginTop: 2,
                  },
                ]}
              >
                {'\uD83D\uDC7B'} {ghostData.weight}
              </Text>
            ) : null}
          </View>

          {/* Reps input */}
          <View style={[styles.inputGroup, { marginRight: spacing.sm }]}>
            <Text style={[typography.tiny, { color: colors.text.muted, marginBottom: 2 }]}>
              Reps
            </Text>
            <TextInput
              value={reps}
              onChangeText={onRepsChange}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.tertiary,
                  borderRadius: borderRadius.sm,
                  color: beatingGhostReps
                    ? colors.accent.success
                    : colors.text.primary,
                  ...typography.bodyBold,
                },
              ]}
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              accessibilityLabel={`Reps for set ${setNumber}`}
            />
            {ghostData ? (
              <Text
                style={[
                  typography.tiny,
                  {
                    color: beatingGhostReps
                      ? colors.accent.success
                      : colors.text.muted,
                    marginTop: 2,
                  },
                ]}
              >
                {'\uD83D\uDC7B'} {ghostData.reps}
              </Text>
            ) : null}
          </View>

          {/* PR indicator */}
          {isPR ? (
            <Animated.View
              style={[
                styles.prBadge,
                {
                  backgroundColor: `${colors.accent.gold}20`,
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                },
                prAnimStyle,
              ]}
            >
              <Text style={[typography.tiny, { color: colors.accent.gold, fontWeight: '700' }]}>
                {'\uD83C\uDFC6'} PR
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      </GestureDetector>

      {/* Toggle pills */}
      <View style={[styles.toggleRow, { marginTop: spacing.sm, gap: spacing.xs }]}>
        {onToggleWarmup ? (
          <TogglePill
            label="Warmup"
            isActive={isWarmup}
            onPress={onToggleWarmup}
            activeColor={colors.accent.warning}
          />
        ) : null}
        {onToggleDropset ? (
          <TogglePill
            label="Dropset"
            isActive={isDropset}
            onPress={onToggleDropset}
            activeColor={colors.accent.info}
          />
        ) : null}
        {onToggleFailure ? (
          <TogglePill
            label="Failure"
            isActive={isFailure}
            onPress={onToggleFailure}
            activeColor={colors.accent.danger}
          />
        ) : null}
      </View>

      {/* RPE slider */}
      {showRpe && onRpeChange ? (
        <RpeSlider value={rpe ?? 0} onChange={onRpeChange} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: 'relative',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setNumberWrap: {
    width: 28,
    alignItems: 'center',
  },
  inputGroup: {
    flex: 1,
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'center',
  },
  prBadge: {
    marginLeft: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  togglePill: {},
  rpeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rpeChip: {},
});
