// =============================================================================
// TRANSFORMR -- Partner Challenges
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Input } from '@components/ui/Input';
import { Chip } from '@components/ui/Chip';
import { Modal } from '@components/ui/Modal';
import { Skeleton } from '@components/ui/Skeleton';
import { usePartnerStore } from '@stores/partnerStore';
import { useProfileStore } from '@stores/profileStore';
import { formatDate } from '@utils/formatters';
import { hapticSuccess } from '@utils/haptics';
import { supabase } from '@services/supabase';
import type { PartnerChallenge } from '@app-types/database';

type ChallengeType = NonNullable<PartnerChallenge['challenge_type']>;

const CHALLENGE_TYPES: { key: ChallengeType; label: string }[] = [
  { key: 'both_complete', label: 'Both Complete' },
  { key: 'competition', label: 'Competition' },
  { key: 'streak', label: 'Streak' },
  { key: 'custom', label: 'Custom' },
];

export default function PartnerChallengesScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { partnership, partnerProfile } = usePartnerStore();
  const myProfile = useProfileStore((s) => s.profile);

  const [challenges, setChallenges] = useState<PartnerChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<ChallengeType>('both_complete');
  const [formTarget, setFormTarget] = useState('');
  const [formDuration, setFormDuration] = useState('7');

  const fetchChallenges = useCallback(async () => {
    if (!partnership) return;
    try {
      const { data, error } = await supabase
        .from('partner_challenges')
        .select('*')
        .eq('partnership_id', partnership.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setChallenges((data ?? []) as PartnerChallenge[]);
    } catch {
      // Silent
    } finally {
      setIsLoading(false);
    }
  }, [partnership]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChallenges();
    setRefreshing(false);
  }, [fetchChallenges]);

  const handleCreate = useCallback(async () => {
    if (!formTitle.trim() || !partnership) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = new Date().toISOString().substring(0, 10);
      const endDate = new Date(Date.now() + parseInt(formDuration, 10) * 86400000).toISOString().substring(0, 10);

      const { data, error } = await supabase
        .from('partner_challenges')
        .insert({
          partnership_id: partnership.id,
          created_by: user.id,
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          challenge_type: formType,
          target_value: formTarget ? parseFloat(formTarget) : undefined,
          duration_days: parseInt(formDuration, 10),
          start_date: startDate,
          end_date: endDate,
          status: 'active' as const,
          user_a_progress: 0,
          user_b_progress: 0,
        })
        .select()
        .single();
      if (error) throw error;

      setChallenges((prev) => [data as PartnerChallenge, ...prev]);
      await hapticSuccess();
      setShowCreateModal(false);
      setFormTitle('');
      setFormDescription('');
      setFormTarget('');
    } catch {
      // Silent
    }
  }, [formTitle, formDescription, formType, formTarget, formDuration, partnership]);

  const { active, completed } = useMemo(() => {
    const a: PartnerChallenge[] = [];
    const c: PartnerChallenge[] = [];
    for (const ch of challenges) {
      if (ch.status === 'active') a.push(ch);
      else c.push(ch);
    }
    return { active: a, completed: c };
  }, [challenges]);

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={120} />
        </View>
      </View>
    );
  }

  if (!partnership) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <Text style={[typography.h2, { color: colors.text.primary, textAlign: 'center' }]}>No Partner Linked</Text>
        <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md }]}>
          Link with a partner to create challenges.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />
        }
      >
        <Button
          title="Create Challenge"
          onPress={() => setShowCreateModal(true)}
          fullWidth
          style={{ marginBottom: spacing.lg }}
        />

        {/* Active Challenges */}
        <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
          Active Challenges
        </Text>

        {active.map((challenge, index) => {
          const progress = challenge.target_value
            ? Math.min(((challenge.user_a_progress ?? 0) + (challenge.user_b_progress ?? 0)) / (challenge.target_value * 2), 1)
            : 0;

          return (
            <Animated.View key={challenge.id} entering={FadeInDown.delay(100 + index * 60)}>
              <Card style={{ marginBottom: spacing.md }}>
                <View style={styles.challengeHeader}>
                  <Text style={[typography.bodyBold, { color: colors.text.primary, flex: 1 }]} numberOfLines={2}>
                    {challenge.title}
                  </Text>
                  <Badge
                    label={challenge.challenge_type?.replace('_', ' ') ?? 'challenge'}
                    size="sm"
                  />
                </View>
                {challenge.description && (
                  <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
                    {challenge.description}
                  </Text>
                )}

                {/* Progress per person */}
                <View style={[styles.progressSection, { marginTop: spacing.md, gap: spacing.sm }]}>
                  <View>
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      {myProfile?.display_name ?? 'You'}
                    </Text>
                    <ProgressBar
                      progress={challenge.target_value ? Math.min((challenge.user_a_progress ?? 0) / challenge.target_value, 1) : 0}
                      showPercentage
                    />
                  </View>
                  <View>
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      {partnerProfile?.display_name ?? 'Partner'}
                    </Text>
                    <ProgressBar
                      progress={challenge.target_value ? Math.min((challenge.user_b_progress ?? 0) / challenge.target_value, 1) : 0}
                      showPercentage
                      color="#22C55E"
                    />
                  </View>
                </View>

                <View style={[styles.dateRow, { marginTop: spacing.sm }]}>
                  {challenge.start_date && (
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      Started {formatDate(challenge.start_date)}
                    </Text>
                  )}
                  {challenge.end_date && (
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      Ends {formatDate(challenge.end_date)}
                    </Text>
                  )}
                </View>
              </Card>
            </Animated.View>
          );
        })}

        {active.length === 0 && (
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
              No active challenges. Create one to compete with your partner!
            </Text>
          </Card>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Completed ({completed.length})
            </Text>
            {completed.map((challenge, index) => (
              <Animated.View key={challenge.id} entering={FadeInDown.delay(300 + index * 40)}>
                <View
                  style={[styles.completedCard, {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { color: colors.text.secondary }]}>{challenge.title}</Text>
                    {challenge.winner_id && (
                      <Badge label="Won!" variant="success" size="sm" style={{ marginTop: spacing.xs }} />
                    )}
                  </View>
                  <Badge label={challenge.status ?? 'done'} size="sm" />
                </View>
              </Animated.View>
            ))}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreateModal} onDismiss={() => setShowCreateModal(false)} title="Create Challenge">
        <Input label="Challenge Title" value={formTitle} onChangeText={setFormTitle} placeholder="e.g. 7-Day Workout Streak" />
        <Input label="Description (optional)" value={formDescription} onChangeText={setFormDescription} placeholder="What's the challenge about?" containerStyle={{ marginTop: spacing.md }} />

        <Text style={[typography.captionBold, { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          Type
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {CHALLENGE_TYPES.map((ct) => (
            <Chip key={ct.key} label={ct.label} selected={formType === ct.key} onPress={() => setFormType(ct.key)} />
          ))}
        </ScrollView>

        <Input label="Target Value (optional)" value={formTarget} onChangeText={setFormTarget} placeholder="e.g. 7" keyboardType="decimal-pad" containerStyle={{ marginTop: spacing.md }} />
        <Input label="Duration (days)" value={formDuration} onChangeText={setFormDuration} placeholder="7" keyboardType="number-pad" containerStyle={{ marginTop: spacing.md }} />

        <Button title="Create Challenge" onPress={handleCreate} fullWidth disabled={!formTitle.trim()} style={{ marginTop: spacing.xl }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressSection: {},
  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  completedCard: { flexDirection: 'row', alignItems: 'center' },
});
