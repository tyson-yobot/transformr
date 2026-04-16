// =============================================================================
// TRANSFORMR -- Goal Detail Screen (AI-First)
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { ProgressRing } from '@components/ui/ProgressRing';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Modal } from '@components/ui/Modal';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { useGoalStore } from '@stores/goalStore';
import { supabase } from '../../../services/supabase';
import { hapticSuccess, hapticMedium, hapticLight } from '@utils/haptics';
import { formatDate, formatNumber, formatCountdown, formatDateInput, dateInputToISO, isoToDateInput } from '@utils/formatters';
import type { GoalMilestone } from '@app-types/database';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProgressLog {
  id: string;
  logged_at: string;
  value: number;
  note?: string;
}

interface AICoachResponse {
  message: string;
  action_steps?: string[];
  encouragement?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMomentumLabel(
  updates: number,
  successColor: string,
  warningColor: string,
  primaryLightColor: string,
  dangerColor: string,
): { label: string; color: string } {
  if (updates >= 5) return { label: 'High Momentum', color: successColor };
  if (updates >= 2) return { label: 'Building', color: warningColor };
  if (updates >= 1) return { label: 'Just Started', color: primaryLightColor };
  return { label: 'Stalled', color: dangerColor };
}

function predictCompletionDate(
  current: number,
  target: number,
  updatesLast7: ProgressLog[],
): string | null {
  if (!target || target <= 0 || updatesLast7.length < 2) return null;
  const remaining = target - current;
  if (remaining <= 0) return 'Already achieved';
  // Average daily gain over last 7 days
  const totalGain = updatesLast7.reduce((sum, log, i) => {
    if (i === 0) return sum;
    return sum + Math.max(0, log.value - (updatesLast7[i - 1]?.value ?? log.value));
  }, 0);
  const avgDailyGain = totalGain / 7;
  if (avgDailyGain <= 0) return null;
  const daysLeft = Math.ceil(remaining / avgDailyGain);
  const date = new Date();
  date.setDate(date.getDate() + daysLeft);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { goals, updateGoalProgress, updateGoal } = useGoalStore();

  const goal = goals.find((g) => g.id === id) ?? null;

  // ── State ──
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [progressInput, setProgressInput] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [checkInText, setCheckInText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [aiCoach, setAiCoach] = useState<AICoachResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.goalDetailScreen} />,
    });
  }, [navigation]);

  // ── Load data ──
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const [{ data: ms }, { data: logs }] = await Promise.all([
        supabase
          .from('goal_milestones')
          .select('*')
          .eq('goal_id', id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('goal_progress_logs')
          .select('*')
          .eq('goal_id', id)
          .order('logged_at', { ascending: true })
          .limit(30),
      ]);
      if (ms) setMilestones(ms as GoalMilestone[]);
      if (logs) setProgressLogs(logs as ProgressLog[]);
    };
    void load();
  }, [id]);

  // ── Load AI coaching for this goal ──
  useEffect(() => {
    if (!goal || aiCoach) return;
    const fetchCoach = async () => {
      setAiLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.functions.invoke('ai-coach', {
          body: {
            userId: user.id,
            type: 'goal_coaching',
            goalTitle: goal.title,
            goalCategory: goal.category,
            goalProgress: progress,
            goalDeadline: goal.target_date,
            currentValue: goal.current_value,
            targetValue: goal.target_value,
            unit: goal.unit,
            daysSinceStart: goal.start_date
              ? Math.floor((Date.now() - new Date(goal.start_date).getTime()) / 86400000)
              : null,
          },
        });
        if (!error && data) setAiCoach(data as AICoachResponse);
      } catch {
        // Non-fatal
      } finally {
        setAiLoading(false);
      }
    };
    void fetchCoach();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal?.id]);

  // ── Derived values ──
  const progress =
    goal?.target_value && goal.target_value > 0
      ? Math.min((goal.current_value ?? 0) / goal.target_value, 1)
      : 0;

  const updatesLast7 = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return progressLogs.filter((l) => new Date(l.logged_at).getTime() >= cutoff);
  }, [progressLogs]);

  const momentum = getMomentumLabel(
    updatesLast7.length,
    colors.accent.success,
    colors.accent.warning,
    colors.accent.primaryLight,
    colors.accent.danger,
  );

  const predictedDate = useMemo(
    () =>
      goal?.target_value && goal.current_value !== undefined
        ? predictCompletionDate(goal.current_value, goal.target_value, updatesLast7)
        : null,
    [goal, updatesLast7],
  );

  const deadlineStatus = useMemo(() => {
    if (!goal?.target_date) return null;
    const cd = formatCountdown(goal.target_date);
    return cd;
  }, [goal]);

  const completedMilestones = milestones.filter((m) => m.is_completed).length;

  // ── Actions ──
  const handleUpdateProgress = useCallback(async () => {
    if (!goal || !progressInput.trim()) return;
    const val = parseFloat(progressInput);
    if (isNaN(val)) return;
    setIsUpdating(true);
    try {
      await updateGoalProgress(goal.id, val);
      // Also log to progress_logs table
      await supabase.from('goal_progress_logs').insert({
        goal_id: goal.id,
        value: val,
        note: progressNote.trim() || null,
        logged_at: new Date().toISOString(),
      });
      const { data: logs } = await supabase
        .from('goal_progress_logs')
        .select('*')
        .eq('goal_id', goal.id)
        .order('logged_at', { ascending: true })
        .limit(30);
      if (logs) setProgressLogs(logs as ProgressLog[]);
      await hapticSuccess();
      setProgressInput('');
      setProgressNote('');
    } finally {
      setIsUpdating(false);
    }
  }, [goal, progressInput, progressNote, updateGoalProgress]);

  const handleCheckIn = useCallback(async () => {
    if (!goal || !checkInText.trim()) return;
    setIsCheckingIn(true);
    try {
      // Save check-in as a progress log note
      await supabase.from('goal_progress_logs').insert({
        goal_id: goal.id,
        value: goal.current_value ?? 0,
        note: `Check-in: ${checkInText.trim()}`,
        logged_at: new Date().toISOString(),
      });
      await hapticSuccess();
      setCheckInText('');
      setShowCheckIn(false);
    } finally {
      setIsCheckingIn(false);
    }
  }, [goal, checkInText]);

  const handleToggleMilestone = useCallback(async (milestone: GoalMilestone) => {
    const nowCompleted = !milestone.is_completed;
    await hapticMedium();
    const { error } = await supabase
      .from('goal_milestones')
      .update({
        is_completed: nowCompleted,
        completed_at: nowCompleted ? new Date().toISOString() : null,
      })
      .eq('id', milestone.id);
    if (!error) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestone.id
            ? { ...m, is_completed: nowCompleted, completed_at: nowCompleted ? new Date().toISOString() : undefined }
            : m,
        ),
      );
      if (nowCompleted) await hapticSuccess();
    }
  }, []);

  const handleAddMilestone = useCallback(async () => {
    if (!goal || !newMilestoneTitle.trim()) return;
    const { data } = await supabase
      .from('goal_milestones')
      .insert({
        goal_id: goal.id,
        title: newMilestoneTitle.trim(),
        target_date: dateInputToISO(newMilestoneDate) || null,
        sort_order: milestones.length,
      })
      .select()
      .single();
    if (data) {
      setMilestones((prev) => [...prev, data as GoalMilestone]);
      await hapticSuccess();
    }
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
    setShowMilestoneModal(false);
  }, [goal, milestones.length, newMilestoneTitle, newMilestoneDate]);

  const handleSaveEdit = useCallback(async () => {
    if (!goal) return;
    await updateGoal(goal.id, {
      title: editTitle || goal.title,
      description: editDescription || undefined,
      target_date: dateInputToISO(editTargetDate) || goal.target_date,
    });
    // Update target_value separately since updateGoal doesn't support it yet
    if (editTarget && !isNaN(parseFloat(editTarget))) {
      await supabase
        .from('goals')
        .update({ target_value: parseFloat(editTarget) })
        .eq('id', goal.id);
    }
    await hapticSuccess();
    setShowEditModal(false);
  }, [goal, editTitle, editDescription, editTargetDate, editTarget, updateGoal]);

  const handleTogglePause = useCallback(async () => {
    if (!goal) return;
    const newStatus = goal.status === 'paused' ? 'active' : 'paused';
    await updateGoal(goal.id, { status: newStatus });
    await hapticMedium();
  }, [goal, updateGoal]);

  const handleMarkComplete = useCallback(() => {
    Alert.alert(
      'Complete Goal',
      `Mark "${goal?.title}" as completed? This is a huge win!`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: '🎉 Complete it!',
          onPress: async () => {
            if (!goal) return;
            await supabase
              .from('goals')
              .update({ status: 'completed', completed_at: new Date().toISOString() })
              .eq('id', goal.id);
            await hapticSuccess();
            router.back();
          },
        },
      ],
    );
  }, [goal, router]);

  const handleAbandon = useCallback(() => {
    Alert.alert(
      'Abandon Goal',
      'Are you sure? You can always restart this goal later.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: async () => {
            if (!goal) return;
            await supabase.from('goals').update({ status: 'abandoned' }).eq('id', goal.id);
            router.back();
          },
        },
      ],
    );
  }, [goal, router]);

  // ── Guard ──
  if (!goal) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background.primary }]}>
        <Ionicons name="warning-outline" size={48} color={colors.accent.danger} />
        <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.md }]}>
          Goal not found
        </Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  const statusVariant: 'success' | 'warning' | 'info' | 'default' =
    goal.status === 'active' ? 'success' :
    goal.status === 'paused' ? 'warning' :
    goal.status === 'completed' ? 'info' : 'default';

  const isActive = goal.status === 'active';
  const hasTarget = goal.target_value != null && goal.target_value > 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── AI Insight Card ── */}
        <AIInsightCard
          screenKey={`goals/detail/${goal.category ?? 'personal'}`}
          style={{ marginBottom: spacing.md }}
        />

        {/* ── Goal Header ── */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated">
            <View style={styles.headerRow}>
              {goal.icon ? (
                <Text style={{ fontSize: 36, marginRight: spacing.md }}>{goal.icon}</Text>
              ) : (
                <View
                  style={[
                    styles.iconPlaceholder,
                    { backgroundColor: (goal.color ?? colors.accent.primary) + '20', borderRadius: borderRadius.md },
                  ]}
                >
                  <Ionicons name="flag" size={22} color={goal.color ?? colors.accent.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[typography.h2, { color: colors.text.primary }]}>{goal.title}</Text>
                {goal.description ? (
                  <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.xs }]}>
                    {goal.description}
                  </Text>
                ) : null}
                <View style={[styles.badgeRow, { marginTop: spacing.sm, gap: spacing.sm }]}>
                  <Badge label={goal.status ?? 'active'} variant={statusVariant} size="sm" />
                  {goal.category && <Badge label={goal.category} size="sm" />}
                  {goal.is_staked && (
                    <Badge label={`🔥 $${goal.stake_amount} staked`} variant="warning" size="sm" />
                  )}
                </View>
              </View>
              <Pressable
                onPress={() => {
                  hapticLight();
                  setEditTitle(goal.title);
                  setEditDescription(goal.description ?? '');
                  setEditTargetDate(goal.target_date ? isoToDateInput(goal.target_date) : '');
                  setEditTarget(goal.target_value?.toString() ?? '');
                  setShowEditModal(true);
                }}
                style={{ padding: spacing.xs }}
                accessibilityLabel="Edit goal"
              >
                <Ionicons name="pencil-outline" size={18} color={colors.text.muted} />
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        {/* ── Progress Ring + Stats ── */}
        {hasTarget && (
          <Animated.View entering={FadeInDown.delay(150)} style={[styles.progressSection, { marginTop: spacing.lg }]}>
            <ProgressRing
              progress={progress}
              size={130}
              strokeWidth={10}
              color={goal.color ?? colors.accent.primary}
            >
              <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                {Math.round(progress * 100)}%
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>done</Text>
            </ProgressRing>
            <View style={{ flex: 1, marginLeft: spacing.lg, gap: spacing.sm }}>
              <View>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>CURRENT</Text>
                <Text style={[typography.stat, { color: colors.text.primary }]}>
                  {formatNumber(goal.current_value ?? 0)}{goal.unit ? ` ${goal.unit}` : ''}
                </Text>
              </View>
              <View>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>TARGET</Text>
                <Text style={[typography.bodyBold, { color: goal.color ?? colors.accent.primary }]}>
                  {formatNumber(goal.target_value ?? 0)}{goal.unit ? ` ${goal.unit}` : ''}
                </Text>
              </View>
              {deadlineStatus && (
                <View>
                  <Text style={[typography.tiny, { color: colors.text.muted }]}>DEADLINE</Text>
                  <Text style={[typography.caption, {
                    color: deadlineStatus.days <= 3
                      ? colors.accent.danger
                      : deadlineStatus.days <= 7
                      ? colors.accent.warning
                      : colors.text.primary,
                  }]}>
                    {deadlineStatus.days === 0
                      ? 'Due today!'
                      : `${deadlineStatus.days} ${deadlineStatus.label}`}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* ── Momentum + Prediction ── */}
        <Animated.View entering={FadeInDown.delay(200)} style={{ marginTop: spacing.lg }}>
          <View style={[styles.statsRow, { gap: spacing.sm }]}>
            {/* Momentum */}
            <Card style={[styles.statCard, { borderLeftWidth: 3, borderLeftColor: momentum.color }]}>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>MOMENTUM</Text>
              <Text style={[typography.bodyBold, { color: momentum.color, marginTop: 2 }]}>
                {momentum.label}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 2 }]}>
                {updatesLast7.length} update{updatesLast7.length !== 1 ? 's' : ''} this week
              </Text>
            </Card>

            {/* Milestones */}
            <Card style={styles.statCard}>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>MILESTONES</Text>
              <Text style={[typography.bodyBold, { color: colors.text.primary, marginTop: 2 }]}>
                {completedMilestones}/{milestones.length}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 2 }]}>
                completed
              </Text>
            </Card>

            {/* Deadline or Predicted */}
            {goal.target_date ? (
              <Card style={styles.statCard}>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>DUE DATE</Text>
                <Text style={[typography.bodyBold, { color: colors.text.primary, marginTop: 2 }]} numberOfLines={1}>
                  {formatDate(goal.target_date)}
                </Text>
                <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 2 }]}>
                  target date
                </Text>
              </Card>
            ) : predictedDate ? (
              <Card style={styles.statCard}>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>AI FORECAST</Text>
                <Text style={[typography.bodyBold, { color: colors.accent.cyan, marginTop: 2 }]} numberOfLines={1}>
                  {predictedDate}
                </Text>
                <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 2 }]}>
                  at current pace
                </Text>
              </Card>
            ) : null}
          </View>
        </Animated.View>

        {/* ── AI Coach Section ── */}
        <Animated.View entering={FadeInDown.delay(250)} style={{ marginTop: spacing.lg }}>
          <Card
            style={{
              borderWidth: 1,
              borderColor: `${colors.accent.cyan}30`,
              backgroundColor: `${colors.accent.cyan}08`,
            }}
          >
            <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
              <Ionicons name="sparkles" size={18} color={colors.accent.cyan} />
              <Text style={[typography.h3, { color: colors.accent.cyan, marginLeft: spacing.sm }]}>
                AI Coach
              </Text>
              {aiLoading && <ActivityIndicator size="small" color={colors.accent.cyan} style={{ marginLeft: 'auto' }} />}
            </View>

            {aiCoach ? (
              <>
                <Text style={[typography.body, { color: colors.text.primary, lineHeight: 22 }]}>
                  {aiCoach.message}
                </Text>
                {aiCoach.action_steps && aiCoach.action_steps.length > 0 && (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
                      TODAY'S ACTION STEPS
                    </Text>
                    {aiCoach.action_steps.map((step, i) => (
                      <View key={i} style={[styles.actionStep, { marginTop: spacing.xs }]}>
                        <View style={[styles.stepBullet, { backgroundColor: colors.accent.primary }]} />
                        <Text style={[typography.caption, { color: colors.text.primary, flex: 1 }]}>
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {aiCoach.encouragement ? (
                  <Text style={[typography.caption, { color: colors.accent.cyan, marginTop: spacing.md, fontStyle: 'italic' }]}>
                    "{aiCoach.encouragement}"
                  </Text>
                ) : null}
              </>
            ) : aiLoading ? (
              <Text style={[typography.caption, { color: colors.text.muted }]}>
                Analyzing your goal and generating personalized coaching...
              </Text>
            ) : (
              <Text style={[typography.caption, { color: colors.text.muted }]}>
                AI coaching unavailable. Keep pushing toward your goal!
              </Text>
            )}
          </Card>
        </Animated.View>

        {/* ── Daily Check-In ── */}
        {isActive && (
          <Animated.View entering={FadeInDown.delay(300)} style={{ marginTop: spacing.lg }}>
            {showCheckIn ? (
              <Card>
                <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                  Daily Check-In
                </Text>
                <Input
                  label="What did you do toward this goal today?"
                  value={checkInText}
                  onChangeText={setCheckInText}
                  placeholder="e.g., Ran 3 miles, studied for 2 hours..."
                  multiline
                  numberOfLines={3}
                  autoFocus
                />
                <View style={[styles.rowButtons, { marginTop: spacing.md, gap: spacing.sm }]}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => { setShowCheckIn(false); setCheckInText(''); }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Log Check-In"
                    onPress={handleCheckIn}
                    loading={isCheckingIn}
                    disabled={!checkInText.trim()}
                    style={{ flex: 2 }}
                  />
                </View>
              </Card>
            ) : (
              <Pressable
                onPress={() => { hapticLight(); setShowCheckIn(true); }}
                style={[
                  styles.checkInButton,
                  {
                    backgroundColor: `${colors.accent.primary}15`,
                    borderColor: `${colors.accent.primary}40`,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                  },
                ]}
                accessibilityLabel="Open daily check-in"
              >
                <Ionicons name="calendar-outline" size={20} color={colors.accent.primary} />
                <View style={{ marginLeft: spacing.sm }}>
                  <Text style={[typography.bodyBold, { color: colors.accent.primary }]}>
                    Daily Check-In
                  </Text>
                  <Text style={[typography.tiny, { color: colors.text.secondary }]}>
                    Log what you did today toward this goal
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.accent.primary} style={{ marginLeft: 'auto' }} />
              </Pressable>
            )}
          </Animated.View>
        )}

        {/* ── Progress Update (numeric goals) ── */}
        {isActive && hasTarget && (
          <Animated.View entering={FadeInDown.delay(330)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Update Progress
            </Text>
            <Card>
              <ProgressBar
                progress={progress}
                showPercentage
                color={goal.color ?? undefined}
                style={{ marginBottom: spacing.md }}
              />
              <Input
                label={`New value${goal.unit ? ` (${goal.unit})` : ''}`}
                value={progressInput}
                onChangeText={setProgressInput}
                placeholder={String(goal.current_value ?? 0)}
                keyboardType="decimal-pad"
              />
              <Input
                label="Note (optional)"
                value={progressNote}
                onChangeText={setProgressNote}
                placeholder="What made the difference today?"
                containerStyle={{ marginTop: spacing.sm }}
              />
              <Button
                title="Save Progress"
                onPress={handleUpdateProgress}
                fullWidth
                loading={isUpdating}
                disabled={!progressInput.trim()}
                style={{ marginTop: spacing.md }}
                leftIcon={<Ionicons name="trending-up" size={18} color="#fff" />}
              />
            </Card>
          </Animated.View>
        )}

        {/* ── Progress History ── */}
        {progressLogs.length > 0 && (
          <Animated.View entering={FadeInDown.delay(360)}>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Progress History
            </Text>
            {[...progressLogs].reverse().slice(0, 7).map((log, i) => (
              <Animated.View key={log.id} entering={FadeInRight.delay(i * 40)}>
                <View
                  style={[
                    styles.logRow,
                    {
                      borderLeftColor: goal.color ?? colors.accent.primary,
                      borderLeftWidth: 2,
                      paddingLeft: spacing.md,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    {hasTarget && (
                      <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                        {formatNumber(log.value)}{goal.unit ? ` ${goal.unit}` : ''}
                      </Text>
                    )}
                    {log.note ? (
                      <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]}>
                        {log.note}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[typography.tiny, { color: colors.text.muted }]}>
                    {formatDate(log.logged_at)}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* ── Milestones ── */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <View style={[styles.sectionHeader, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
            <Text style={[typography.h3, { color: colors.text.primary }]}>
              Milestones
            </Text>
            {isActive && (
              <Pressable
                onPress={() => { hapticLight(); setShowMilestoneModal(true); }}
                style={[styles.addMilestoneBtn, { backgroundColor: colors.accent.primary + '20', borderRadius: borderRadius.sm }]}
                accessibilityLabel="Add milestone"
              >
                <Ionicons name="add" size={16} color={colors.accent.primary} />
                <Text style={[typography.tiny, { color: colors.accent.primary, marginLeft: 2 }]}>Add</Text>
              </Pressable>
            )}
          </View>

          {milestones.length > 0 ? (
            milestones.map((milestone) => (
              <Card
                key={milestone.id}
                style={{ marginBottom: spacing.sm }}
                onPress={() => { hapticLight(); handleToggleMilestone(milestone); }}
              >
                <View style={styles.milestoneRow}>
                  <Ionicons
                    name={milestone.is_completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={milestone.is_completed ? colors.accent.success : colors.text.muted}
                  />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text
                      style={[
                        typography.bodyBold,
                        {
                          color: milestone.is_completed ? colors.text.secondary : colors.text.primary,
                          textDecorationLine: milestone.is_completed ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {milestone.title}
                    </Text>
                    {milestone.target_date && (
                      <Text style={[typography.caption, { color: colors.text.muted }]}>
                        {formatDate(milestone.target_date)}
                      </Text>
                    )}
                  </View>
                  {milestone.is_completed && (
                    <Ionicons name="trophy" size={14} color={colors.accent.gold} />
                  )}
                </View>
              </Card>
            ))
          ) : (
            <Pressable
              onPress={() => { hapticLight(); setShowMilestoneModal(true); }}
              style={[
                styles.emptyMilestone,
                {
                  borderColor: colors.border.subtle,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                },
              ]}
            >
              <Ionicons name="flag-outline" size={20} color={colors.text.muted} />
              <Text style={[typography.caption, { color: colors.text.muted, marginLeft: spacing.sm }]}>
                Add milestones to break this goal into wins
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* ── Actions ── */}
        {isActive && (
          <Animated.View entering={FadeInDown.delay(500)} style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <Button
              title="Mark as Complete"
              onPress={handleMarkComplete}
              fullWidth
              leftIcon={<Ionicons name="trophy" size={18} color={colors.accent.gold} />}
            />
            <View style={[styles.rowButtons, { gap: spacing.sm }]}>
              <Button
                title={goal.status === 'paused' ? 'Resume' : 'Pause Goal'}
                variant="outline"
                onPress={handleTogglePause}
                style={{ flex: 1 }}
                leftIcon={
                  <Ionicons
                    name={goal.status === 'paused' ? 'play-outline' : 'pause-outline'}
                    size={16}
                    color={colors.accent.primary}
                  />
                }
              />
              <Button
                title="Abandon"
                variant="outline"
                onPress={handleAbandon}
                style={{ flex: 1, borderColor: colors.accent.danger + '60' }}
                textStyle={{ color: colors.accent.danger }}
              />
            </View>
          </Animated.View>
        )}

        {goal.status === 'paused' && (
          <Animated.View entering={FadeInDown.delay(500)} style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <Button
              title="Resume Goal"
              onPress={handleTogglePause}
              fullWidth
              leftIcon={<Ionicons name="play-outline" size={18} color="#fff" />}
            />
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Edit Goal Modal ── */}
      <Modal visible={showEditModal} onDismiss={() => setShowEditModal(false)} title="Edit Goal">
        <Input
          label="Title"
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Goal title"
        />
        <Input
          label="Description (optional)"
          value={editDescription}
          onChangeText={setEditDescription}
          placeholder="What does success look like?"
          multiline
          numberOfLines={2}
          containerStyle={{ marginTop: spacing.md }}
        />
        {hasTarget && (
          <Input
            label={`Target${goal.unit ? ` (${goal.unit})` : ''}`}
            value={editTarget}
            onChangeText={setEditTarget}
            keyboardType="decimal-pad"
            containerStyle={{ marginTop: spacing.md }}
          />
        )}
        <Input
          label="Target Date (optional)"
          value={editTargetDate}
          onChangeText={(t) => setEditTargetDate(formatDateInput(t))}
          placeholder="MM/DD/YYYY"
          keyboardType="number-pad"
          maxLength={10}
          containerStyle={{ marginTop: spacing.md }}
        />
        <Button
          title="Save Changes"
          onPress={handleSaveEdit}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
      </Modal>

      {/* ── Add Milestone Modal ── */}
      <Modal
        visible={showMilestoneModal}
        onDismiss={() => setShowMilestoneModal(false)}
        title="Add Milestone"
      >
        <Input
          label="Milestone"
          value={newMilestoneTitle}
          onChangeText={setNewMilestoneTitle}
          placeholder="e.g., Reach 50% of target"
          autoFocus
        />
        <Input
          label="Target Date (optional)"
          value={newMilestoneDate}
          onChangeText={(t) => setNewMilestoneDate(formatDateInput(t))}
          placeholder="MM/DD/YYYY"
          keyboardType="number-pad"
          maxLength={10}
          containerStyle={{ marginTop: spacing.md }}
        />
        <Button
          title="Add Milestone"
          onPress={handleAddMilestone}
          fullWidth
          disabled={!newMilestoneTitle.trim()}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  iconPlaceholder: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  progressSection: { flexDirection: 'row', alignItems: 'center' },
  statsRow: { flexDirection: 'row' },
  statCard: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  addMilestoneBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, marginLeft: 'auto' },
  milestoneRow: { flexDirection: 'row', alignItems: 'center' },
  emptyMilestone: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  checkInButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  rowButtons: { flexDirection: 'row' },
  logRow: {},
  actionStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stepBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
});
