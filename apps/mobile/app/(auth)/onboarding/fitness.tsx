// =============================================================================
// TRANSFORMR -- Onboarding: Fitness Setup
// =============================================================================

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { useProfileStore } from '@stores/profileStore';
import { hapticLight } from '@utils/haptics';
import type { Equipment, Difficulty } from '@app-types/common';

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
  const router = useRouter();
  const updateProfile = useProfileStore((s) => s.updateProfile);

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [workoutDays, setWorkoutDays] = useState(4);
  const [experience, setExperience] = useState<Difficulty>('intermediate');
  const [equipment, setEquipment] = useState<Equipment[]>(['barbell', 'dumbbell']);

  const toggleEquipment = useCallback((item: Equipment) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
  }, []);

  const handleContinue = useCallback(async () => {
    await updateProfile({
      activity_level: activityLevel,
    });
    router.push('/(auth)/onboarding/nutrition');
  }, [activityLevel, updateProfile, router]);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ padding: spacing.xxl, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[typography.h1, { color: colors.text.primary, marginBottom: spacing.sm }]}>
        Fitness Profile
      </Text>
      <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.xxxl }]}>
        Help us build the perfect training plan for you.
      </Text>

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
                  { color: isSelected ? '#FFFFFF' : colors.text.primary, textAlign: 'center' },
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
                  { color: isSelected ? '#FFFFFF' : colors.text.primary },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Continue */}
      <Button
        title="Continue"
        onPress={handleContinue}
        fullWidth
        size="lg"
        style={{ marginTop: spacing.xxxl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  freqRow: { flexDirection: 'row' },
  freqButton: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {},
});
