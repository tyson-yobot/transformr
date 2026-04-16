// =============================================================================
// TRANSFORMR -- Onboarding: Goals
// =============================================================================

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { hapticLight } from '@utils/haptics';
import type { GoalCategory } from '@app-types/common';
import { OnboardingHero } from '@components/onboarding/OnboardingHero';
import { useGoalStore } from '@stores/goalStore';

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
    await Promise.all(
      selectedGoals.map((category) =>
        createGoal({
          title: GOAL_OPTIONS.find((g) => g.category === category)?.label ?? category,
          category,
          goal_type: 'habit',
          priority: category === primaryGoal ? 10 : 5,
          target_date: targetDate || undefined,
        }),
      ),
    );
    router.push('/(auth)/onboarding/fitness');
  }, [selectedGoals, primaryGoal, targetDate, createGoal, router]);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <OnboardingHero
        imageUri="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80"
        heading="Dream big. Then build a plan."
        subheading="What does your life look like 12 months from now if everything went right? We'll help you get there."
        style={{ marginBottom: spacing.xl }}
      />
      <View style={{ paddingHorizontal: spacing.xxl }}>

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
        label="Target Date (optional)"
        placeholder="YYYY-MM-DD"
        value={targetDate}
        onChangeText={setTargetDate}
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
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  grid: {},
  goalCard: {},
  goalCardContent: { flexDirection: 'row', alignItems: 'center' },
  goalTextCol: { flex: 1 },
  goalLabelRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBadge: {},
});
