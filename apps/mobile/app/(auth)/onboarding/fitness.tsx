// =============================================================================
// TRANSFORMR -- Onboarding: Fitness Setup
// =============================================================================

import { useState, useCallback, type ComponentType } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { OnboardingBackground } from '@components/ui/OnboardingBackground';
import { FeatureHighlightRow } from '@components/ui/FeatureHighlightRow';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useProfileStore } from '@stores/profileStore';
import { useSettingsStore } from '@stores/settingsStore';
import { hapticLight } from '@utils/haptics';
import type { Equipment, Difficulty } from '@app-types/common';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;

const HERO_URL = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80';
const BLUR_HASH = 'LCF}@q~q~qj[~qj[WBj[j[j[M{j[';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little exercise' },
  { value: 'light', label: 'Lightly Active', description: '1-3 days per week' },
  { value: 'moderate', label: 'Moderately Active', description: '3-5 days per week' },
  { value: 'very_active', label: 'Very Active', description: '6-7 days per week' },
  { value: 'extra_active', label: 'Extra Active', description: 'Athlete or physical job' },
];

const WORKOUT_FREQUENCIES = [2, 3, 4, 5, 6, 7];

const EXPERIENCE_LEVELS: { value: Difficulty; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Less than 6 months training' },
  { value: 'intermediate', label: 'Intermediate', description: '6 months to 2 years' },
  { value: 'advanced', label: 'Advanced', description: '2+ years consistent training' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbells' },
  { value: 'cable', label: 'Cables' },
  { value: 'machine', label: 'Machines' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebells' },
  { value: 'bands', label: 'Resistance Bands' },
  { value: 'smith_machine', label: 'Smith Machine' },
  { value: 'trx', label: 'TRX / Suspension' },
];

export default function FitnessScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const fitnessPrefs = useSettingsStore((s) => s.fitnessPreferences);
  const setFitnessPrefs = useSettingsStore((s) => s.setFitnessPrefs);

  // Initialize from saved data so selections persist across back-navigation
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(() =>
    (profile?.activity_level as ActivityLevel) ?? 'moderate',
  );
  const [workoutDays, setWorkoutDays] = useState(() =>
    fitnessPrefs.workoutDaysPerWeek,
  );
  const [experience, setExperience] = useState<Difficulty>(() =>
    fitnessPrefs.experienceLevel,
  );
  const [equipment, setEquipment] = useState<Equipment[]>(() =>
    (fitnessPrefs.equipment as Equipment[]).length > 0
      ? (fitnessPrefs.equipment as Equipment[])
      : ['barbell', 'dumbbell'],
  );

  const toggleEquipment = useCallback((item: Equipment) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
  }, []);

  const handleContinue = useCallback(async () => {
    await updateProfile({ activity_level: activityLevel });
    setFitnessPrefs({ workoutDaysPerWeek: workoutDays, experienceLevel: experience, equipment });
    router.push('/(auth)/onboarding/nutrition');
  }, [activityLevel, workoutDays, experience, equipment, updateProfile, setFitnessPrefs, router]);

  return (
    <OnboardingBackground imageUrl={HERO_URL} blurHash={BLUR_HASH} localSource={require('@assets/images/hero-fitness.jpg')}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
            <Text style={styles.headline}>Let's build your{'\n'}training plan.</Text>
            <Text style={styles.subheadline}>
              Tell us how you train now. We'll meet you exactly where you are and build from there.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>

            {/* Activity Level */}
            <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
              Activity Level
            </Text>
            {ACTIVITY_LEVELS.map((level) => {
              const isSelected = activityLevel === level.value;
              return (
                <Pressable
                  key={level.value}
                  onPress={() => { hapticLight(); setActivityLevel(level.value); }}
                  accessibilityLabel={`${level.label}: ${level.description}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
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
                      {level.label}
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>
                      {level.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={{ color: colors.accent.primary, fontSize: 16 }}>{'\u2713'}</Text>
                  )}
                </Pressable>
              );
            })}

            {/* Workout Frequency */}
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xxl, marginBottom: spacing.md }]}>
              Workout Days Per Week
            </Text>
            <View style={styles.freqRow}>
              {WORKOUT_FREQUENCIES.map((day) => {
                const isSelected = workoutDays === day;
                return (
                  <Pressable
                    key={day}
                    onPress={() => { hapticLight(); setWorkoutDays(day); }}
                    accessibilityLabel={`${day} days per week`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.freqButton,
                      {
                        backgroundColor: isSelected ? colors.accent.primary : colors.background.secondary,
                        borderRadius: borderRadius.md,
                        paddingVertical: spacing.md,
                        marginRight: spacing.sm,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.accent.primary : colors.border.default,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.bodyBold,
                        { color: isSelected ? colors.text.inverse : colors.text.primary, textAlign: 'center' },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Training Experience */}
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xxl, marginBottom: spacing.md }]}>
              Training Experience
            </Text>
            {EXPERIENCE_LEVELS.map((level) => {
              const isSelected = experience === level.value;
              return (
                <Pressable
                  key={level.value}
                  onPress={() => { hapticLight(); setExperience(level.value); }}
                  accessibilityLabel={`${level.label}: ${level.description}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
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
                      {level.label}
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>
                      {level.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={{ color: colors.accent.primary, fontSize: 16 }}>{'\u2713'}</Text>
                  )}
                </Pressable>
              );
            })}

            {/* Available Equipment */}
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xxl, marginBottom: spacing.md }]}>
              Available Equipment
            </Text>
            <View style={styles.chipRow}>
              {EQUIPMENT_OPTIONS.map((item) => {
                const isSelected = equipment.includes(item.value);
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => { hapticLight(); toggleEquipment(item.value); }}
                    accessibilityLabel={`${item.label}${isSelected ? ', selected' : ''}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
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
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* What you're unlocking */}
            <SectionHeader title="What you're unlocking" style={{ marginTop: spacing.xxl }} />
            <FeatureHighlightRow
              icon="dumbbell"
              iconColor={colors.accent.primary}
              title="Log workouts in seconds"
              subtitle="Track sets, reps, and weight with one tap"
            />
            <FeatureHighlightRow
              icon="heart-pulse"
              iconColor={colors.accent.cyan}
              title="AI-powered suggestions"
              subtitle="Personalized workout recommendations"
            />
            <FeatureHighlightRow
              icon="trophy"
              iconColor={colors.accent.gold}
              title="Personal records"
              subtitle="Auto-detected PRs with celebration moments"
            />

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
      </KeyboardAvoidingView>
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
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  freqRow: { flexDirection: 'row' },
  freqButton: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {},
});
