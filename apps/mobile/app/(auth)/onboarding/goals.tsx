// =============================================================================
// TRANSFORMR -- Onboarding: Goals
// =============================================================================

import { useState, useCallback, type ComponentType } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { OnboardingBackground } from '@components/ui/OnboardingBackground';
import { hapticLight } from '@utils/haptics';
import { formatDateInput, dateInputToISO } from '@utils/formatters';
import type { GoalCategory } from '@app-types/common';
import { useGoalStore } from '@stores/goalStore';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;

const HERO_URL = 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1200&q=80';
const BLUR_HASH = 'LBGayq~q~qj[~qj[WBofj[j[M{ay';

interface GoalOption {
  category: GoalCategory;
  label: string;
  icon: string;
  description: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  { category: 'fitness', label: 'Fitness', icon: '\uD83D\uDCAA', description: 'Build strength and endurance' },
  { category: 'nutrition', label: 'Nutrition', icon: '\uD83E\uDD57', description: 'Optimize your diet' },
  { category: 'business', label: 'Business', icon: '\uD83D\uDCBC', description: 'Grow your revenue' },
  { category: 'financial', label: 'Financial', icon: '\uD83D\uDCB0', description: 'Build wealth' },
  { category: 'health', label: 'Health', icon: '\u2764\uFE0F', description: 'Improve overall health' },
  { category: 'personal', label: 'Personal', icon: '\uD83C\uDFAF', description: 'Personal development' },
  { category: 'education', label: 'Learning', icon: '\uD83D\uDCDA', description: 'Acquire new skills' },
  { category: 'mindset', label: 'Mindset', icon: '\uD83E\uDDE0', description: 'Mental resilience' },
  { category: 'relationship', label: 'Relationship', icon: '\uD83D\uDC9C', description: 'Strengthen bonds' },
];

export default function GoalsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createGoal = useGoalStore((s) => s.createGoal);

  const [selectedGoals, setSelectedGoals] = useState<GoalCategory[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState<GoalCategory | null>(null);
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState('');

  const toggleGoal = useCallback((category: GoalCategory) => {
    setSelectedGoals((prev) => {
      if (prev.includes(category)) {
        const updated = prev.filter((g) => g !== category);
        // Clear primary if it was removed
        if (primaryGoal === category) setPrimaryGoal(null);
        return updated;
      }
      return [...prev, category];
    });
    setError('');
  }, [primaryGoal]);

  const handleContinue = useCallback(async () => {
    if (selectedGoals.length === 0) {
      setError('Select at least one goal category');
      return;
    }
    if (!primaryGoal) {
      setError('Tap a selected goal again to set it as your primary goal');
      return;
    }
    // Persist each selected goal — primary goal first with priority 10
    try {
      await Promise.allSettled(
        selectedGoals.map((category) =>
          createGoal({
            title: GOAL_OPTIONS.find((g) => g.category === category)?.label ?? category,
            category,
            goal_type: 'habit',
            priority: category === primaryGoal ? 10 : 5,
            target_date: dateInputToISO(targetDate) || undefined,
          }),
        ),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save goals. Please try again.');
      return;
    }
    router.push('/(auth)/onboarding/fitness');
  }, [selectedGoals, primaryGoal, targetDate, createGoal, router]);

  return (
    <OnboardingBackground imageUrl={HERO_URL} blurHash={BLUR_HASH} localSource={require('@assets/images/hero-goals.jpg')}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon + Headline */}
        <View style={styles.heroSection}>
          <Image
            source={require('@assets/icons/transformr-icon.png')}
            style={styles.icon}
            contentFit="contain"
          />
          <Text style={styles.headline}>Dream big.{'\n'}Then build a plan.</Text>
          <Text style={styles.subheadline}>
            What does your life look like 12 months from now if everything went right? Pick every area you want to win in.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>

          {/* Goal Cards */}
          <View style={styles.grid}>
            {GOAL_OPTIONS.map((goal) => {
              const isSelected = selectedGoals.includes(goal.category);
              const isPrimary = primaryGoal === goal.category;
              return (
                <Pressable
                  key={goal.category}
                  onPress={() => {
                    hapticLight();
                    if (isSelected) {
                      // If already selected, set as primary or deselect
                      if (isPrimary) {
                        // Deselect entirely
                        toggleGoal(goal.category);
                      } else {
                        setPrimaryGoal(goal.category);
                      }
                    } else {
                      toggleGoal(goal.category);
                    }
                  }}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: isSelected
                        ? colors.accent.primary + (isPrimary ? '30' : '15')
                        : colors.background.secondary,
                      borderRadius: borderRadius.lg,
                      padding: spacing.lg,
                      marginBottom: spacing.md,
                      borderWidth: isPrimary ? 2 : 1,
                      borderColor: isPrimary
                        ? colors.accent.primary
                        : isSelected
                          ? colors.accent.primary + '60'
                          : colors.border.default,
                    },
                  ]}
                >
                  <View style={styles.goalCardContent}>
                    <Text style={{ fontSize: 28 }}>{goal.icon}</Text>
                    <View style={[styles.goalTextCol, { marginLeft: spacing.md }]}>
                      <View style={styles.goalLabelRow}>
                        <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                          {goal.label}
                        </Text>
                        {isPrimary && (
                          <View
                            style={[
                              styles.primaryBadge,
                              {
                                backgroundColor: colors.accent.primary,
                                borderRadius: borderRadius.full,
                                paddingHorizontal: spacing.sm,
                                paddingVertical: 2,
                                marginLeft: spacing.sm,
                              },
                            ]}
                          >
                            <Text style={[typography.tiny, { color: colors.text.inverse }]}>PRIMARY</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]}>
                        {goal.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Text style={{ fontSize: 16, color: colors.accent.primary, marginLeft: spacing.sm }}>
                        {'\u2713'}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Target Date */}
          <Input
            label="When do you want to get there? (optional)"
            placeholder="MM/DD/YYYY"
            value={targetDate}
            onChangeText={(t) => setTargetDate(formatDateInput(t))}
            keyboardType="number-pad"
            maxLength={10}
            containerStyle={{ marginTop: spacing.lg, marginBottom: spacing.xxl }}
          />

          {/* Error */}
          {error ? (
            <Text style={[typography.caption, { color: colors.accent.danger, marginBottom: spacing.md, textAlign: 'center' }]}>
              {error}
            </Text>
          ) : null}

          {/* Continue */}
          <Button
            title="Continue"
            onPress={handleContinue}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {},
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  icon: { width: 56, height: 56, marginBottom: 12 },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F0F0FC' /* brand-ok */,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 34,
  },
  subheadline: {
    fontSize: 15,
    color: 'rgba(240, 240, 252, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: { paddingHorizontal: 24 },
  grid: {},
  goalCard: {},
  goalCardContent: { flexDirection: 'row', alignItems: 'center' },
  goalTextCol: { flex: 1 },
  goalLabelRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBadge: {},
});
