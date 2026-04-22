// =============================================================================
// TRANSFORMR -- AI Insight Card (Module 6)
// Compact card that displays a contextual AI micro-insight. Loads on mount
// via useScreenInsight, shows shimmer while loading, and allows refresh.
// =============================================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { GlowCard } from '@components/ui/GlowCard';
import { useScreenInsight } from '@hooks/useScreenInsight';

interface AIInsightCardProps {
  screenKey: string;
  style?: object;
}

const CATEGORY_ICONS: Record<string, string> = {
  fitness: 'barbell-outline',
  nutrition: 'nutrition-outline',
  sleep: 'moon-outline',
  mood: 'happy-outline',
  goals: 'flag-outline',
  business: 'briefcase-outline',
  finance: 'wallet-outline',
  general: 'sparkles',
};

export const AIInsightCard = React.memo(function AIInsightCard({ screenKey, style }: AIInsightCardProps) {
  const { colors, typography, spacing } = useTheme();
  const { insight, category, isLoading, refresh } = useScreenInsight(screenKey);

  if (isLoading && !insight) {
    return (
      <GlowCard
        accentColor={colors.accent.cyan}
        intensity="subtle"
        style={StyleSheet.flatten([styles.card, style])}
        contentStyle={styles.cardContent}
        padding={10}
      >
        <View style={styles.row}>
          <ActivityIndicator size="small" color={colors.accent.cyan} />
          <Text style={[typography.tiny, { color: colors.text.muted, marginLeft: spacing.sm }]}>
            Loading AI insight...
          </Text>
        </View>
      </GlowCard>
    );
  }

  if (!insight) return null;

  const iconName = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.general;

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={style}>
      <GlowCard
        accentColor={colors.accent.cyan}
        intensity="subtle"
        style={{ borderLeftWidth: 3, borderLeftColor: colors.accent.cyan }}
        padding={10}
      >
        <View style={styles.row}>
          <Ionicons
            name={iconName as keyof typeof Ionicons.glyphMap}
            size={16}
            color={colors.accent.cyan}
          />
          <Text
            style={[
              typography.caption,
              { color: colors.text.secondary, flex: 1, marginLeft: spacing.sm, paddingRight: spacing.xs },
            ]}
            numberOfLines={3}
          >
            {insight}
          </Text>
          <Pressable
            onPress={refresh}
            hitSlop={8}
            accessibilityLabel="Refresh AI insight"
            accessibilityRole="button"
            disabled={isLoading}
            style={{ marginLeft: spacing.xs, flexShrink: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.accent.cyan} />
            ) : (
              <Ionicons name="refresh-outline" size={16} color={colors.text.muted} />
            )}
          </Pressable>
        </View>
      </GlowCard>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {},
  cardContent: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
