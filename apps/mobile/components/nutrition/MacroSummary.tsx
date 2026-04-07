import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';
import { ProgressRing } from '../ui/ProgressRing';

interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroSummaryProps {
  consumed: MacroTargets;
  targets: MacroTargets;
  style?: ViewStyle;
}

interface MacroRingData {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
}

function clampProgress(consumed: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(consumed / target, 1);
}

function getCalorieColor(consumed: number, target: number, accentColors: { success: string; warning: string; danger: string; primary: string }): string {
  if (target <= 0) return accentColors.primary;
  const ratio = consumed / target;
  if (ratio > 1.1) return accentColors.danger;
  if (ratio > 0.95) return accentColors.success;
  if (ratio > 0.7) return accentColors.primary;
  return accentColors.warning;
}

export function MacroSummary({ consumed, targets, style }: MacroSummaryProps) {
  const { colors, typography, spacing } = useTheme();

  const caloriesRemaining = Math.max(0, targets.calories - consumed.calories);
  const calorieProgress = clampProgress(consumed.calories, targets.calories);
  const calorieColor = getCalorieColor(consumed.calories, targets.calories, colors.accent);

  const macros: MacroRingData[] = [
    {
      label: 'Protein',
      consumed: consumed.protein,
      target: targets.protein,
      unit: 'g',
      color: colors.accent.info,
    },
    {
      label: 'Carbs',
      consumed: consumed.carbs,
      target: targets.carbs,
      unit: 'g',
      color: colors.accent.success,
    },
    {
      label: 'Fat',
      consumed: consumed.fat,
      target: targets.fat,
      unit: 'g',
      color: colors.accent.warning,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          padding: spacing.lg,
          borderRadius: 16,
        },
        style,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${consumed.calories} of ${targets.calories} calories consumed`}
    >
      <View style={styles.calorieSection}>
        <ProgressRing
          progress={calorieProgress}
          size={140}
          strokeWidth={12}
          color={calorieColor}
        >
          <Text style={[typography.stat, { color: colors.text.primary }]}>
            {Math.round(consumed.calories)}
          </Text>
          <Text style={[typography.tiny, { color: colors.text.muted }]}>
            of {targets.calories} cal
          </Text>
        </ProgressRing>
        <Text
          style={[
            typography.caption,
            { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
          ]}
        >
          {caloriesRemaining > 0
            ? `${Math.round(caloriesRemaining)} cal remaining`
            : 'Goal reached!'}
        </Text>
      </View>

      <View style={[styles.macroRow, { marginTop: spacing.xl, gap: spacing.lg }]}>
        {macros.map((macro) => {
          const progress = clampProgress(macro.consumed, macro.target);
          const remaining = Math.max(0, macro.target - macro.consumed);

          return (
            <View key={macro.label} style={styles.macroItem}>
              <ProgressRing
                progress={progress}
                size={72}
                strokeWidth={6}
                color={macro.color}
              >
                <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                  {Math.round(macro.consumed)}
                </Text>
              </ProgressRing>
              <Text
                style={[
                  typography.captionBold,
                  { color: macro.color, marginTop: spacing.sm },
                ]}
              >
                {macro.label}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 2 }]}>
                {Math.round(remaining)}{macro.unit} left
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>
                / {macro.target}{macro.unit}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  calorieSection: {
    alignItems: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
});
