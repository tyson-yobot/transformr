// =============================================================================
// TRANSFORMR -- Achievements Screen
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { ProgressBar } from '@components/ui/ProgressBar';
import { supabase } from '@services/supabase';
import { hapticLight, hapticAchievement } from '@utils/haptics';
import { formatPercentage } from '@utils/formatters';
import type { Achievement, UserAchievement } from '@app-types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Tier = 'all' | 'bronze' | 'silver' | 'gold' | 'diamond';

const TIER_FILTERS: ReadonlyArray<{ key: Tier; label: string; color: string }> = [
  { key: 'all', label: 'All', color: '#94A3B8' },
  { key: 'bronze', label: 'Bronze', color: '#CD7F32' },
  { key: 'silver', label: 'Silver', color: '#C0C0C0' },
  { key: 'gold', label: 'Gold', color: '#EAB308' },
  { key: 'diamond', label: 'Diamond', color: '#B9F2FF' },
];

const CATEGORY_ICONS: Record<string, string> = {
  fitness: '🏋️',
  nutrition: '🍎',
  body: '💪',
  business: '💼',
  finance: '💰',
  consistency: '🔥',
  partner: '👫',
  community: '🌐',
  mindset: '🧠',
  learning: '📚',
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function AchievementsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<UserAchievement[]>([]);
  const [selectedTier, setSelectedTier] = useState<Tier>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [achRes, earnedRes] = await Promise.all([
          supabase.from('achievements').select('*').order('category').order('tier'),
          supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', user.id),
        ]);

        if (achRes.data) setAchievements(achRes.data as Achievement[]);
        if (earnedRes.data) setEarned(earnedRes.data as UserAchievement[]);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  // Earned IDs set
  const earnedIds = useMemo(
    () => new Set(earned.map((e) => e.achievement_id)),
    [earned],
  );

  // Filtered achievements
  const filtered = useMemo(() => {
    let list = achievements;
    if (selectedTier !== 'all') {
      list = list.filter((a) => a.tier === selectedTier);
    }
    return list;
  }, [achievements, selectedTier]);

  // Stats
  const totalCount = achievements.length;
  const earnedCount = earned.length;
  const completionRate = totalCount > 0 ? earnedCount / totalCount : 0;

  // Recent unlocks (last 5)
  const recentUnlocks = useMemo(() => {
    const sorted = [...earned].sort((a, b) => {
      const dateA = a.earned_at ?? '';
      const dateB = b.earned_at ?? '';
      return dateB.localeCompare(dateA);
    });
    return sorted.slice(0, 5).map((ua) => {
      const ach = achievements.find((a) => a.id === ua.achievement_id);
      return { ...ua, achievement: ach };
    });
  }, [earned, achievements]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    for (const ach of filtered) {
      const cat = ach.category ?? 'other';
      const list = map.get(cat) ?? [];
      list.push(ach);
      map.set(cat, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const tierColor = (tier: string | undefined): string => {
    switch (tier) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#EAB308';
      case 'diamond': return '#B9F2FF';
      default: return colors.text.muted;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: insets.bottom + 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[typography.stat, { color: colors.accent.primary }]}>
                {earnedCount}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>
                Earned
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[typography.stat, { color: colors.text.secondary }]}>
                {totalCount}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>
                Total
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[typography.stat, { color: colors.accent.success }]}
              >
                {formatPercentage(completionRate * 100)}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>
                Complete
              </Text>
            </View>
          </View>
          <ProgressBar
            progress={completionRate}
            color={colors.accent.primary}
            height={6}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      </Animated.View>

      {/* Recent Unlocks */}
      {recentUnlocks.length > 0 && (
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Text
            style={[
              typography.h3,
              {
                color: colors.text.primary,
                marginBottom: spacing.md,
              },
            ]}
          >
            Recent Unlocks
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
            style={{ marginBottom: spacing.lg }}
          >
            {recentUnlocks.map((unlock) => (
              <View
                key={unlock.id}
                style={[
                  styles.recentBadge,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: tierColor(unlock.achievement?.tier),
                  },
                ]}
              >
                <Text style={{ fontSize: 28 }}>
                  {unlock.achievement?.icon ?? '🏆'}
                </Text>
                <Text
                  style={[
                    typography.tiny,
                    {
                      color: colors.text.primary,
                      marginTop: spacing.xs,
                      textAlign: 'center',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {unlock.achievement?.title ?? 'Achievement'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Tier Filter */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.lg }}
        >
          {TIER_FILTERS.map((filter) => {
            const isActive = selectedTier === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => {
                  void hapticLight();
                  setSelectedTier(filter.key);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive
                      ? filter.color
                      : colors.background.secondary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.captionBold,
                    {
                      color: isActive
                        ? (filter.key === 'diamond' ? '#0F172A' : '#FFFFFF')
                        : colors.text.secondary,
                    },
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Grouped Achievements */}
      {grouped.map(([category, achs], groupIndex) => (
        <Animated.View
          key={category}
          entering={FadeInDown.delay(150 + groupIndex * 50).duration(400)}
        >
          <View style={[styles.categoryHeader, { marginBottom: spacing.md }]}>
            <Text style={{ fontSize: 18, marginRight: spacing.sm }}>
              {CATEGORY_ICONS[category] ?? '🏆'}
            </Text>
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary, textTransform: 'capitalize' },
              ]}
            >
              {category}
            </Text>
          </View>

          <View style={[styles.achievementGrid, { gap: spacing.sm, marginBottom: spacing.xl }]}>
            {achs.map((ach) => {
              const isEarned = earnedIds.has(ach.id);
              const isSecret = ach.secret && !isEarned;

              return (
                <Pressable
                  key={ach.id}
                  onPress={() => {
                    if (isEarned) void hapticAchievement();
                  }}
                  style={[
                    styles.achievementCard,
                    {
                      backgroundColor: isEarned
                        ? colors.background.secondary
                        : colors.background.tertiary,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      borderWidth: isEarned ? 1 : 0,
                      borderColor: tierColor(ach.tier),
                      opacity: isEarned ? 1 : 0.5,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>
                    {isSecret ? '❓' : (ach.icon ?? '🏆')}
                  </Text>
                  <Text
                    style={[
                      typography.captionBold,
                      {
                        color: isEarned
                          ? colors.text.primary
                          : colors.text.muted,
                        textAlign: 'center',
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {isSecret ? 'Secret' : ach.title}
                  </Text>
                  {!isSecret && ach.tier && (
                    <View
                      style={[
                        styles.tierDot,
                        {
                          backgroundColor: tierColor(ach.tier),
                          marginTop: spacing.xs,
                        },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      ))}

      {/* Empty state */}
      {filtered.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🏆</Text>
          <Text
            style={[
              typography.body,
              { color: colors.text.secondary, textAlign: 'center' },
            ]}
          >
            No achievements found for this tier.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  recentBadge: {
    width: 90,
    alignItems: 'center',
  },
  filterChip: {
    alignItems: 'center',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  achievementCard: {
    width: '30%',
    alignItems: 'center',
    flexGrow: 1,
    maxWidth: '33%',
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
