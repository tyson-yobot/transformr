// =============================================================================
// TRANSFORMR -- Onboarding: Goals
// =============================================================================

import { useState, useCallback, type ComponentType } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const existingGoals = useGoalStore((s) => s.goals);

  // Initialize from saved goals so selections persist across back-navigation
  const [selectedGoals, setSelectedGoals] = useState<GoalCategory[]>(() => {
    if (existingGoals.length > 0) {
      return existingGoals.map((g) => g.category as GoalCategory);
    }
    return [];
  });
  const [primaryGoal, setPrimaryGoal] = useState<GoalCategory | null>(() => {
    if (existingGoals.length > 0) {
      const primary = existingGoals.reduce((best, g) =>
        (g.priority ?? 0) > (best.priority ?? 0) ? g : best,
      );
      return (primary.category as GoalCategory) ?? null;
    }
    return null;
  });
  const [targetDate, setTargetDate] = useState(() => {
    const firstGoal = existingGoals[0];
    if (existingGoals.length > 0 && firstGoal?.target_date) {
      const d = new Date(firstGoal.target_date);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
    return '';
  });
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
          <View style={styles.logoSection}>
            <View style={styles.iconGlowOuter} />
            <View style={styles.iconGlow} />
            <Image
              source={require('@assets/icons/transformr-icon.png')}
              style={styles.icon}
              contentFit="contain"
            />
          </View>
          <Text style={styles.headline}>Dream big.{'\n'}Then build a plan.</Text>
          <Text style={styles.subheadline}>
            What does your life look like 12 months from now if everything went right? Pick every area you want to win in.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>

          {/* Goal Cards — tap to toggle, star to set primary */}
          <Text style={[typography.caption, { color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.md }]}>
            Select all that apply — tap the star to set your #1 priority
          </Text>
          <View style={styles.grid}>
            {GOAL_OPTIONS.map((goal) => {
              const isSelected = selectedGoals.includes(goal.category);
              const isPrimary = primaryGoal === goal.category;
              return (
                <Pressable
                  key={goal.category}
                  onPress={() => {
                    hapticLight();
                    toggleGoal(goal.category);
                    // Auto-set primary to first selected goal if none set
                    if (!isSelected && !primaryGoal) {
                      setPrimaryGoal(goal.category);
                    }
                  }}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: isSelected
                        ? isPrimary ? colors.accent.primary + '28' : colors.accent.primary + '18'
                        : colors.background.secondary,
                      borderRadius: borderRadius.lg,
                      padding: spacing.lg,
                      marginBottom: spacing.md,
                      borderWidth: isPrimary ? 2 : isSelected ? 1.5 : 1,
                      borderColor: isPrimary
                        ? colors.accent.primary
                        : isSelected
                          ? colors.accent.primary + '80'
                          : colors.border.default,
                    },
                  ]}
                >
                  <View style={styles.goalCardContent}>
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isSelected ? colors.accent.primary + '25' : colors.background.tertiary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 24 }}>{goal.icon}</Text>
                    </View>
                    <View style={[styles.goalTextCol, { marginLeft: spacing.md }]}>
                      <View style={styles.goalLabelRow}>
                        <Text style={[typography.bodyBold, { color: isSelected ? colors.text.primary : colors.text.secondary }]}>
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
                    {isSelected ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation?.();
                            hapticLight();
                            setPrimaryGoal(goal.category);
                          }}
                          hitSlop={8}
                          accessibilityLabel={`Set ${goal.label} as primary goal`}
                        >
                          <Ionicons
                            name={isPrimary ? 'star' : 'star-outline'}
                            size={20}
                            color={isPrimary ? '#F59E0B' : colors.text.muted}
                          />
                        </Pressable>
                        <Ionicons name="checkmark-circle" size={22} color={colors.accent.primary} />
                      </View>
                    ) : (
                      <View style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 1.5,
                        borderColor: colors.border.default,
                      }} />
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
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    height: 100,
    width: 200,
  },
  iconGlowOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,85,247,0.08)',
    top: -50,
  },
  iconGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(168,85,247,0.18)',
    top: -25,
  },
  icon: { width: 100, height: 100 },
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
