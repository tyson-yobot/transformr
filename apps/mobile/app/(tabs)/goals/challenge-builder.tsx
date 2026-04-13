// =============================================================================
// TRANSFORMR -- Custom Challenge Builder
// =============================================================================

import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Chip } from '@components/ui/Chip';
import { Toggle } from '@components/ui/Toggle';
import { Input } from '@components/ui/Input';
import { Slider } from '@components/ui/Slider';
import { useChallengeStore } from '@stores/challengeStore';
import { supabase } from '@services/supabase';
import type {
  ChallengeTask,
  ChallengeTaskType,
  ChallengeDifficulty,
} from '@app-types/database';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DURATION_OPTIONS = [7, 14, 21, 30, 60, 75, 90, 100, 365];

const DIFFICULTY_OPTIONS: { value: ChallengeDifficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'extreme', label: 'Extreme' },
];

// ---------------------------------------------------------------------------
// Task Definition Configs
// ---------------------------------------------------------------------------

interface TaskConfig {
  type: ChallengeTaskType;
  label: string;
  icon: string;
  auto_verify: boolean;
  hasConfig: boolean;
}

const TASK_DEFINITIONS: TaskConfig[] = [
  { type: 'workout', label: 'Workout', icon: '\uD83C\uDFCB\uFE0F', auto_verify: false, hasConfig: true },
  { type: 'calories', label: 'Calories', icon: '\uD83D\uDD25', auto_verify: false, hasConfig: true },
  { type: 'protein', label: 'Protein', icon: '\uD83E\uDD69', auto_verify: false, hasConfig: true },
  { type: 'water', label: 'Water', icon: '\uD83D\uDCA7', auto_verify: false, hasConfig: true },
  { type: 'steps', label: 'Steps', icon: '\uD83D\uDEB6', auto_verify: true, hasConfig: true },
  { type: 'sleep', label: 'Sleep', icon: '\uD83D\uDE34', auto_verify: true, hasConfig: true },
  { type: 'reading', label: 'Reading', icon: '\uD83D\uDCDA', auto_verify: false, hasConfig: true },
  { type: 'meditation', label: 'Meditation', icon: '\uD83E\uDDD8', auto_verify: false, hasConfig: true },
  { type: 'alcohol_free', label: 'No Alcohol', icon: '\uD83D\uDEAB', auto_verify: false, hasConfig: false },
  { type: 'sugar_free', label: 'No Sugar', icon: '\uD83C\uDF6C', auto_verify: false, hasConfig: false },
  { type: 'photo', label: 'Progress Photo', icon: '\uD83D\uDCF8', auto_verify: true, hasConfig: false },
  { type: 'journal', label: 'Journal Entry', icon: '\uD83D\uDCDD', auto_verify: false, hasConfig: false },
  { type: 'custom', label: 'Custom Task', icon: '\u2699\uFE0F', auto_verify: false, hasConfig: true },
];

// ---------------------------------------------------------------------------
// Task State Types
// ---------------------------------------------------------------------------

interface TaskState {
  enabled: boolean;
  // Workout
  workoutDuration: number;
  workoutCount: number;
  workoutOutdoor: boolean;
  // Calories
  caloriesMin: string;
  caloriesMax: string;
  // Protein
  proteinMin: string;
  // Water
  waterTarget: number;
  // Steps
  stepsTarget: number;
  // Sleep
  sleepMin: number;
  // Reading
  readingPages: number;
  // Meditation
  meditationMinutes: number;
  // Custom
  customLabel: string;
}

function createDefaultTaskState(): TaskState {
  return {
    enabled: false,
    workoutDuration: 45,
    workoutCount: 1,
    workoutOutdoor: false,
    caloriesMin: '',
    caloriesMax: '',
    proteinMin: '',
    waterTarget: 128,
    stepsTarget: 10000,
    sleepMin: 7,
    readingPages: 10,
    meditationMinutes: 10,
    customLabel: '',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChallengeBuilderScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { createCustomChallenge, isLoading } = useChallengeStore();

  // Form state
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>('intermediate');
  const [restartOnFailure, setRestartOnFailure] = useState(false);
  const [creating, setCreating] = useState(false);

  // Task states — keyed by ChallengeTaskType
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>(() => {
    const initial: Record<string, TaskState> = {};
    for (const def of TASK_DEFINITIONS) {
      initial[def.type] = createDefaultTaskState();
    }
    return initial;
  });

  // ---------------------------------------------------------------------------
  // Task state helpers
  // ---------------------------------------------------------------------------

  const updateTaskState = useCallback(
    (type: string, partial: Partial<TaskState>) => {
      setTaskStates((prev) => {
        const current = prev[type] ?? createDefaultTaskState();
        const updated: TaskState = { ...current, ...partial } as TaskState;
        const next: Record<string, TaskState> = { ...prev, [type]: updated };
        return next;
      });
    },
    [],
  );

  const toggleTask = useCallback(
    (type: string) => {
      setTaskStates((prev) => {
        const current = prev[type] ?? createDefaultTaskState();
        const updated: TaskState = { ...current, enabled: !current.enabled };
        const next: Record<string, TaskState> = { ...prev, [type]: updated };
        return next;
      });
    },
    [],
  );

  const enabledTaskCount = Object.values(taskStates).filter((s) => s.enabled).length;

  // ---------------------------------------------------------------------------
  // Build task array from state
  // ---------------------------------------------------------------------------

  const buildTasks = useCallback((): ChallengeTask[] => {
    const tasks: ChallengeTask[] = [];
    const now = Date.now();

    for (const def of TASK_DEFINITIONS) {
      const state: TaskState = taskStates[def.type] ?? createDefaultTaskState();
      if (!state.enabled) continue;

      const config: Record<string, unknown> = {};

      switch (def.type) {
        case 'workout':
          config.min_duration_minutes = state.workoutDuration;
          config.min_count = state.workoutCount;
          config.outdoor_required = state.workoutOutdoor;
          break;
        case 'calories':
          if (state.caloriesMin) config.min_calories = parseInt(state.caloriesMin, 10);
          if (state.caloriesMax) config.max_calories = parseInt(state.caloriesMax, 10);
          break;
        case 'protein':
          if (state.proteinMin) config.min_grams = parseInt(state.proteinMin, 10);
          break;
        case 'water':
          config.target_oz = state.waterTarget;
          break;
        case 'steps':
          config.target_steps = state.stepsTarget;
          break;
        case 'sleep':
          config.min_hours = state.sleepMin;
          break;
        case 'reading':
          config.target_pages = state.readingPages;
          break;
        case 'meditation':
          config.min_minutes = state.meditationMinutes;
          break;
        case 'custom':
          config.custom_label = state.customLabel || 'Custom Task';
          break;
      }

      const label =
        def.type === 'custom'
          ? state.customLabel || 'Custom Task'
          : def.label;

      tasks.push({
        id: `${def.type}_${now}`,
        label,
        type: def.type,
        auto_verify: def.auto_verify,
        config,
      });
    }

    return tasks;
  }, [taskStates]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = useCallback((): string | null => {
    if (!name.trim()) return 'Please enter a challenge name.';
    if (enabledTaskCount === 0) return 'Enable at least one daily task.';

    // Validate calories fields if enabled
    const caloriesState = taskStates.calories ?? createDefaultTaskState();
    if (caloriesState.enabled) {
      const minCal = parseInt(caloriesState.caloriesMin, 10);
      const maxCal = parseInt(caloriesState.caloriesMax, 10);
      if (caloriesState.caloriesMin && isNaN(minCal)) {
        return 'Calories minimum must be a number.';
      }
      if (caloriesState.caloriesMax && isNaN(maxCal)) {
        return 'Calories maximum must be a number.';
      }
      if (!isNaN(minCal) && !isNaN(maxCal) && minCal > maxCal) {
        return 'Calories minimum cannot exceed maximum.';
      }
    }

    // Validate protein field if enabled
    const proteinState = taskStates.protein ?? createDefaultTaskState();
    if (proteinState.enabled && proteinState.proteinMin) {
      const val = parseInt(proteinState.proteinMin, 10);
      if (isNaN(val) || val <= 0) return 'Protein target must be a positive number.';
    }

    // Validate custom task label
    const customState = taskStates.custom ?? createDefaultTaskState();
    if (customState.enabled && !customState.customLabel.trim()) {
      return 'Please enter a label for your custom task.';
    }

    return null;
  }, [name, enabledTaskCount, taskStates]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleCreate = useCallback(async () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not Signed In', 'Please sign in to create a challenge.');
        setCreating(false);
        return;
      }

      const tasks = buildTasks();

      await createCustomChallenge(user.id, {
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `Custom ${duration}-day challenge with ${tasks.length} daily task${tasks.length !== 1 ? 's' : ''}.`,
        category: 'custom',
        difficulty,
        duration_days: duration,
        rules: {
          tasks,
          restart_on_failure: restartOnFailure,
        },
        restart_on_failure: restartOnFailure,
        is_system: false,
        created_by: user.id,
        icon: '\uD83D\uDEE0\uFE0F',
      });

      router.push('/(tabs)/goals/challenges');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create challenge. Please try again.';
      Alert.alert('Creation Failed', message);
    } finally {
      setCreating(false);
    }
  }, [validate, buildTasks, createCustomChallenge, name, duration, difficulty, restartOnFailure, router]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderTaskConfig = (def: TaskConfig, state: TaskState) => {
    if (!state.enabled || !def.hasConfig) return null;

    switch (def.type) {
      case 'workout':
        return (
          <View style={{ marginTop: spacing.md }}>
            <Slider
              label="Min Duration (minutes)"
              value={state.workoutDuration}
              onValueChange={(v) => updateTaskState('workout', { workoutDuration: v })}
              min={15}
              max={120}
              step={5}
            />
            <View style={{ marginTop: spacing.md }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
                Min Workouts Per Day
              </Text>
              <View style={[styles.chipRow, { gap: spacing.sm }]}>
                {[1, 2, 3].map((count) => (
                  <Chip
                    key={count}
                    label={`${count}`}
                    selected={state.workoutCount === count}
                    onPress={() => updateTaskState('workout', { workoutCount: count })}
                  />
                ))}
              </View>
            </View>
            <Toggle
              label="Outdoor requirement"
              value={state.workoutOutdoor}
              onValueChange={(v) => updateTaskState('workout', { workoutOutdoor: v })}
              style={{ marginTop: spacing.md }}
            />
          </View>
        );

      case 'calories':
        return (
          <View style={{ marginTop: spacing.md }}>
            <Input
              label="Min Calories"
              value={state.caloriesMin}
              onChangeText={(v) => updateTaskState('calories', { caloriesMin: v })}
              placeholder="e.g. 1500"
              keyboardType="number-pad"
              containerStyle={{ marginBottom: spacing.md }}
            />
            <Input
              label="Max Calories"
              value={state.caloriesMax}
              onChangeText={(v) => updateTaskState('calories', { caloriesMax: v })}
              placeholder="e.g. 2500"
              keyboardType="number-pad"
            />
          </View>
        );

      case 'protein':
        return (
          <View style={{ marginTop: spacing.md }}>
            <Input
              label="Min Protein (grams)"
              value={state.proteinMin}
              onChangeText={(v) => updateTaskState('protein', { proteinMin: v })}
              placeholder="e.g. 150"
              keyboardType="number-pad"
            />
          </View>
        );

      case 'water':
        return (
          <View style={{ marginTop: spacing.md }}>
            <Slider
              label="Target (oz)"
              value={state.waterTarget}
              onValueChange={(v) => updateTaskState('water', { waterTarget: v })}
              min={32}
              max={200}
              step={4}
            />
          </View>
        );

      case 'steps':
        return (
          <View style={{ marginTop: spacing.md }}>
            <Slider
              label="Target Steps"
              value={state.stepsTarget}
              onValueChange={(v) => updateTaskState('steps', { stepsTarget: v })}
              min={2000}
              max={20000}
              step={1000}
            />
          </View>
        );

      case 'sleep':
        return (
          <View style={{ marginTop: spacing.md }}>
            <Slider
              label="Min Hours"
              value={state.sleepMin}
              onValueChange={(v) => updateTaskState('sleep', { sleepMin: v })}
              min={4}
              max={10}
              step={0.5}
            />
          </View>
        );

      case 'reading':
        return (
          <View style={{ marginTop: spacing.md }}>
            <Slider
              label="Min Pages"
              value={state.readingPages}
              onValueChange={(v) => updateTaskState('reading', { readingPages: v })}
              min={1}
              max={50}
              step={1}
            />
          </View>
        );

      case 'meditation':
        return (
          <View style={{ marginTop: spacing.md }}>
            <Slider
              label="Min Minutes"
              value={state.meditationMinutes}
              onValueChange={(v) => updateTaskState('meditation', { meditationMinutes: v })}
              min={1}
              max={60}
              step={1}
            />
          </View>
        );

      case 'custom':
        return (
          <View style={{ marginTop: spacing.md }}>
            <Input
              label="Task Label"
              value={state.customLabel}
              onChangeText={(v) => updateTaskState('custom', { customLabel: v })}
              placeholder="e.g. Cold shower for 2 min"
            />
          </View>
        );

      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ----------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <Text style={{ fontSize: 48 }}>{'\uD83D\uDEE0\uFE0F'}</Text>
            <Text
              style={[
                typography.h2,
                { color: colors.text.primary, marginTop: spacing.sm, textAlign: 'center' },
              ]}
            >
              Custom Challenge Builder
            </Text>
            <Text
              style={[
                typography.caption,
                { color: colors.text.secondary, marginTop: spacing.xs, textAlign: 'center' },
              ]}
            >
              Design your own challenge with custom rules and daily tasks.
            </Text>
          </View>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Challenge Name                                                    */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(150)}>
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.bodyBold, { color: colors.text.primary, marginBottom: spacing.sm }]}>
              Challenge Name
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g. My 30-Day Beast Mode"
              maxLength={60}
            />
          </Card>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Duration Picker                                                   */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.bodyBold, { color: colors.text.primary, marginBottom: spacing.sm }]}>
              Duration
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {DURATION_OPTIONS.map((d) => (
                <Chip
                  key={d}
                  label={`${d} days`}
                  selected={duration === d}
                  onPress={() => setDuration(d)}
                />
              ))}
            </ScrollView>
          </Card>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Daily Tasks                                                       */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
            <Text style={[typography.h3, { color: colors.text.primary }]}>
              Daily Tasks
            </Text>
            <Badge
              label={`${enabledTaskCount} selected`}
              variant={enabledTaskCount > 0 ? 'success' : 'info'}
              size="sm"
            />
          </View>

          {TASK_DEFINITIONS.map((def, index) => {
            const state = taskStates[def.type] ?? createDefaultTaskState();
            return (
              <Animated.View
                key={def.type}
                entering={FadeInDown.delay(350 + index * 30)}
              >
                <Card style={{ marginBottom: spacing.md }}>
                  {/* Task toggle header */}
                  <View style={styles.taskToggleRow}>
                    <Text style={{ fontSize: 22, marginRight: spacing.sm }}>
                      {def.icon}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                        {def.label}
                      </Text>
                      {!def.auto_verify && def.type !== 'custom' && (
                        <Text style={[typography.tiny, { color: colors.text.muted }]}>
                          Manual verification
                        </Text>
                      )}
                      {def.auto_verify && (
                        <Text style={[typography.tiny, { color: colors.accent.success ?? colors.text.muted }]}>
                          Auto-verified
                        </Text>
                      )}
                    </View>
                    <Toggle
                      value={state.enabled}
                      onValueChange={() => toggleTask(def.type)}
                    />
                  </View>

                  {/* Expanded config */}
                  {renderTaskConfig(def, state)}
                </Card>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Restart Rule                                                      */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(750)}>
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.bodyBold, { color: colors.text.primary, marginBottom: spacing.xs }]}>
              Failure Rule
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.md }]}>
              Choose what happens when you miss a day.
            </Text>
            <Toggle
              label={
                restartOnFailure
                  ? 'Reset on failure (75 Hard style)'
                  : 'Track consistency percentage'
              }
              value={restartOnFailure}
              onValueChange={setRestartOnFailure}
            />
            {restartOnFailure && (
              <View
                style={[
                  styles.warningBanner,
                  {
                    backgroundColor: `${colors.accent.fire ?? '#FF6B35'}15`,
                    borderRadius: borderRadius.sm,
                    padding: spacing.sm,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: colors.accent.fire ?? '#FF6B35' }]}>
                  {'\u26A0\uFE0F'} Missing any task resets your challenge to Day 1. No exceptions.
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Difficulty                                                        */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(800)}>
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.bodyBold, { color: colors.text.primary, marginBottom: spacing.sm }]}>
              Difficulty
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {DIFFICULTY_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={difficulty === opt.value}
                  onPress={() => setDifficulty(opt.value)}
                />
              ))}
            </ScrollView>
          </Card>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Summary                                                           */}
        {/* ----------------------------------------------------------------- */}
        {enabledTaskCount > 0 && (
          <Animated.View entering={FadeInDown.delay(850)}>
            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.bodyBold, { color: colors.text.primary, marginBottom: spacing.sm }]}>
                Summary
              </Text>
              <View style={[styles.summaryRow, { marginBottom: spacing.xs }]}>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  Duration
                </Text>
                <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                  {duration} days
                </Text>
              </View>
              <View style={[styles.summaryRow, { marginBottom: spacing.xs }]}>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  Daily Tasks
                </Text>
                <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                  {enabledTaskCount}
                </Text>
              </View>
              <View style={[styles.summaryRow, { marginBottom: spacing.xs }]}>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  Difficulty
                </Text>
                <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                  {DIFFICULTY_OPTIONS.find((o) => o.value === difficulty)?.label}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  Failure Rule
                </Text>
                <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                  {restartOnFailure ? 'Full Reset' : 'Consistency %'}
                </Text>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Create Button                                                     */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(900)}>
          <Button
            title={creating ? 'Creating...' : 'Create Challenge'}
            onPress={handleCreate}
            fullWidth
            disabled={creating || isLoading}
          />
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  taskToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningBanner: {},
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
