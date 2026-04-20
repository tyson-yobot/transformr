// =============================================================================
// TRANSFORMR -- Community Leaderboard
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ViewStyle,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Skeleton } from '@components/ui/Skeleton';
import { supabase } from '@services/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time';
type LeaderboardCategory = 'consistency' | 'volume' | 'streaks' | 'prs' | 'overall';
type TrendDirection = 'up' | 'down' | 'same';

interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  rank: number;
  previousRank: number | null;
}

interface CommunityLeaderboardProps {
  challengeId?: string;
  category?: LeaderboardCategory;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'all_time', label: 'All Time' },
];

const CATEGORIES: { key: LeaderboardCategory; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'consistency', label: 'Consistency' },
  { key: 'volume', label: 'Volume' },
  { key: 'streaks', label: 'Streaks' },
  { key: 'prs', label: 'PRs' },
];

const MEDAL_COLORS: Record<number, string> = {
  1: '#EAB308', // gold
  2: '#C0C0C0', // silver
  3: '#CD7F32', // bronze
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${(parts[0] ?? '')[0] ?? ''}${(parts[1] ?? '')[0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getTrend(currentRank: number, previousRank: number | null): TrendDirection {
  if (previousRank === null) return 'same';
  if (currentRank < previousRank) return 'up';
  if (currentRank > previousRank) return 'down';
  return 'same';
}

function getTrendIcon(trend: TrendDirection): keyof typeof Ionicons.glyphMap {
  switch (trend) {
    case 'up':
      return 'arrow-up';
    case 'down':
      return 'arrow-down';
    case 'same':
      return 'remove';
  }
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function LeaderboardSkeleton({ compact }: { compact: boolean }) {
  const { spacing } = useTheme();
  const count = compact ? 5 : 10;

  return (
    <View style={{ gap: spacing.sm }}>
      {/* Podium skeleton */}
      {!compact && (
        <View style={[styles.podiumContainer, { marginBottom: spacing.lg }]}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.podiumSlot}>
              <Skeleton variant="circle" height={i === 0 ? 64 : 52} />
              <Skeleton variant="text" width={60} height={14} style={{ marginTop: spacing.xs }} />
              <Skeleton variant="text" width={40} height={12} style={{ marginTop: 2 }} />
            </View>
          ))}
        </View>
      )}
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.skeletonRow, { gap: spacing.md }]}>
          <Skeleton variant="text" width={24} height={16} />
          <Skeleton variant="circle" height={40} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Skeleton variant="text" width="60%" height={14} />
            <Skeleton variant="text" width="30%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityLeaderboard({
  challengeId,
  category: initialCategory = 'overall',
  compact = false,
}: CommunityLeaderboardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [category, setCategory] = useState<LeaderboardCategory>(initialCategory);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ----------------------------------
  // Fetch leaderboard data
  // ----------------------------------

  const fetchLeaderboard = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    if (challengeId) {
      // Challenge-specific leaderboard from challenge_participants
      const { data } = await supabase
        .from('challenge_participants')
        .select('id, user_id, current_progress, rank')
        .eq('challenge_id', challengeId)
        .order('rank', { ascending: true });

      if (data) {
        // Fetch display names for participant user IDs
        const userIds = data.map((p) => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        const profileMap = new Map(
          (profiles ?? []).map((p) => [p.id, p.display_name as string]),
        );

        setEntries(
          data.map((p) => ({
            id: p.id,
            userId: p.user_id,
            displayName: profileMap.get(p.user_id) ?? 'User',
            score: p.current_progress ?? 0,
            rank: p.rank ?? 0,
            previousRank: null,
          })),
        );
      }
    } else {
      // Community leaderboard from community_leaderboards
      const { data } = await supabase
        .from('community_leaderboards')
        .select('id, user_id, score, rank')
        .eq('category', category)
        .eq('period', period)
        .order('rank', { ascending: true })
        .limit(compact ? 10 : 50);

      if (data) {
        const userIds = data.map((e) => e.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        const profileMap = new Map(
          (profiles ?? []).map((p) => [p.id, p.display_name as string]),
        );

        setEntries(
          data.map((e) => ({
            id: e.id,
            userId: e.user_id,
            displayName: profileMap.get(e.user_id) ?? 'User',
            score: e.score ?? 0,
            rank: e.rank ?? 0,
            previousRank: null,
          })),
        );
      }
    }
  }, [challengeId, category, period, compact]);

  useEffect(() => {
    setIsLoading(true);
    fetchLeaderboard().finally(() => setIsLoading(false));
  }, [fetchLeaderboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  }, [fetchLeaderboard]);

  // ----------------------------------
  // Derived data
  // ----------------------------------

  const topThree = useMemo(() => entries.slice(0, 3), [entries]);
  const remaining = useMemo(() => (compact ? entries : entries.slice(3)), [entries, compact]);

  // ----------------------------------
  // Renderers
  // ----------------------------------

  const renderPeriodTabs = () => (
    <View style={[styles.tabRow, { marginBottom: spacing.md }]}>
      {PERIODS.map((p) => {
        const isActive = period === p.key;
        return (
          <Pressable
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? colors.accent.primary : colors.background.tertiary,
                borderRadius: borderRadius.full,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                marginRight: spacing.sm,
              },
            ]}
            accessibilityLabel={`Filter by ${p.label}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                typography.captionBold,
                { color: isActive ? colors.text.primary : colors.text.secondary },
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderCategoryChips = () => {
    if (challengeId) return null;
    return (
      <View style={[styles.chipRow, { marginBottom: spacing.lg }]}>
        {CATEGORIES.map((c) => {
          const isActive = category === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.accent.primaryDim : colors.background.secondary,
                  borderWidth: 1,
                  borderColor: isActive ? colors.accent.primary : colors.border.default,
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs + 2,
                  marginRight: spacing.sm,
                  marginBottom: spacing.xs,
                },
              ]}
              accessibilityLabel={`Category: ${c.label}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: isActive ? colors.accent.primary : colors.text.secondary,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderPodium = () => {
    if (compact || topThree.length === 0) return null;

    // Reorder for podium display: 2nd, 1st, 3rd
    const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);
    const heights = [90, 120, 70];
    const avatarSizes = [48, 64, 48];

    return (
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.podiumContainer, { marginBottom: spacing.xl }]}>
        {podiumOrder.map((entry, index) => {
          if (!entry) return null;
          const medalColor = MEDAL_COLORS[entry.rank] ?? colors.text.muted;
          const podiumHeight = heights[index];
          const avatarSize = avatarSizes[index] ?? 48;
          const isCurrentUser = entry.userId === currentUserId;

          return (
            <View key={entry.id} style={styles.podiumSlot}>
              {/* Avatar */}
              <View
                style={[
                  styles.avatar,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    backgroundColor: colors.background.tertiary,
                    borderWidth: isCurrentUser ? 2 : 0,
                    borderColor: isCurrentUser ? colors.accent.primary : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    typography.bodyBold,
                    { color: colors.text.primary, fontSize: avatarSize * 0.32 },
                  ]}
                >
                  {getInitials(entry.displayName)}
                </Text>
              </View>

              {/* Name */}
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.text.primary, marginTop: spacing.xs, textAlign: 'center' },
                ]}
                numberOfLines={1}
              >
                {entry.displayName}
              </Text>

              {/* Score */}
              <Text
                style={[
                  typography.tiny,
                  { color: colors.text.secondary, marginTop: 2 },
                ]}
              >
                {entry.score.toLocaleString()}
              </Text>

              {/* Podium bar */}
              <View
                style={[
                  styles.podiumBar,
                  {
                    height: podiumHeight,
                    backgroundColor: `${medalColor}30`,
                    borderTopLeftRadius: borderRadius.sm,
                    borderTopRightRadius: borderRadius.sm,
                    marginTop: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.h2, { color: medalColor }]}>
                  {entry.rank}
                </Text>
              </View>
            </View>
          );
        })}
      </Animated.View>
    );
  };

  const renderLeaderboardRow = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = item.userId === currentUserId;
    const trend = getTrend(item.rank, item.previousRank);
    const trendIcon = getTrendIcon(trend);
    const trendColor = trend === 'up'
      ? colors.accent.success
      : trend === 'down'
        ? colors.accent.danger
        : colors.text.muted;

    const rowStyle: ViewStyle = isCurrentUser
      ? {
          borderWidth: 1.5,
          borderColor: colors.accent.primary,
          backgroundColor: colors.accent.primaryDim,
        }
      : {
          borderWidth: 1,
          borderColor: colors.border.subtle,
          backgroundColor: colors.background.secondary,
        };

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
        <View
          style={[
            styles.row,
            rowStyle,
            {
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.sm,
            },
          ]}
        >
          {/* Rank */}
          <View style={[styles.rankContainer, { width: 32 }]}>
            <Text
              style={[
                typography.bodyBold,
                {
                  color: MEDAL_COLORS[item.rank] ?? colors.text.secondary,
                  textAlign: 'center',
                },
              ]}
            >
              {item.rank}
            </Text>
          </View>

          {/* Avatar */}
          <View
            style={[
              styles.avatar,
              {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.background.tertiary,
                marginLeft: spacing.md,
              },
            ]}
          >
            <Text style={[typography.captionBold, { color: colors.text.primary }]}>
              {getInitials(item.displayName)}
            </Text>
          </View>

          {/* Name + score */}
          <View style={[styles.nameContainer, { marginLeft: spacing.md }]}>
            <Text
              style={[
                typography.bodyBold,
                { color: isCurrentUser ? colors.accent.primary : colors.text.primary },
              ]}
              numberOfLines={1}
            >
              {item.displayName}
              {isCurrentUser ? ' (You)' : ''}
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              {item.score.toLocaleString()} pts
            </Text>
          </View>

          {/* Trend */}
          <Ionicons name={trendIcon} size={16} color={trendColor} />
        </View>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, { paddingVertical: spacing.xxxl }]}>
      <Ionicons name="trophy-outline" size={48} color={colors.text.muted} />
      <Text
        style={[
          typography.body,
          { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md },
        ]}
      >
        No rankings yet. Be the first to compete!
      </Text>
    </View>
  );

  // ----------------------------------
  // Main render
  // ----------------------------------

  if (isLoading) {
    return (
      <View>
        {renderPeriodTabs()}
        {renderCategoryChips()}
        <LeaderboardSkeleton compact={compact} />
      </View>
    );
  }

  return (
    <View>
      {renderPeriodTabs()}
      {renderCategoryChips()}

      {entries.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          {renderPodium()}
          <FlatList
            data={remaining}
            keyExtractor={(item) => item.id}
            renderItem={renderLeaderboardRow}
            scrollEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent.primary}
              />
            }
          />
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {},
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {},
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  podiumSlot: {
    flex: 1,
    alignItems: 'center',
  },
  podiumBar: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {},
  nameContainer: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
