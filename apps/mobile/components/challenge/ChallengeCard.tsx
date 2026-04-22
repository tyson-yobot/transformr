import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import type { ChallengeDefinition, ChallengeDifficulty, ChallengeCategory } from '@app-types/database';

interface ChallengeCardProps {
  challenge: ChallengeDefinition;
  onPress: () => void;
  isActive?: boolean;
}

const difficultyLabels: Record<ChallengeDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  extreme: 'Extreme',
};

const categoryLabels: Record<ChallengeCategory, string> = {
  mental_toughness: 'Mental Toughness',
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  running: 'Running',
  strength: 'Strength',
  lifestyle: 'Lifestyle',
  custom: 'Custom',
};

const categoryIcons: Record<ChallengeCategory, string> = {
  mental_toughness: '\uD83E\uDDE0',
  fitness: '\uD83D\uDCAA',
  nutrition: '\uD83E\uDD57',
  running: '\uD83C\uDFC3',
  strength: '\uD83C\uDFCB\uFE0F',
  lifestyle: '\u2728',
  custom: '\uD83C\uDFAF',
};

export const ChallengeCard = React.memo(function ChallengeCard({ challenge, onPress, isActive = false }: ChallengeCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const difficulty = challenge.difficulty ?? 'intermediate';
  const category = challenge.category ?? 'custom';
  const diffColor = difficulty === 'beginner'
    ? colors.accent.success
    : difficulty === 'intermediate'
      ? colors.accent.warning
      : difficulty === 'advanced'
        ? colors.accent.fire
        : colors.accent.danger;
  const diffLabel = difficultyLabels[difficulty];
  const catLabel = categoryLabels[category];
  const catIcon = categoryIcons[category];

  const accentColor = isActive ? colors.accent.primary : colors.border.default;
  const glowShadow = isActive
    ? {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
      }
    : {};

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()}>
      <Card
        variant="elevated"
        onPress={onPress}
        style={{
          borderWidth: isActive ? 2 : 1,
          borderColor: accentColor,
          ...glowShadow,
        }}
      >
        {/* Active overlay */}
        {isActive && (
          <View
            style={[
              styles.activeOverlay,
              {
                backgroundColor: `${colors.accent.primary}15`,
                borderRadius: borderRadius.lg,
              },
            ]}
            pointerEvents="none"
          />
        )}

        <View style={styles.topRow}>
          {/* Icon */}
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: `${colors.accent.primary}20`,
                borderRadius: borderRadius.md,
                marginRight: spacing.md,
              },
            ]}
          >
            <Text style={{ fontSize: 28 }}>
              {challenge.icon ?? catIcon}
            </Text>
          </View>

          {/* Title + duration */}
          <View style={styles.textWrap}>
            <Text
              style={[typography.bodyBold, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {challenge.name}
            </Text>
            <Text
              style={[
                typography.caption,
                { color: colors.text.secondary, marginTop: spacing.xs },
              ]}
            >
              {challenge.duration_days} days
            </Text>
          </View>

          {/* In Progress badge */}
          {isActive && (
            <View
              style={[
                styles.inProgressBadge,
                {
                  backgroundColor: `${colors.accent.primary}25`,
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Text
                style={[
                  typography.tiny,
                  { color: colors.accent.primary, fontWeight: '700' },
                ]}
              >
                IN PROGRESS
              </Text>
            </View>
          )}
        </View>

        {/* Bottom row: difficulty + category */}
        <View style={[styles.bottomRow, { marginTop: spacing.md }]}>
          <View style={styles.tagsRow}>
            {/* Difficulty badge */}
            <View
              style={[
                styles.diffBadge,
                {
                  backgroundColor: `${diffColor}20`,
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  marginRight: spacing.sm,
                },
              ]}
            >
              <Text style={[typography.tiny, { color: diffColor, fontWeight: '600' }]}>
                {diffLabel}
              </Text>
            </View>

            {/* Category tag */}
            <Badge label={catLabel} variant="default" size="sm" />
          </View>
        </View>
      </Card>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  activeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  inProgressBadge: {
    alignSelf: 'flex-start',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
