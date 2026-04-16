// =============================================================================
// TRANSFORMR -- Onboarding: Nutrition Setup
// =============================================================================

import { useState, useCallback, useMemo, type ComponentType } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { ProgressBar } from '@components/ui/ProgressBar';
import { OnboardingBackground } from '@components/ui/OnboardingBackground';
import { useProfileStore } from '@stores/profileStore';
import { hapticLight } from '@utils/haptics';
import {
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateAge,
} from '@services/calculations/bmr';
import { calculateMacroTargets, calculateMacroPercentages } from '@services/calculations/macros';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;

const HERO_URL = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80';
const BLUR_HASH = 'LCF}@q~q~qRj~qRjt7j[j[j[M{j[';

const DIETARY_OPTIONS = [
  'No Restrictions',
  'Vegetarian',
  'Vegan',
  'Keto',
  'Paleo',
  'Gluten-Free',
  'Dairy-Free',
  'Halal',
  'Kosher',
  'Low-Sodium',
] as const;

const MEAL_TIMING_OPTIONS = [
  { value: '3_meals', label: '3 Meals', description: 'Breakfast, Lunch, Dinner' },
  { value: '3_meals_snacks', label: '3 Meals + Snacks', description: 'Main meals plus snacks' },
  { value: 'intermittent', label: 'Intermittent Fasting', description: '16:8 or similar' },
  { value: '5_meals', label: '5-6 Small Meals', description: 'Eating every 2-3 hours' },
] as const;

export default function NutritionScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);

  // Calculate TDEE from profile data
  const calculatedValues = useMemo(() => {
    const weight = profile?.current_weight ?? 170;
    const height = profile?.height_inches ?? 70;
    const dob = profile?.date_of_birth ?? '1990-01-01';
    const gender = profile?.gender ?? 'male';
    const activity = profile?.activity_level ?? 'moderate';
    const goalDir = profile?.goal_direction ?? 'maintain';

    const age = calculateAge(dob);
    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activity);
    const calorieTarget = calculateCalorieTarget(tdee, goalDir);
    const macros = calculateMacroTargets(calorieTarget, goalDir, weight);
    const percentages = calculateMacroPercentages(macros.protein, macros.carbs, macros.fat);

    return { tdee, calorieTarget, macros, percentages };
  }, [profile]);

  const [calories, setCalories] = useState(calculatedValues.calorieTarget);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(['No Restrictions']);
  const [mealTiming, setMealTiming] = useState('3_meals_snacks');

  const macros = useMemo(() => {
    const goalDir = profile?.goal_direction ?? 'maintain';
    const weight = profile?.current_weight ?? 170;
    return calculateMacroTargets(calories, goalDir, weight);
  }, [calories, profile]);

  const percentages = useMemo(
    () => calculateMacroPercentages(macros.protein, macros.carbs, macros.fat),
    [macros],
  );

  const adjustCalories = useCallback((delta: number) => {
    setCalories((prev) => Math.max(1200, Math.min(6000, prev + delta)));
  }, []);

  const toggleDietaryPref = useCallback((pref: string) => {
    setDietaryPrefs((prev) => {
      if (pref === 'No Restrictions') return ['No Restrictions'];
      const without = prev.filter((p) => p !== 'No Restrictions');
      if (without.includes(pref)) {
        const updated = without.filter((p) => p !== pref);
        return updated.length === 0 ? ['No Restrictions'] : updated;
      }
      return [...without, pref];
    });
  }, []);

  const handleContinue = useCallback(async () => {
    await updateProfile({
      daily_calorie_target: calories,
      daily_protein_target: macros.protein,
      daily_carb_target: macros.carbs,
      daily_fat_target: macros.fat,
    });
    router.push('/(auth)/onboarding/business');
  }, [calories, macros, updateProfile, router]);

  return (
    <OnboardingBackground imageUrl={HERO_URL} blurHash={BLUR_HASH}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon + Headline */}
        <View style={styles.heroSection}>
          <Image
            source={require('@assets/images/transformr-icon.png')}
            style={styles.icon}
            contentFit="contain"
          />
          <Text style={styles.headline}>Fuel the{'\n'}transformation.</Text>
          <Text style={styles.subheadline}>
            We've calculated your targets based on your goals. Your body, your numbers — adjust if you know better.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>

          {/* TDEE Display */}
          <Card style={{ marginBottom: spacing.xl }}>
            <Text style={[typography.caption, { color: colors.text.secondary, textAlign: 'center' }]}>
              Estimated TDEE (Total Daily Energy Expenditure)
            </Text>
            <Text
              style={[
                typography.stat,
                { color: colors.accent.primary, textAlign: 'center', marginTop: spacing.xs },
              ]}
            >
              <Text style={typography.stat}>{calculatedValues.tdee}</Text> cal
            </Text>
          </Card>

          {/* Calorie Target */}
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Daily Calorie Target
          </Text>
          <View style={[styles.calorieRow, { marginBottom: spacing.xxl }]}>
            <Pressable
              onPress={() => { hapticLight(); adjustCalories(-50); }}
              accessibilityLabel="Decrease calories by 50"
              accessibilityRole="button"
              style={[
                styles.adjustButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: colors.border.default,
                },
              ]}
            >
              <Text style={[typography.h2, { color: colors.text.primary }]}>{'\u2212'}</Text>
            </Pressable>
            <View style={styles.calorieCenter}>
              <Text style={[typography.stat, { color: colors.text.primary, textAlign: 'center' }]}>
                {calories}
              </Text>
              <Text style={[typography.caption, { color: colors.text.muted, textAlign: 'center' }]}>
                calories/day
              </Text>
            </View>
            <Pressable
              onPress={() => { hapticLight(); adjustCalories(50); }}
              accessibilityLabel="Increase calories by 50"
              accessibilityRole="button"
              style={[
                styles.adjustButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: colors.border.default,
                },
              ]}
            >
              <Text style={[typography.h2, { color: colors.text.primary }]}>+</Text>
            </Pressable>
          </View>

          {/* Macro Split */}
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Macro Split
          </Text>
          <Card style={{ marginBottom: spacing.xxl }}>
            {/* Protein */}
            <View style={[styles.macroRow, { marginBottom: spacing.md }]}>
              <View style={styles.macroLabel}>
                <View style={[styles.macroDot, { backgroundColor: colors.accent.info }]} />
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>Protein</Text>
              </View>
              <Text style={[typography.monoBody, { color: colors.text.primary, fontWeight: '700' }]}>
                {macros.protein}g
              </Text>
              <Text style={[typography.monoCaption, { color: colors.text.muted, marginLeft: spacing.sm }]}>
                {percentages.protein}%
              </Text>
            </View>
            <ProgressBar
              progress={percentages.protein / 100}
              color={colors.accent.info}
              height={6}
              style={{ marginBottom: spacing.lg }}
            />

            {/* Carbs */}
            <View style={[styles.macroRow, { marginBottom: spacing.md }]}>
              <View style={styles.macroLabel}>
                <View style={[styles.macroDot, { backgroundColor: colors.accent.success }]} />
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>Carbs</Text>
              </View>
              <Text style={[typography.monoBody, { color: colors.text.primary, fontWeight: '700' }]}>
                {macros.carbs}g
              </Text>
              <Text style={[typography.monoCaption, { color: colors.text.muted, marginLeft: spacing.sm }]}>
                {percentages.carbs}%
              </Text>
            </View>
            <ProgressBar
              progress={percentages.carbs / 100}
              color={colors.accent.success}
              height={6}
              style={{ marginBottom: spacing.lg }}
            />

            {/* Fat */}
            <View style={[styles.macroRow, { marginBottom: spacing.md }]}>
              <View style={styles.macroLabel}>
                <View style={[styles.macroDot, { backgroundColor: colors.accent.warning }]} />
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>Fat</Text>
              </View>
              <Text style={[typography.monoBody, { color: colors.text.primary, fontWeight: '700' }]}>
                {macros.fat}g
              </Text>
              <Text style={[typography.monoCaption, { color: colors.text.muted, marginLeft: spacing.sm }]}>
                {percentages.fat}%
              </Text>
            </View>
            <ProgressBar
              progress={percentages.fat / 100}
              color={colors.accent.warning}
              height={6}
            />
          </Card>

          {/* Dietary Preferences */}
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Dietary Preferences
          </Text>
          <View style={[styles.chipRow, { marginBottom: spacing.xxl }]}>
            {DIETARY_OPTIONS.map((pref) => {
              const isSelected = dietaryPrefs.includes(pref);
              return (
                <Pressable
                  key={pref}
                  onPress={() => toggleDietaryPref(pref)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.accent.primary : colors.background.secondary,
                      borderRadius: borderRadius.full,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.lg,
                      marginRight: spacing.sm,
                      marginBottom: spacing.sm,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.accent.primary : colors.border.default,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { color: isSelected ? colors.text.inverse : colors.text.primary },
                    ]}
                  >
                    {pref}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Meal Timing */}
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Meal Timing
          </Text>
          {MEAL_TIMING_OPTIONS.map((option) => {
            const isSelected = mealTiming === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setMealTiming(option.value)}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: isSelected ? colors.accent.primary + '15' : colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.lg,
                    marginBottom: spacing.sm,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.accent.primary : colors.border.default,
                  },
                ]}
              >
                <View style={styles.flex}>
                  <Text style={[typography.bodyBold, { color: isSelected ? colors.accent.primary : colors.text.primary }]}>
                    {option.label}
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    {option.description}
                  </Text>
                </View>
                {isSelected && (
                  <Text style={{ color: colors.accent.primary, fontSize: 16 }}>{'\u2713'}</Text>
                )}
              </Pressable>
            );
          })}

          {/* Continue */}
          <Button
            title="Continue"
            onPress={handleContinue}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.xxxl }}
          />
        </View>
      </ScrollView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 100, paddingBottom: 40 },
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
  calorieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  adjustButton: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center' },
  calorieCenter: { flex: 1, marginHorizontal: 16 },
  macroRow: { flexDirection: 'row', alignItems: 'center' },
  macroLabel: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  macroDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {},
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
