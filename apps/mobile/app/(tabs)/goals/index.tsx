// =============================================================================
// TRANSFORMR -- Goals Dashboard
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressBar } from '@components/ui/ProgressBar';
import { ProgressRing } from '@components/ui/ProgressRing';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Chip } from '@components/ui/Chip';
import { MonoText } from '@components/ui/MonoText';
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import { TabHeroBackground } from '@components/ui/TabHeroBackground';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { SectionTile } from '@components/ui/SectionTile';
import { PurpleRadialBackground } from '@components/ui/PurpleRadialBackground';
import { Ionicons } from '@expo/vector-icons';
import { CalendarDots, CaretRight } from 'phosphor-react-native';
import { useGoalStore } from '@stores/goalStore';
import { formatDate, formatCountdown, formatPercentage, formatDateInput, dateInputToISO, isoToDateInput } from '@utils/formatters';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { EmptyState } from '@components/ui/EmptyState';
import { HelpBubble } from '@components/ui/HelpBubble';
import type { Goal } from '@app-types/database';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { Coachmark } from '@components/ui/Coachmark';
import type { CoachmarkStep } from '@components/ui/Coachmark';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { COACHMARK_KEYS, COACHMARK_CONTENT } from '../../../constants/coachmarkSteps';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';

type GoalCategory = NonNullable<Goal['category']>;

const CATEGORIES: { key: GoalCategory; label: string }[] = [
  { key: 'fitness', label: 'Fitness' },
  { key: 'business', label: 'Business' },
  { key: 'personal', label: 'Personal' },
  { key: 'financial', label: 'Financial' },
  { key: 'health', label: 'Health' },
  { key: 'education', label: 'Education' },
  { key: 'mindset', label: 'Mindset' },
  { key: 'relationship', label: 'Relationship' },
  { key: 'nutrition', label: 'Nutrition' },
];


type NavAccent = 'success' | 'info' | 'warning' | 'cyan' | 'fire' | 'pink' | 'gold' | 'danger';

const NAV_ITEMS: { route: string; label: string; icon: keyof typeof Ionicons.glyphMap; accent: NavAccent }[] = [
  { route: '/(tabs)/goals/habits',       label: 'Habits',     icon: 'checkmark-circle-outline', accent: 'success' },
  { route: '/(tabs)/goals/sleep',        label: 'Sleep',      icon: 'moon-outline',             accent: 'info' },
  { route: '/(tabs)/goals/mood',         label: 'Mood',       icon: 'happy-outline',            accent: 'warning' },
  { route: '/(tabs)/goals/journal',      label: 'Journal',    icon: 'journal-outline',          accent: 'cyan' },
  { route: '/(tabs)/goals/focus-mode',   label: 'Focus',      icon: 'timer-outline',            accent: 'fire' },
  { route: '/(tabs)/goals/vision-board', label: 'Vision',     icon: 'images-outline',           accent: 'pink' },
  { route: '/(tabs)/goals/skills',       label: 'Skills',     icon: 'bulb-outline',             accent: 'gold' },
  { route: '/(tabs)/goals/challenges',   label: 'Challenges', icon: 'trophy-outline',           accent: 'gold' },
  { route: '/(tabs)/goals/stake-goals',  label: 'Stakes',     icon: 'flame-outline',            accent: 'danger' },
  { route: '/(tabs)/goals/health-roi',   label: 'Health ROI', icon: 'pulse-outline',             accent: 'success' },
  { route: '/(tabs)/goals/affirmations', label: 'Affirmations', icon: 'sunny-outline',           accent: 'gold' },
  { route: '/(tabs)/goals/retrospective', label: 'Retrospective', icon: 'time-outline',          accent: 'info' },
  { route: '/(tabs)/goals/community',    label: 'Community',  icon: 'people-outline',            accent: 'cyan' },
  { route: '/(tabs)/goals/insights',     label: 'Insights',   icon: 'analytics-outline',         accent: 'info' },
];

export default function GoalsDashboard() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const goals = useGoalStore((s) => s.goals);
  const isLoading = useGoalStore((s) => s.isLoading);
  const fetchGoals = useGoalStore((s) => s.fetchGoals);
  const createGoal = useGoalStore((s) => s.createGoal);
  const updateGoal = useGoalStore((s) => s.updateGoal);

  const { toast, show: showToast, hide: hideToast } = useActionToast();

  const [coachmarkSteps, setCoachmarkSteps] = React.useState<CoachmarkStep[]>([]);
  const goalsHeaderRef = React.useRef<View>(null);
  const navGridRef = React.useRef<View>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<GoalCategory>('personal');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  // Inline deadline editing: maps goal.id → draft date string (MM/DD/YYYY)
  const [editingDeadline, setEditingDeadline] = useState<string | null>(null);
  const [deadlineDraft, setDeadlineDraft] = useState('');

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.goalsHome} />,
    });
  }, [navigation]);

  const measureCoachmarks = React.useCallback(() => {
    const content = COACHMARK_CONTENT.goals;
    const steps: CoachmarkStep[] = [];
    let pending = 2;
    const done = () => {
      if (--pending === 0) setCoachmarkSteps(steps.filter(Boolean) as CoachmarkStep[]);
    };
    goalsHeaderRef.current?.measure((_x, _y, w, h, px, py) => {
      const s0 = content[0];
      if (s0) steps[0] = { ...s0, targetX: px, targetY: py, targetWidth: w, targetHeight: h };
      done();
    });
    navGridRef.current?.measure((_x, _y, w, h, px, py) => {
      const s1 = content[1];
      if (s1) steps[1] = { ...s1, targetX: px, targetY: py, targetWidth: w, targetHeight: h };
      done();
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  }, [fetchGoals]);

  const overallCompletion = useMemo(() => {
    const goalsWithTarget = goals.filter((g) => g.target_value && g.target_value > 0);
    if (goalsWithTarget.length === 0) return 0;
    const total = goalsWithTarget.reduce((sum, g) => {
      return sum + Math.min((g.current_value ?? 0) / (g.target_value ?? 1), 1);
    }, 0);
    return total / goalsWithTarget.length;
  }, [goals]);

  const filteredGoals = useMemo(
    () =>
      selectedCategory
        ? goals.filter((g) => g.category === selectedCategory)
        : goals,
    [goals, selectedCategory],
  );

  const upcomingDeadlines = useMemo(
    () =>
      goals
        .filter((g) => g.target_date && g.status === 'active')
        .sort(
          (a, b) =>
            new Date(a.target_date ?? 0).getTime() - new Date(b.target_date ?? 0).getTime(),
        )
        .slice(0, 5),
    [goals],
  );

  const goalsByCategory = useMemo(() => {
    const map = new Map<string, Goal[]>();
    for (const g of goals) {
      const cat = g.category ?? 'personal';
      const existing = map.get(cat) ?? [];
      existing.push(g);
      map.set(cat, existing);
    }
    return map;
  }, [goals]);

  const handleAddGoal = useCallback(async () => {
    if (!newGoalTitle.trim()) return;
    const titleForToast = newGoalTitle.trim();
    await createGoal({
      title: titleForToast,
      category: newGoalCategory,
      target_date: dateInputToISO(newGoalTargetDate) || undefined,
    });
    await hapticSuccess();
    setShowAddModal(false);
    setNewGoalTitle('');
    setNewGoalTargetDate('');
    showToast('Goal set', { subtext: `Starting ${titleForToast}` });
  }, [newGoalTitle, newGoalCategory, newGoalTargetDate, createGoal, showToast]);

  const getGoalProgress = (goal: Goal): number => {
    if (!goal.target_value || goal.target_value === 0) return 0;
    return Math.min((goal.current_value ?? 0) / goal.target_value, 1);
  };

  const urgentGoals = useMemo(
    () =>
      goals.filter((g) => {
        if (!g.target_date || g.status !== 'active') return false;
        const days = Math.ceil(
          (new Date(g.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        return days >= 0 && days <= 3;
      }),
    [goals],
  );

  const goalsWithoutDate = useMemo(
    () => goals.filter((g) => !g.target_date && g.status === 'active'),
    [goals],
  );

  const handleSaveDeadline = useCallback(
    async (goalId: string) => {
      const iso = dateInputToISO(deadlineDraft);
      if (iso) {
        await updateGoal(goalId, { target_date: iso });
        await hapticSuccess();
      }
      setEditingDeadline(null);
      setDeadlineDraft('');
    },
    [deadlineDraft, updateGoal],
  );

  const handleStartEditDeadline = useCallback((goal: Goal) => {
    hapticLight();
    setEditingDeadline(goal.id);
    setDeadlineDraft(goal.target_date ? isoToDateInput(goal.target_date) : '');
  }, []);

  if (isLoading && goals.length === 0) {
    return (
      <ListSkeleton
        rows={6}
        style={{ backgroundColor: colors.background.primary }}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <PurpleRadialBackground />
      <TabHeroBackground query="achievement target sunrise dark" height={240} opacity={0.12} />
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
        <AIInsightCard screenKey="goals/index" style={{ marginBottom: spacing.md }} />

        {/* Overall Completion Ring */}
        <Animated.View ref={goalsHeaderRef} onLayout={measureCoachmarks} entering={FadeInDown.delay(100)} style={styles.ringSection}>
          <ProgressRing progress={overallCompletion} size={140} strokeWidth={12}>
            <MonoText variant="stat" color={colors.text.primary}>
              {formatPercentage(overallCompletion * 100)}
            </MonoText>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              Complete
            </Text>
          </ProgressRing>
          <Text
            style={[
              typography.caption,
              { color: colors.text.secondary, marginTop: spacing.sm },
            ]}
          >
            {goals.length} active goal{goals.length !== 1 ? 's' : ''}
          </Text>
          <HelpBubble
            id="goals_streak"
            message="Keep your streak alive by completing habits daily"
            position="below"
          />
        </Animated.View>

        {/* Quick Nav */}
        <Animated.View ref={navGridRef} entering={FadeInDown.delay(200)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg, paddingBottom: spacing.xs }}
          >
            {NAV_ITEMS.map((item) => (
              <SectionTile
                key={item.route}
                icon={item.icon}
                label={item.label}
                accentColor={colors.accent[item.accent]}
                size="md"
                onPress={() => router.push(item.route as Href)}
              />
            ))}
          </ScrollView>
        </Animated.View>
        <HelpBubble id="goals_habits" message="Tap a habit to mark it complete for today" position="below" />

        {/* Category Filter */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md },
            ]}
          >
            Goals by Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            <Chip
              label="All"
              selected={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
            />
            {CATEGORIES.map((cat) => {
              const count = goalsByCategory.get(cat.key)?.length ?? 0;
              return (
                <Chip
                  key={cat.key}
                  label={`${cat.label} (${count})`}
                  selected={selectedCategory === cat.key}
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === cat.key ? null : cat.key,
                    )
                  }
                />
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Urgent deadline alert */}
        {urgentGoals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(350)}>
            <View
              style={[
                styles.urgentBanner,
                {
                  backgroundColor: colors.accent.danger + '18',
                  borderColor: colors.accent.danger + '60',
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginTop: spacing.lg,
                },
              ]}
            >
              <Text style={[typography.captionBold, { color: colors.accent.danger, marginBottom: spacing.xs }]}>
                {urgentGoals.length === 1 ? '🔥 1 goal due in 3 days or less!' : `🔥 ${urgentGoals.length} goals due in 3 days or less!`}
              </Text>
              {urgentGoals.map((g) => (
                <Text key={g.id} style={[typography.caption, { color: colors.text.primary }]} numberOfLines={1}>
                  · {g.title} — {formatDate(g.target_date ?? '')}
                </Text>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Nudge for goals without deadlines */}
        {goalsWithoutDate.length > 0 && (
          <Animated.View entering={FadeInDown.delay(370)}>
            <View
              style={[
                styles.urgentBanner,
                {
                  backgroundColor: colors.accent.warning + '14',
                  borderColor: colors.accent.warning + '50',
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginTop: spacing.sm,
                },
              ]}
            >
              <Text style={[typography.captionBold, { color: colors.accent.warning }]}>
                {goalsWithoutDate.length} goal{goalsWithoutDate.length !== 1 ? 's have' : ' has'} no deadline set
              </Text>
              <Text style={[typography.tiny, { color: colors.text.secondary, marginTop: 2 }]}>
                Tap "Set deadline" on each goal to hold yourself accountable.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Active Goals List */}
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {filteredGoals.map((goal, index) => {
            const progress = getGoalProgress(goal);
            const categoryInfo = CATEGORIES.find((c) => c.key === goal.category);
            const isCompleted = goal.status === 'completed';
            // Status-based accent: completed → green, active → purple, else neutral
            const statusGlowColor = isCompleted ? '#22C55E' : '#A855F7';
            return (
              <Animated.View key={goal.id} entering={FadeInDown.delay(400 + index * 50)}>
                <Card
                  variant="elevated"
                  onPress={() => router.push(`/(tabs)/goals/${goal.id}` as Href)}
                  style={{
                    shadowColor: statusGlowColor,
                    shadowOpacity: isCompleted ? 0.35 : 0.25,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                    borderWidth: 1,
                    borderColor: isCompleted ? '#22C55E30' : '#A855F720',
                  }}
                >
                  <View style={styles.goalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[typography.bodyBold, { color: isCompleted ? '#22C55E' : colors.text.primary }]}
                        numberOfLines={1}
                      >
                        {goal.title}
                      </Text>
                      {goal.description && (
                        <Text
                          style={[
                            typography.caption,
                            { color: colors.text.secondary, marginTop: spacing.xs },
                          ]}
                          numberOfLines={2}
                        >
                          {goal.description}
                        </Text>
                      )}
                    </View>
                    {categoryInfo && (
                      <Badge label={categoryInfo.label} variant="info" size="sm" />
                    )}
                  </View>

                  <ProgressBar
                    progress={progress}
                    showPercentage
                    color={isCompleted ? '#22C55E' : (goal.color ?? undefined)}
                    gradient={isCompleted ? undefined : ['#A855F7', '#EC4899']}
                    style={{ marginTop: spacing.md }}
                  />

                  {goal.target_value != null && (
                    <MonoText
                      variant="monoCaption"
                      color={colors.text.muted}
                      style={{ marginTop: spacing.xs }}
                    >
                      {goal.current_value ?? 0} / {goal.target_value}
                      {goal.unit ? ` ${goal.unit}` : ''}
                    </MonoText>
                  )}

                  {/* Deadline section — tap to edit, or set if missing */}
                  {editingDeadline === goal.id ? (
                    <View style={[styles.deadlineRow, { marginTop: spacing.sm, gap: spacing.sm }]}>
                      <Input
                        value={deadlineDraft}
                        onChangeText={(t) => setDeadlineDraft(formatDateInput(t))}
                        placeholder="MM/DD/YYYY"
                        keyboardType="number-pad"
                        maxLength={10}
                        containerStyle={{ flex: 1 }}
                        autoFocus
                      />
                      <Pressable
                        onPress={() => handleSaveDeadline(goal.id)}
                        style={[
                          styles.deadlineSaveBtn,
                          { backgroundColor: colors.accent.primary, borderRadius: borderRadius.sm },
                        ]}
                      >
                        <Text style={[typography.captionBold, { color: colors.text.inverse }]}>Save</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => { setEditingDeadline(null); setDeadlineDraft(''); }}
                        style={[
                          styles.deadlineSaveBtn,
                          { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.sm },
                        ]}
                      >
                        <Text style={[typography.captionBold, { color: colors.text.secondary }]}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : goal.target_date ? (
                    <Pressable
                      onPress={() => handleStartEditDeadline(goal)}
                      style={[styles.deadlineRow, { marginTop: spacing.sm }]}
                      accessibilityLabel={`Edit deadline for ${goal.title}`}
                    >
                      <MonoText
                        variant="monoCaption"
                        color={
                          formatCountdown(goal.target_date).days <= 3
                            ? colors.accent.danger
                            : formatCountdown(goal.target_date).days <= 7
                              ? colors.accent.warning
                              : colors.text.muted
                        }
                      >
                        {formatCountdown(goal.target_date).days === 0
                          ? 'Due today'
                          : `${formatCountdown(goal.target_date).days} ${formatCountdown(goal.target_date).label}`}
                      </MonoText>
                      <Text style={[typography.tiny, { color: colors.text.muted, marginLeft: 6 }]}>
                        · tap to edit
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => handleStartEditDeadline(goal)}
                      style={[styles.deadlineRow, { marginTop: spacing.sm }]}
                      accessibilityLabel={`Set deadline for ${goal.title}`}
                    >
                      <Text style={[typography.tiny, { color: colors.accent.primary }]}>
                        + Set deadline
                      </Text>
                    </Pressable>
                  )}
                </Card>
              </Animated.View>
            );
          })}

          {filteredGoals.length === 0 && (
            <EmptyState
              ionIcon="trophy-outline"
              title="No goals yet"
              subtitle="Dream big, start small. Set your first goal and watch your momentum build."
              actionLabel="Add a Goal"
              onAction={() => { hapticLight(); setShowAddModal(true); }}
            />
          )}
        </View>

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600)}>
            <Text
              style={[
                typography.h3,
                {
                  color: colors.text.primary,
                  marginTop: spacing.xl,
                  marginBottom: spacing.md,
                },
              ]}
            >
              Upcoming Deadlines
            </Text>
            {upcomingDeadlines.map((goal) => (
              <View
                key={goal.id}
                style={[
                  styles.deadlineItem,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[typography.bodyBold, { color: colors.text.primary }]}
                    numberOfLines={1}
                  >
                    {goal.title}
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    {formatDate(goal.target_date ?? '')}
                  </Text>
                </View>
                <Badge
                  label={`${formatCountdown(goal.target_date ?? '').days}d`}
                  variant={
                    formatCountdown(goal.target_date ?? '').days <= 7 ? 'danger' : 'warning'
                  }
                  size="sm"
                />
              </View>
            ))}
          </Animated.View>
        )}

        {/* Weekly Review */}
        <Animated.View entering={FadeInDown.delay(650)}>
          <Card
            variant="outlined"
            style={{ marginTop: spacing.xl, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg }}
            onPress={() => router.push('/weekly-review' as Href)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <CalendarDots size={24} color={colors.accent.primary} weight="duotone" />
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                  Weekly Review
                </Text>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  See your weekly performance grade and AI analysis
                </Text>
              </View>
              <CaretRight size={20} color={colors.text.muted} />
            </View>
          </Card>
        </Animated.View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => { hapticLight(); setShowAddModal(true); }}
        accessibilityLabel="Add new goal"
        style={[
          styles.fab,
          { backgroundColor: colors.accent.primary, borderRadius: 28, shadowColor: colors.accent.primary },
        ]}
      >
        <Text style={[typography.h2, { color: colors.text.inverse }]}>+</Text>
      </Pressable>

      <ActionToast
        message={toast.message}
        subtext={toast.subtext}
        visible={toast.visible}
        onHide={hideToast}
        type={toast.type}
      />
      <Coachmark screenKey={COACHMARK_KEYS.goals} steps={coachmarkSteps} />

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        title="Add Goal"
      >
        <Input
          label="Goal Title"
          value={newGoalTitle}
          onChangeText={setNewGoalTitle}
          placeholder="What do you want to achieve?"
        />

        <Text
          style={[
            typography.captionBold,
            {
              color: colors.text.secondary,
              marginTop: spacing.lg,
              marginBottom: spacing.sm,
            },
          ]}
        >
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              selected={newGoalCategory === cat.key}
              onPress={() => setNewGoalCategory(cat.key)}
            />
          ))}
        </ScrollView>

        <Input
          label="Target Date (optional)"
          value={newGoalTargetDate}
          onChangeText={(t) => setNewGoalTargetDate(formatDateInput(t))}
          placeholder="MM/DD/YYYY"
          keyboardType="number-pad"
          maxLength={10}
          containerStyle={{ marginTop: spacing.lg }}
        />

        <Button
          title="Create Goal"
          onPress={handleAddGoal}
          fullWidth
          loading={isLoading}
          disabled={!newGoalTitle.trim()}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  ringSection: { alignItems: 'center', marginBottom: 16 },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deadlineRow: { flexDirection: 'row', alignItems: 'center' },
  deadlineItem: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.15)' },
  deadlineSaveBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  urgentBanner: { borderWidth: 1 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
