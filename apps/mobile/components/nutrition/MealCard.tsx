import { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import type { NutritionLog } from '../../types/database';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'shake' | 'pre_workout' | 'post_workout';
type LogSource = 'manual' | 'camera' | 'barcode' | 'voice' | 'saved_meal' | 'menu_scan';

interface MealCardProps {
  log: NutritionLog;
  foodName: string;
  onEdit: (logId: string) => void;
  onDelete: (logId: string) => void;
  style?: ViewStyle;
}

const SWIPE_THRESHOLD = -80;

const MEAL_TYPE_CONFIG: Record<MealType, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: '\u{1F373}' },
  lunch: { label: 'Lunch', emoji: '\u{1F96A}' },
  dinner: { label: 'Dinner', emoji: '\u{1F35D}' },
  snack: { label: 'Snack', emoji: '\u{1F34E}' },
  shake: { label: 'Shake', emoji: '\u{1F964}' },
  pre_workout: { label: 'Pre-Workout', emoji: '\u{26A1}' },
  post_workout: { label: 'Post-Workout', emoji: '\u{1F4AA}' },
};

const SOURCE_LABELS: Record<LogSource, string> = {
  manual: 'Manual',
  camera: 'AI Camera',
  barcode: 'Barcode',
  voice: 'Voice',
  saved_meal: 'Saved Meal',
  menu_scan: 'Menu Scan',
};

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function MealCard({
  log,
  foodName,
  onEdit,
  onDelete,
  style,
}: MealCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);

  const mealType = (log.meal_type ?? 'snack') as MealType;
  const source = (log.source ?? 'manual') as LogSource;
  const mealConfig = MEAL_TYPE_CONFIG[mealType];

  const triggerDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete(log.id);
  }, [log.id, onDelete]);

  const triggerEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit(log.id);
  }, [log.id, onEdit]);

  const panGesture = Gesture.Pan()
    .activeOffsetX(-10)
    .onUpdate((event) => {
      const clampedX = Math.min(0, Math.max(-120, event.translationX));
      translateX.value = clampedX;
      deleteOpacity.value = Math.min(1, Math.abs(clampedX) / Math.abs(SWIPE_THRESHOLD));
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withTiming(-120, { duration: 200 });
        deleteOpacity.value = withTiming(1, { duration: 200 });
        runOnJS(triggerDelete)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        deleteOpacity.value = withTiming(0, { duration: 150 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    opacity: deleteOpacity.value,
  }));

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View
        style={[
          styles.deleteContainer,
          {
            backgroundColor: colors.accent.danger,
            borderRadius: borderRadius.lg,
          },
          deleteAnimatedStyle,
        ]}
      >
        <Text style={[typography.bodyBold, { color: '#FFFFFF' /* brand-ok — white on delete action */ }]}>Delete</Text>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
            },
            cardAnimatedStyle,
          ]}
        >
          <Pressable onPress={triggerEdit} accessibilityRole="button" accessibilityLabel={`Edit ${foodName}`}>
            <View style={styles.topRow}>
              <View
                style={[
                  styles.mealBadge,
                  {
                    backgroundColor: `${colors.accent.primary}20`,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: colors.accent.primary }]}>
                  {mealConfig.emoji} {mealConfig.label}
                </Text>
              </View>

              <View
                style={[
                  styles.sourceBadge,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                  },
                ]}
              >
                <Text style={[typography.tiny, { color: colors.text.muted }]}>
                  {SOURCE_LABELS[source]}
                </Text>
              </View>
            </View>

            <View style={[styles.contentRow, { marginTop: spacing.md }]}>
              {source === 'camera' && log.photo_url ? (
                <Image
                  source={{ uri: log.photo_url }}
                  style={[
                    styles.thumbnail,
                    {
                      borderRadius: borderRadius.sm,
                      marginRight: spacing.md,
                    },
                  ]}
                  accessibilityLabel={`Photo of ${foodName}`}
                />
              ) : null}

              <View style={styles.infoColumn}>
                <Text
                  style={[typography.bodyBold, { color: colors.text.primary }]}
                  numberOfLines={2}
                >
                  {foodName}
                </Text>

                {log.quantity && log.quantity !== 1 ? (
                  <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]}>
                    x{log.quantity} servings
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={[styles.macroRow, { marginTop: spacing.md }]}>
              <MacroChip
                label="Cal"
                value={log.calories}
                color={colors.accent.fire}
                textColor={colors.text.primary}
                bgColor={colors.background.tertiary}
                borderRadiusValue={borderRadius.sm}
                spacingValue={spacing}
                typographyValue={typography}
              />
              <MacroChip
                label="P"
                value={log.protein}
                unit="g"
                color={colors.accent.info}
                textColor={colors.text.primary}
                bgColor={colors.background.tertiary}
                borderRadiusValue={borderRadius.sm}
                spacingValue={spacing}
                typographyValue={typography}
              />
              <MacroChip
                label="C"
                value={log.carbs}
                unit="g"
                color={colors.accent.success}
                textColor={colors.text.primary}
                bgColor={colors.background.tertiary}
                borderRadiusValue={borderRadius.sm}
                spacingValue={spacing}
                typographyValue={typography}
              />
              <MacroChip
                label="F"
                value={log.fat}
                unit="g"
                color={colors.accent.warning}
                textColor={colors.text.primary}
                bgColor={colors.background.tertiary}
                borderRadiusValue={borderRadius.sm}
                spacingValue={spacing}
                typographyValue={typography}
              />
            </View>

            {log.logged_at ? (
              <Text
                style={[
                  typography.tiny,
                  { color: colors.text.muted, marginTop: spacing.sm, alignSelf: 'flex-end' },
                ]}
              >
                {formatTime(log.logged_at)}
              </Text>
            ) : null}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

interface MacroChipProps {
  label: string;
  value: number;
  unit?: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderRadiusValue: number;
  spacingValue: { xs: number; sm: number };
  typographyValue: typeof import('../../theme/typography').typography;
}

function MacroChip({
  label,
  value,
  unit,
  color,
  textColor,
  bgColor,
  borderRadiusValue,
  spacingValue,
  typographyValue,
}: MacroChipProps) {
  return (
    <View
      style={[
        styles.macroChip,
        {
          backgroundColor: bgColor,
          borderRadius: borderRadiusValue,
          paddingHorizontal: spacingValue.sm,
          paddingVertical: spacingValue.xs,
        },
      ]}
    >
      <Text style={[typographyValue.tiny, { color }]}>{label}</Text>
      <Text style={[typographyValue.captionBold, { color: textColor, marginLeft: 4 }]}>
        {Math.round(value)}
        {unit ?? ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  card: {
    zIndex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealBadge: {},
  sourceBadge: {},
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoColumn: {
    flex: 1,
  },
  thumbnail: {
    width: 56,
    height: 56,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
