// =============================================================================
// TRANSFORMR -- Prediction Alert Card (Module 7)
// Displays an AI prediction or proactive message with severity coloring,
// confidence indicator, action button, and dismiss control.
// =============================================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type RelativePathString } from 'expo-router';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';

interface PredictionAlertProps {
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  confidence?: number;
  actionLabel?: string | null;
  actionRoute?: string | null;
  onDismiss: () => void;
  style?: object;
}

const SEVERITY_ICONS = {
  info: 'information-circle',
  warning: 'alert-circle',
  critical: 'warning',
} as const;

const CATEGORY_ICONS: Record<string, string> = {
  plateau: 'trending-flat',
  overtraining: 'fitness-outline',
  pr_approaching: 'trophy-outline',
  weight_stall: 'scale-outline',
  calorie_deficit_risk: 'flame-outline',
  sleep_debt: 'moon-outline',
  streak_risk: 'flame-outline',
  goal_ahead: 'rocket-outline',
  goal_behind: 'flag-outline',
  dehydration_risk: 'water-outline',
  recovery_needed: 'bed-outline',
  reorder: 'cart-outline',
  general: 'sparkles',
};

export const PredictionAlert = React.memo(function PredictionAlert({
  title,
  body,
  severity,
  category,
  confidence,
  actionLabel,
  actionRoute,
  onDismiss,
  style,
}: PredictionAlertProps) {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const severityColor = severity === 'info'
    ? colors.accent.cyan
    : severity === 'warning'
      ? colors.accent.warning
      : colors.accent.danger;
  const _severityIcon = SEVERITY_ICONS[severity];
  const categoryIcon = CATEGORY_ICONS[category] ?? 'sparkles';

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={style}>
      <Card
        style={StyleSheet.flatten([
          styles.card,
          {
            borderLeftWidth: 4,
            borderLeftColor: severityColor,
          },
        ])}
      >
        <View style={styles.headerRow}>
          <Ionicons
            name={categoryIcon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={severityColor}
          />
          <Text
            style={[
              typography.captionBold,
              { color: colors.text.primary, flex: 1, marginLeft: spacing.sm },
            ]}
          >
            {title}
          </Text>
          {confidence !== undefined && confidence > 0 && (
            <Text style={[typography.tiny, { color: colors.text.muted }]}>
              {Math.round(confidence * 100)}%
            </Text>
          )}
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            accessibilityLabel="Dismiss alert"
            accessibilityRole="button"
            style={{ marginLeft: spacing.sm }}
          >
            <Ionicons name="close" size={18} color={colors.text.muted} />
          </Pressable>
        </View>

        <Text
          style={[
            typography.caption,
            { color: colors.text.secondary, marginTop: spacing.sm },
          ]}
        >
          {body}
        </Text>

        {actionLabel && actionRoute && (
          <Button
            title={actionLabel}
            size="sm"
            variant="outline"
            onPress={() => router.push(actionRoute as RelativePathString)}
            style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
          />
        )}
      </Card>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
