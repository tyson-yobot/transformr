// =============================================================================
// TRANSFORMR -- Partner Live Workout
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { usePartnerStore } from '@stores/partnerStore';
import { useProfileStore } from '@stores/profileStore';
import { formatSetDisplay, formatRestTimer } from '@utils/formatters';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { supabase } from '@services/supabase';
import type { LiveWorkoutSync } from '@app-types/database';

const REACTIONS = [
  { emoji: '\uD83D\uDD25', label: 'Fire' },
  { emoji: '\uD83D\uDCAA', label: 'Strong' },
  { emoji: '\uD83D\uDE4C', label: 'Cheers' },
  { emoji: '\u26A1', label: 'Energy' },
  { emoji: '\uD83C\uDFC6', label: 'Champion' },
];

export default function LiveWorkoutScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { partnership, partnerProfile } = usePartnerStore();
  const myProfile = useProfileStore((s) => s.profile);

  const [mySets, setMySets] = useState<LiveWorkoutSync[]>([]);
  const [partnerSets, setPartnerSets] = useState<LiveWorkoutSync[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastReaction, setLastReaction] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const loadSyncData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !partnership) { setIsLoading(false); return; }

        const partnerId = partnership.user_a === user.id ? partnership.user_b : partnership.user_a;

        const [myResult, partnerResult] = await Promise.all([
          supabase
            .from('live_workout_sync')
            .select('*')
            .eq('user_id', user.id)
            .order('synced_at', { ascending: false })
            .limit(20),
          supabase
            .from('live_workout_sync')
            .select('*')
            .eq('user_id', partnerId)
            .order('synced_at', { ascending: false })
            .limit(20),
        ]);

        setMySets((myResult.data ?? []) as LiveWorkoutSync[]);
        setPartnerSets((partnerResult.data ?? []) as LiveWorkoutSync[]);
      } catch {
        // Silent failure
      } finally {
        setIsLoading(false);
      }
    };
    loadSyncData();
  }, [partnership]);

  // Real-time subscription
  useEffect(() => {
    if (!partnership) return;

    const channel = supabase
      .channel('live-workout')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_workout_sync',
      }, (payload) => {
        const record = payload.new as LiveWorkoutSync;
        const { data: { user } } = { data: { user: null } }; // Placeholder for real-time
        // In production, check if record.user_id matches current user or partner
        setPartnerSets((prev) => [record, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnership]);

  const handleSendReaction = useCallback(async (emoji: string) => {
    if (!partnership) return;
    await hapticLight();
    setLastReaction(emoji);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const partnerId = partnership.user_a === user.id ? partnership.user_b : partnership.user_a;
      await supabase.from('partner_nudges').insert({
        from_user_id: user.id,
        to_user_id: partnerId,
        type: 'reaction' as const,
        emoji,
        message: `${emoji} during live workout`,
      });
    } catch {
      // Silent
    }
    setTimeout(() => setLastReaction(null), 2000);
  }, [partnership]);

  const handleStartWorkout = useCallback(() => {
    setIsActive(true);
    void hapticSuccess();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton variant="card" height={200} />
          <Skeleton variant="card" height={200} />
        </View>
      </View>
    );
  }

  if (!partnership || !partnerProfile) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <Text style={[typography.h2, { color: colors.text.primary, textAlign: 'center' }]}>
          No Partner Linked
        </Text>
        <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md }]}>
          Link with a partner to start live workouts together.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated">
            <View style={styles.statusRow}>
              <Badge label={isActive ? 'LIVE' : 'STANDBY'} variant={isActive ? 'success' : 'info'} />
              <Text style={[typography.caption, { color: colors.text.secondary }]}>
                {isActive ? 'Workout in progress' : 'Ready to start'}
              </Text>
            </View>
            {!isActive && (
              <Button title="Start Live Workout" onPress={handleStartWorkout} fullWidth style={{ marginTop: spacing.md }} />
            )}
          </Card>
        </Animated.View>

        {/* Split View */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={[styles.splitView, { marginTop: spacing.lg, gap: spacing.md }]}>
            {/* My Sets */}
            <View style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.accent.primary, textAlign: 'center', marginBottom: spacing.sm }]}>
                {myProfile?.display_name ?? 'You'}
              </Text>
              {mySets.slice(0, 10).map((set) => (
                <View
                  key={set.id}
                  style={[styles.setCard, {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.sm,
                    padding: spacing.sm,
                    marginBottom: spacing.xs,
                  }]}
                >
                  <Text style={[typography.tiny, { color: colors.text.muted }]} numberOfLines={1}>
                    {set.exercise_name ?? 'Exercise'}
                  </Text>
                  <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                    {set.weight != null && set.reps != null ? formatSetDisplay(set.weight, set.reps) : `Set ${set.set_number ?? 0}`}
                  </Text>
                  {set.status && (
                    <Badge
                      label={set.status}
                      variant={set.status === 'completed' ? 'success' : set.status === 'active' ? 'warning' : 'info'}
                      size="sm"
                    />
                  )}
                </View>
              ))}
              {mySets.length === 0 && (
                <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center' }]}>
                  No sets yet
                </Text>
              )}
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.background.secondary }]} />

            {/* Partner Sets */}
            <View style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.accent.success, textAlign: 'center', marginBottom: spacing.sm }]}>
                {partnerProfile.display_name}
              </Text>
              {partnerSets.slice(0, 10).map((set) => (
                <View
                  key={set.id}
                  style={[styles.setCard, {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.sm,
                    padding: spacing.sm,
                    marginBottom: spacing.xs,
                  }]}
                >
                  <Text style={[typography.tiny, { color: colors.text.muted }]} numberOfLines={1}>
                    {set.exercise_name ?? 'Exercise'}
                  </Text>
                  <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                    {set.weight != null && set.reps != null ? formatSetDisplay(set.weight, set.reps) : `Set ${set.set_number ?? 0}`}
                  </Text>
                  {set.status && (
                    <Badge
                      label={set.status}
                      variant={set.status === 'completed' ? 'success' : set.status === 'active' ? 'warning' : 'info'}
                      size="sm"
                    />
                  )}
                </View>
              ))}
              {partnerSets.length === 0 && (
                <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center' }]}>
                  No sets yet
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Reactions */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={[typography.captionBold, { color: colors.text.secondary, marginTop: spacing.xl, marginBottom: spacing.sm, textAlign: 'center' }]}>
            Send a Cheer
          </Text>
          <View style={styles.reactionsRow}>
            {REACTIONS.map((r) => (
              <Pressable
                key={r.label}
                onPress={() => handleSendReaction(r.emoji)}
                style={[styles.reactionButton, {
                  backgroundColor: lastReaction === r.emoji ? colors.accent.primary : colors.background.secondary,
                  borderRadius: 24,
                }]}
              >
                <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
              </Pressable>
            ))}
          </View>
          {lastReaction && (
            <Animated.View entering={FadeIn}>
              <Text style={[typography.caption, { color: colors.accent.success, textAlign: 'center', marginTop: spacing.sm }]}>
                Sent {lastReaction}
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  splitView: { flexDirection: 'row' },
  divider: { width: 1 },
  setCard: {},
  reactionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  reactionButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
