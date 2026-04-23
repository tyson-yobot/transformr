// =============================================================================
// TRANSFORMR -- Community Discovery Screen
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import { CommunityLeaderboard } from '@components/community/CommunityLeaderboard';
import { supabase } from '@services/supabase';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommunityChallenge {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  challenge_type: string;
  metric: string | null;
  target_value: number | null;
  start_date: string;
  end_date: string;
  max_participants: number | null;
  is_public: boolean;
  created_at: string;
  participant_count: number;
  is_joined: boolean;
  current_progress: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getChallengeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    consistency: 'Consistency',
    volume: 'Volume',
    streak: 'Streak',
    competition: 'Competition',
    milestone: 'Milestone',
  };
  return labels[type] ?? type;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommunityScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.communityScreen} />,
    });
  }, [navigation]);

  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // ----------------------------------
  // Fetch challenges
  // ----------------------------------

  const fetchChallenges = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch public community challenges
    const { data: challengeData } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (!challengeData) {
      setChallenges([]);
      return;
    }

    // Fetch participant counts and user's participation status
    const challengeIds = challengeData.map((c) => String((c as Record<string, unknown>).id));

    const { data: participantsData } = await supabase
      .from('challenge_participants')
      .select('challenge_id, user_id, current_progress')
      .in('challenge_id', challengeIds);

    const participantsByChallenge = new Map<string, { count: number; userProgress: number | null; isJoined: boolean }>();

    for (const cId of challengeIds) {
      const participants = (participantsData ?? []).filter((p) => (p as Record<string, unknown>).challenge_id === cId);
      const userParticipant = participants.find((p) => (p as Record<string, unknown>).user_id === user.id);
      participantsByChallenge.set(cId, {
        count: participants.length,
        userProgress: (userParticipant as Record<string, unknown> | undefined)?.current_progress as number | null ?? null,
        isJoined: !!userParticipant,
      });
    }

    setChallenges(
      challengeData.map((c) => {
        const row = c as Record<string, unknown>;
        const info = participantsByChallenge.get(row.id as string);
        return {
          ...(row as Omit<CommunityChallenge, 'participant_count' | 'is_joined' | 'current_progress'>),
          participant_count: info?.count ?? 0,
          is_joined: info?.isJoined ?? false,
          current_progress: info?.userProgress ?? null,
        };
      }),
    );
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchChallenges().finally(() => setIsLoading(false));
  }, [fetchChallenges]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChallenges();
    setRefreshing(false);
  }, [fetchChallenges]);

  // ----------------------------------
  // Join challenge
  // ----------------------------------

  const handleJoinChallenge = useCallback(async (challengeId: string) => {
    await hapticLight();
    setJoiningId(challengeId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setJoiningId(null);
      return;
    }

    const challenge = challenges.find((c) => c.id === challengeId);
    if (challenge?.max_participants && challenge.participant_count >= challenge.max_participants) {
      Alert.alert('Challenge Full', 'This challenge has reached its maximum number of participants.');
      setJoiningId(null);
      return;
    }

    const { error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        current_progress: 0,
      });

    if (error) {
      Alert.alert('Error', 'Could not join the challenge. Please try again.');
      setJoiningId(null);
      return;
    }

    await hapticSuccess();

    // Update local state
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? { ...c, is_joined: true, participant_count: c.participant_count + 1, current_progress: 0 }
          : c,
      ),
    );
    setJoiningId(null);
  }, [challenges]);

  // ----------------------------------
  // Render
  // ----------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background.primary }]} edges={['bottom']}>
        <ListSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background.primary }]} edges={['bottom']}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* ----------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Text style={[typography.h1, { color: colors.text.primary }]}>
            Community
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.text.secondary, marginTop: spacing.xs, marginBottom: spacing.xl },
            ]}
          >
            Compete. Connect. Grow.
          </Text>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Section 1: Your Rankings                                           */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
            <Ionicons name="podium-outline" size={20} color={colors.accent.gold} />
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary, marginLeft: spacing.sm },
              ]}
            >
              Your Rankings
            </Text>
          </View>
          <Card style={{ marginBottom: spacing.xl }}>
            <CommunityLeaderboard category="overall" compact />
          </Card>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Section 2: Public Challenges                                       */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
            <Ionicons name="people-outline" size={20} color={colors.accent.cyan} />
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary, marginLeft: spacing.sm },
              ]}
            >
              Public Challenges
            </Text>
          </View>
        </Animated.View>

        {challenges.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Card style={{ marginBottom: spacing.xl }}>
              <View style={styles.emptyContainer}>
                <Ionicons name="flag-outline" size={40} color={colors.text.muted} />
                <Text
                  style={[
                    typography.body,
                    { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md },
                  ]}
                >
                  No public challenges available right now. Check back soon!
                </Text>
              </View>
            </Card>
          </Animated.View>
        ) : (
          challenges.map((challenge, index) => {
            const daysRemaining = getDaysRemaining(challenge.end_date);
            const isExpired = daysRemaining === 0;
            const progressPercent =
              challenge.target_value && challenge.current_progress !== null
                ? Math.min(100, Math.round((challenge.current_progress / challenge.target_value) * 100))
                : null;

            return (
              <Animated.View
                key={challenge.id}
                entering={FadeInDown.delay(250 + index * 60).duration(400)}
              >
                <Card style={{ marginBottom: spacing.md }}>
                  {/* Title row */}
                  <View style={styles.challengeHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                        {challenge.title}
                      </Text>
                      {challenge.description ? (
                        <Text
                          style={[
                            typography.caption,
                            { color: colors.text.secondary, marginTop: spacing.xs },
                          ]}
                          numberOfLines={2}
                        >
                          {challenge.description}
                        </Text>
                      ) : null}
                    </View>
                    <Badge
                      label={getChallengeTypeLabel(challenge.challenge_type)}
                      variant="default"
                      size="sm"
                    />
                  </View>

                  {/* Meta row */}
                  <View style={[styles.metaRow, { marginTop: spacing.md }]}>
                    <View style={styles.metaItem}>
                      <Ionicons name="people" size={14} color={colors.text.muted} />
                      <Text style={[typography.tiny, { color: colors.text.secondary, marginLeft: spacing.xs }]}>
                        {challenge.participant_count}
                        {challenge.max_participants ? `/${challenge.max_participants}` : ''} joined
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color={colors.text.muted} />
                      <Text
                        style={[
                          typography.tiny,
                          {
                            color: isExpired ? colors.accent.danger : colors.text.secondary,
                            marginLeft: spacing.xs,
                          },
                        ]}
                      >
                        {isExpired ? 'Ended' : `${daysRemaining}d remaining`}
                      </Text>
                    </View>
                    {challenge.target_value ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="flag" size={14} color={colors.text.muted} />
                        <Text style={[typography.tiny, { color: colors.text.secondary, marginLeft: spacing.xs }]}>
                          Target: {challenge.target_value} {challenge.metric ?? ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Action row */}
                  <View style={[styles.actionRow, { marginTop: spacing.md }]}>
                    {challenge.is_joined ? (
                      <>
                        {/* Progress bar */}
                        <View style={[styles.progressBarContainer, { flex: 1, marginRight: spacing.md }]}>
                          <View
                            style={[
                              styles.progressBarTrack,
                              {
                                backgroundColor: colors.background.tertiary,
                                borderRadius: borderRadius.full,
                                height: 8,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  backgroundColor: colors.accent.success,
                                  borderRadius: borderRadius.full,
                                  width: `${progressPercent ?? 0}%`,
                                  height: 8,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[typography.tiny, { color: colors.accent.success, marginTop: spacing.xs }]}>
                            {progressPercent !== null ? `${progressPercent}%` : 'In progress'}
                          </Text>
                        </View>
                        <Badge label="Joined" variant="success" size="sm" />
                      </>
                    ) : (
                      <Button
                        title={joiningId === challenge.id ? 'Joining...' : 'Join Challenge'}
                        onPress={() => handleJoinChallenge(challenge.id)}
                        variant="primary"
                        size="sm"
                        loading={joiningId === challenge.id}
                        disabled={isExpired || joiningId === challenge.id}
                        fullWidth
                        accessibilityLabel={`Join challenge: ${challenge.title}`}
                      />
                    )}
                  </View>
                </Card>
              </Animated.View>
            );
          })
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Section 3: Leaderboards                                            */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <View style={[styles.sectionHeader, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
            <Ionicons name="trophy-outline" size={20} color={colors.accent.primary} />
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary, marginLeft: spacing.sm },
              ]}
            >
              Leaderboards
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).duration(400)}>
          <CommunityLeaderboard />
        </Animated.View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {},
  progressBarTrack: {
    overflow: 'hidden',
  },
  progressBarFill: {},
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
});
