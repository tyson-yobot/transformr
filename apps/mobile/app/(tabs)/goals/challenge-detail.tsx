// =============================================================================
// TRANSFORMR -- Challenge Detail / Enrollment Screen
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Chip } from '@components/ui/Chip';
import { Modal } from '@components/ui/Modal';
import { DetailSkeleton } from '@components/ui/ScreenSkeleton';
import { useChallengeStore } from '@stores/challengeStore';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { supabase } from '@services/supabase';
import type {
  ChallengeDefinition,
  ChallengeTask,
  ChallengeDifficulty,
} from '@app-types/database';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIFFICULTY_VARIANTS: Record<ChallengeDifficulty, 'success' | 'warning' | 'danger' | 'info'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
  extreme: 'info',
};

const DIFFICULTY_LABELS: Record<ChallengeDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  extreme: 'Extreme',
};

const CATEGORY_LABELS: Record<string, string> = {
  mental_toughness: 'Mental Toughness',
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  running: 'Running',
  strength: 'Strength',
  lifestyle: 'Lifestyle',
  custom: 'Custom',
};

const DIET_OPTIONS = ['Keto', 'Paleo', 'Clean Eating', 'Vegan', 'Custom'];
const IF_PROTOCOL_OPTIONS = ['16:8', '18:6', '20:4', '5:2'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Determine whether this challenge needs a diet configuration picker. */
function needsDietPicker(definition: ChallengeDefinition): boolean {
  const slug = definition.slug?.toLowerCase() ?? '';
  const name = definition.name?.toLowerCase() ?? '';
  // 75 Hard, 75 Medium, 75 Soft — any challenge requiring a diet selection
  return (
    slug.includes('75') ||
    name.includes('75 hard') ||
    name.includes('75 medium') ||
    name.includes('75 soft') ||
    definition.rules?.tasks?.some((t) => t.type === 'nutrition' && t.label?.toLowerCase().includes('diet')) === true
  );
}

/** Determine whether this challenge needs an IF protocol picker. */
function needsProtocolPicker(definition: ChallengeDefinition): boolean {
  const slug = definition.slug?.toLowerCase() ?? '';
  const name = definition.name?.toLowerCase() ?? '';
  return (
    slug.includes('intermittent') ||
    slug.includes('fasting') ||
    name.includes('if challenge') ||
    name.includes('intermittent fasting') ||
    definition.rules?.fasting_protocol !== undefined
  );
}

/** Determine whether this is a Sober Month / no-alcohol challenge. */
function needsSavingsInput(definition: ChallengeDefinition): boolean {
  const slug = definition.slug?.toLowerCase() ?? '';
  const name = definition.name?.toLowerCase() ?? '';
  return (
    slug.includes('sober') ||
    slug.includes('dry') ||
    name.includes('sober') ||
    name.includes('dry')
  );
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChallengeDetailScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    challengeDefinitions,
    enrollInChallenge,
    fetchChallengeDefinitions,
    isLoading,
  } = useChallengeStore();

  // Fetch definitions if store is empty
  useEffect(() => {
    if (challengeDefinitions.length === 0) {
      fetchChallengeDefinitions();
    }
  }, [challengeDefinitions.length, fetchChallengeDefinitions]);

  // Resolve the matching challenge definition
  const definition = useMemo<ChallengeDefinition | null>(
    () => challengeDefinitions.find((d) => d.id === id) ?? null,
    [challengeDefinitions, id],
  );

  // ---- Configuration State ----
  const [selectedDiet, setSelectedDiet] = useState(2); // default: Clean Eating
  const [selectedProtocol, setSelectedProtocol] = useState(0); // default: 16:8
  const [weeklyAlcoholSpend, setWeeklyAlcoholSpend] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  // ---- Derived flags ----
  const showDiet = definition ? needsDietPicker(definition) : false;
  const showProtocol = definition ? needsProtocolPicker(definition) : false;
  const showSavings = definition ? needsSavingsInput(definition) : false;
  const hasConfig = showDiet || showProtocol || showSavings;

  // ---- Computed savings ----
  const estimatedSavings = useMemo(() => {
    const weekly = parseFloat(weeklyAlcoholSpend);
    if (isNaN(weekly) || weekly <= 0 || !definition) return null;
    const weeks = Math.ceil(definition.duration_days / 7);
    return (weekly * weeks).toFixed(2);
  }, [weeklyAlcoholSpend, definition]);

  // ---- Enrollment handler ----
  const handleStartChallenge = useCallback(async () => {
    if (!definition) return;

    setEnrolling(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not Signed In', 'Please sign in to start a challenge.');
        setEnrolling(false);
        return;
      }

      // Build configuration object
      const config: Record<string, unknown> = {};
      if (showDiet) {
        config.diet = DIET_OPTIONS[selectedDiet];
      }
      if (showProtocol) {
        config.fasting_protocol = IF_PROTOCOL_OPTIONS[selectedProtocol];
      }
      if (showSavings && weeklyAlcoholSpend) {
        config.weekly_alcohol_spend = parseFloat(weeklyAlcoholSpend);
      }

      await enrollInChallenge(user.id, definition.id, config);
      hapticSuccess();
      router.push('/(tabs)/goals/challenge-active' as `/${string}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to enroll. Please try again.';
      Alert.alert('Enrollment Failed', message);
    } finally {
      setEnrolling(false);
    }
  }, [
    definition,
    enrollInChallenge,
    router,
    selectedDiet,
    selectedProtocol,
    showDiet,
    showProtocol,
    showSavings,
    weeklyAlcoholSpend,
  ]);

  // ---- Loading / Not Found ----
  if (isLoading && !definition) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <DetailSkeleton />
      </View>
    );
  }

  if (!definition) {
    return (
      <View
        style={[
          styles.screen,
          styles.centeredFallback,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <Text style={[typography.h3, { color: colors.text.primary }]}>
          Challenge not found
        </Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  const tasks: ChallengeTask[] = definition.rules?.tasks ?? [];
  const difficulty = definition.difficulty ?? 'intermediate';
  const category = definition.category ?? 'custom';

  // Collect special rule notes
  const ruleNotes: string[] = [];
  if (definition.rules?.restart_on_failure || definition.restart_on_failure) {
    ruleNotes.push('If you miss any task, the challenge resets to Day 1.');
  }
  if (definition.rules?.rest_days_per_week !== undefined) {
    ruleNotes.push(
      `You are allowed ${definition.rules.rest_days_per_week} rest day${definition.rules.rest_days_per_week !== 1 ? 's' : ''} per week.`,
    );
  }
  if (definition.rules?.elimination_list && definition.rules.elimination_list.length > 0) {
    ruleNotes.push(
      `Eliminate: ${definition.rules.elimination_list.join(', ')}.`,
    );
  }
  // Surface any 75 Hard-specific rules from task configs
  for (const task of tasks) {
    if (task.config?.outdoor_required === true) {
      ruleNotes.push('At least one workout must be performed outdoors.');
    }
    if (task.config?.no_alcohol === true) {
      ruleNotes.push('No alcohol consumption for the duration of the challenge.');
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ----------------------------------------------------------------- */}
        {/* Hero Section                                                      */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={[styles.hero, { alignItems: 'center', marginBottom: spacing.lg }]}>
            <Text style={{ fontSize: 56 }}>{definition.icon ?? '\uD83C\uDFC6'}</Text>
            <Text
              style={[
                typography.h2,
                { color: colors.text.primary, marginTop: spacing.md, textAlign: 'center' },
              ]}
            >
              {definition.name}
            </Text>
            <View style={[styles.badgeRow, { marginTop: spacing.sm, gap: spacing.sm }]}>
              <Badge
                label={`${definition.duration_days} days`}
                variant="info"
                size="sm"
              />
              <Badge
                label={DIFFICULTY_LABELS[difficulty]}
                variant={DIFFICULTY_VARIANTS[difficulty]}
                size="sm"
              />
              <Badge
                label={CATEGORY_LABELS[category] ?? category}
                variant="info"
                size="sm"
              />
            </View>
            {definition.estimated_daily_time_minutes != null && (
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.secondary, marginTop: spacing.sm },
                ]}
              >
                Estimated daily time: {formatMinutes(definition.estimated_daily_time_minutes)}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Description                                                       */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
              About This Challenge
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.sm },
              ]}
            >
              {definition.description ?? 'No description available.'}
            </Text>
          </Card>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Restart Warning                                                   */}
        {/* ----------------------------------------------------------------- */}
        {(definition.restart_on_failure || definition.rules?.restart_on_failure) && (
          <Animated.View entering={FadeInDown.delay(250)}>
            <Card
              style={{
                marginBottom: spacing.lg,
                borderWidth: 1,
                borderColor: colors.accent.fire,
              }}
            >
              <View style={styles.warningRow}>
                <Text style={{ fontSize: 20, marginRight: spacing.sm }}>
                  {'\u26A0\uFE0F'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.accent.fire }]}>
                    Zero Tolerance
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.text.secondary, marginTop: 2 },
                    ]}
                  >
                    This challenge resets to Day 1 if you miss any task. No exceptions.
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Daily Requirements                                                */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, marginBottom: spacing.md },
            ]}
          >
            Daily Requirements
          </Text>

          {tasks.length === 0 && (
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={[typography.body, { color: colors.text.secondary }]}>
                No specific daily tasks defined for this challenge.
              </Text>
            </Card>
          )}

          {tasks.map((task, index) => (
            <Card key={task.id} style={{ marginBottom: spacing.md }}>
              <View style={styles.taskHeader}>
                <View
                  style={[
                    styles.taskNumber,
                    {
                      backgroundColor: colors.accent.primary,
                      borderRadius: borderRadius.full,
                      width: 28,
                      height: 28,
                    },
                  ]}
                >
                  <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                    {task.label}
                  </Text>

                  {/* Task-specific config details */}
                  {task.config?.min_duration_minutes != null && (
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.text.secondary, marginTop: 2 },
                      ]}
                    >
                      Minimum {String(task.config.min_duration_minutes)} minutes
                    </Text>
                  )}
                  {task.config?.target_pages != null && (
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.text.secondary, marginTop: 2 },
                      ]}
                    >
                      {String(task.config.target_pages)} pages required
                    </Text>
                  )}
                  {task.config?.target_oz != null && (
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.text.secondary, marginTop: 2 },
                      ]}
                    >
                      Target: {String(task.config.target_oz)} oz
                    </Text>
                  )}
                  {task.config?.min_count != null && (
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.text.secondary, marginTop: 2 },
                      ]}
                    >
                      Minimum {String(task.config.min_count)} required
                    </Text>
                  )}
                </View>
              </View>

              {/* Verification badge */}
              <View
                style={[
                  styles.verificationBadge,
                  {
                    backgroundColor: task.auto_verify
                      ? `${colors.accent.success}15`
                      : `${colors.text.secondary}15`,
                    borderRadius: borderRadius.sm,
                    padding: spacing.xs,
                    paddingHorizontal: spacing.sm,
                    marginTop: spacing.sm,
                    alignSelf: 'flex-start',
                  },
                ]}
              >
                <Text
                  style={[
                    typography.tiny,
                    {
                      color: task.auto_verify
                        ? colors.accent.success
                        : colors.text.secondary,
                    },
                  ]}
                >
                  {task.auto_verify ? '\u2705 Auto-verified' : '\u270B Manual'}
                </Text>
              </View>
            </Card>
          ))}
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Challenge Rules                                                   */}
        {/* ----------------------------------------------------------------- */}
        {ruleNotes.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text
              style={[
                typography.h3,
                {
                  color: colors.text.primary,
                  marginTop: spacing.md,
                  marginBottom: spacing.md,
                },
              ]}
            >
              Challenge Rules
            </Text>
            <Card style={{ marginBottom: spacing.lg }}>
              {ruleNotes.map((note, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.ruleItem,
                    { marginTop: idx > 0 ? spacing.sm : 0 },
                  ]}
                >
                  <Text style={[typography.body, { color: colors.text.secondary }]}>
                    {'\u2022'} {note}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Configuration Section                                             */}
        {/* ----------------------------------------------------------------- */}
        {hasConfig && (
          <Animated.View entering={FadeInDown.delay(500)}>
            <Text
              style={[
                typography.h3,
                {
                  color: colors.text.primary,
                  marginTop: spacing.md,
                  marginBottom: spacing.md,
                },
              ]}
            >
              Configuration
            </Text>

            {/* Diet Picker */}
            {showDiet && (
              <Card style={{ marginBottom: spacing.md }}>
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.text.primary, marginBottom: spacing.sm },
                  ]}
                >
                  Diet Plan
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text.secondary, marginBottom: spacing.md },
                  ]}
                >
                  Choose the diet you will follow for the entire challenge duration. No cheat meals allowed.
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.sm }}
                >
                  {DIET_OPTIONS.map((option, oi) => (
                    <Chip
                      key={option}
                      label={option}
                      selected={selectedDiet === oi}
                      onPress={() => setSelectedDiet(oi)}
                    />
                  ))}
                </ScrollView>
              </Card>
            )}

            {/* IF Protocol Picker */}
            {showProtocol && (
              <Card style={{ marginBottom: spacing.md }}>
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.text.primary, marginBottom: spacing.sm },
                  ]}
                >
                  Fasting Protocol
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text.secondary, marginBottom: spacing.md },
                  ]}
                >
                  Select your fasting/eating window ratio. Start with 16:8 if you are new to intermittent fasting.
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.sm }}
                >
                  {IF_PROTOCOL_OPTIONS.map((option, oi) => (
                    <Chip
                      key={option}
                      label={option}
                      selected={selectedProtocol === oi}
                      onPress={() => setSelectedProtocol(oi)}
                    />
                  ))}
                </ScrollView>
              </Card>
            )}

            {/* Sober Month Savings Calculator */}
            {showSavings && (
              <Card style={{ marginBottom: spacing.md }}>
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.text.primary, marginBottom: spacing.sm },
                  ]}
                >
                  Savings Calculator
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text.secondary, marginBottom: spacing.md },
                  ]}
                >
                  Enter your typical weekly alcohol spend to see how much you will save.
                </Text>
                <View style={styles.savingsInputRow}>
                  <Text
                    style={[
                      typography.bodyBold,
                      { color: colors.text.primary, marginRight: spacing.xs },
                    ]}
                  >
                    $
                  </Text>
                  <TextInput
                    value={weeklyAlcoholSpend}
                    onChangeText={setWeeklyAlcoholSpend}
                    placeholder="0.00"
                    placeholderTextColor={colors.text.secondary}
                    keyboardType="decimal-pad"
                    style={[
                      typography.body,
                      {
                        flex: 1,
                        color: colors.text.primary,
                        borderWidth: 1,
                        borderColor: colors.border.default,
                        borderRadius: borderRadius.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.text.secondary, marginLeft: spacing.sm },
                    ]}
                  >
                    / week
                  </Text>
                </View>
                {estimatedSavings !== null && (
                  <View
                    style={[
                      styles.savingsResult,
                      {
                        backgroundColor: `${colors.accent.success}15`,
                        borderRadius: borderRadius.sm,
                        padding: spacing.md,
                        marginTop: spacing.md,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.bodyBold,
                        { color: colors.accent.success, textAlign: 'center' },
                      ]}
                    >
                      You will save approximately <Text style={typography.monoBody}>${estimatedSavings}</Text>
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: colors.accent.success,
                          textAlign: 'center',
                          marginTop: 2,
                        },
                      ]}
                    >
                      over {definition.duration_days} days
                    </Text>
                  </View>
                )}
              </Card>
            )}
          </Animated.View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Partner Invite                                                    */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <Card style={{ marginBottom: spacing.md }}>
            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                  {'\uD83D\uDC65'} Invite a Partner
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text.secondary, marginTop: 2 },
                  ]}
                >
                  Challenge a friend or partner for mutual accountability.
                </Text>
              </View>
              <Button
                title="Invite"
                size="sm"
                onPress={() => { hapticLight(); setShowPartnerModal(true); }}
                accessibilityLabel="Invite a partner to this challenge"
              />
            </View>
          </Card>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Stake Option                                                      */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(650)}>
          <Card style={{ marginBottom: spacing.md }}>
            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                  {'\uD83D\uDCB0'} Stake This Challenge
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text.secondary, marginTop: 2 },
                  ]}
                >
                  Put money on the line. Lose your stake if you fail.
                </Text>
              </View>
              <Button
                title="Stake"
                size="sm"
                onPress={() => {
                  hapticLight();
                  router.push('/(tabs)/goals/stake-goals' as `/${string}`);
                }}
                accessibilityLabel="Stake money on this challenge"
              />
            </View>
          </Card>
        </Animated.View>

        {/* ----------------------------------------------------------------- */}
        {/* Start Challenge Button                                            */}
        {/* ----------------------------------------------------------------- */}
        <Animated.View entering={FadeInDown.delay(750)}>
          <Button
            title={enrolling ? 'Starting...' : 'Start Challenge'}
            onPress={handleStartChallenge}
            fullWidth
            disabled={enrolling}
            style={{ marginTop: spacing.lg }}
          />
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ------------------------------------------------------------------- */}
      {/* Partner Invite Modal                                                 */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        visible={showPartnerModal}
        onDismiss={() => setShowPartnerModal(false)}
        title="Invite a Partner"
      >
        <Text style={[typography.body, { color: colors.text.secondary }]}>
          Share your challenge invite link with a friend or partner. They will be
          able to join the same challenge, and you can track each other's progress.
        </Text>
        <Button
          title="Copy Invite Link"
          onPress={() => {
            hapticSuccess();
            setShowPartnerModal(false);
          }}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
        <Button
          title="Share via Message"
          onPress={() => setShowPartnerModal(false)}
          fullWidth
          style={{ marginTop: spacing.md }}
        />
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  centeredFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {},
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskNumber: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationBadge: {},
  ruleItem: {},
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savingsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsResult: {},
});
