// =============================================================================
// TRANSFORMR -- Edit Profile Screen
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Chip } from '@components/ui/Chip';
import { useProfileStore } from '@stores/profileStore';
import { hapticSuccess } from '@utils/haptics';
import type { Profile } from '@app-types/database';

type Gender = NonNullable<Profile['gender']>;
type ActivityLevel = NonNullable<Profile['activity_level']>;
type GoalDirection = NonNullable<Profile['goal_direction']>;

const GENDER_OPTIONS: { key: Gender; label: string }[] = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'other', label: 'Other' },
  { key: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string }[] = [
  { key: 'sedentary', label: 'Sedentary' },
  { key: 'light', label: 'Light' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'very_active', label: 'Very Active' },
  { key: 'extra_active', label: 'Extra Active' },
];

const GOAL_DIRECTION_OPTIONS: { key: GoalDirection; label: string }[] = [
  { key: 'lose', label: 'Lose Weight' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'gain', label: 'Gain Weight' },
];

export default function EditProfileScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const { profile, updateProfile, isLoading } = useProfileStore();

  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [heightInches, setHeightInches] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goalDirection, setGoalDirection] = useState<GoalDirection>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [proteinTarget, setProteinTarget] = useState('');

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? '');
    setDateOfBirth(profile.date_of_birth ?? '');
    setGender(profile.gender ?? 'prefer_not_to_say');
    setHeightInches(profile.height_inches != null ? String(profile.height_inches) : '');
    setCurrentWeight(profile.current_weight != null ? String(profile.current_weight) : '');
    setGoalWeight(profile.goal_weight != null ? String(profile.goal_weight) : '');
    setGoalDirection(profile.goal_direction ?? 'maintain');
    setActivityLevel(profile.activity_level ?? 'moderate');
    setCalorieTarget(profile.daily_calorie_target != null ? String(profile.daily_calorie_target) : '');
    setProteinTarget(profile.daily_protein_target != null ? String(profile.daily_protein_target) : '');
  }, [profile]);

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Display name is required.');
      return;
    }

    const updates: Parameters<typeof updateProfile>[0] = {
      display_name: displayName.trim(),
      gender,
      activity_level: activityLevel,
      goal_direction: goalDirection,
    };

    if (dateOfBirth.trim()) {
      const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dobRegex.test(dateOfBirth)) {
        Alert.alert('Invalid Date', 'Use format YYYY-MM-DD');
        return;
      }
      updates.date_of_birth = dateOfBirth.trim();
    }

    if (heightInches) updates.height_inches = parseFloat(heightInches);
    if (currentWeight) updates.current_weight = parseFloat(currentWeight);
    if (goalWeight) updates.goal_weight = parseFloat(goalWeight);
    if (calorieTarget) updates.daily_calorie_target = parseInt(calorieTarget, 10);
    if (proteinTarget) updates.daily_protein_target = parseInt(proteinTarget, 10);

    await updateProfile(updates);
    await hapticSuccess();
    router.back();
  }, [
    displayName, dateOfBirth, gender, heightInches, currentWeight,
    goalWeight, goalDirection, activityLevel, calorieTarget, proteinTarget,
    updateProfile, router,
  ]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Basic Info
          </Text>
          <Card>
            <Input
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
            />
            <Input
              label="Date of Birth"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD"
              containerStyle={{ marginTop: spacing.md }}
            />

            <Text
              style={[
                typography.captionBold,
                { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
              ]}
            >
              Gender
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {GENDER_OPTIONS.map((g) => (
                <Chip
                  key={g.key}
                  label={g.label}
                  selected={gender === g.key}
                  onPress={() => setGender(g.key)}
                />
              ))}
            </ScrollView>
          </Card>
        </Animated.View>

        {/* Body Metrics */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md },
            ]}
          >
            Body Metrics
          </Text>
          <Card>
            <Input
              label="Height (inches)"
              value={heightInches}
              onChangeText={setHeightInches}
              placeholder="70"
              keyboardType="decimal-pad"
            />
            <Input
              label="Current Weight (lbs)"
              value={currentWeight}
              onChangeText={setCurrentWeight}
              placeholder="175"
              keyboardType="decimal-pad"
              containerStyle={{ marginTop: spacing.md }}
            />
            <Input
              label="Goal Weight (lbs)"
              value={goalWeight}
              onChangeText={setGoalWeight}
              placeholder="165"
              keyboardType="decimal-pad"
              containerStyle={{ marginTop: spacing.md }}
            />

            <Text
              style={[
                typography.captionBold,
                { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
              ]}
            >
              Goal Direction
            </Text>
            <View style={[styles.chipRow, { gap: spacing.sm }]}>
              {GOAL_DIRECTION_OPTIONS.map((g) => (
                <Chip
                  key={g.key}
                  label={g.label}
                  selected={goalDirection === g.key}
                  onPress={() => setGoalDirection(g.key)}
                />
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Activity & Targets */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md },
            ]}
          >
            Activity & Targets
          </Text>
          <Card>
            <Text
              style={[
                typography.captionBold,
                { color: colors.text.secondary, marginBottom: spacing.sm },
              ]}
            >
              Activity Level
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {ACTIVITY_OPTIONS.map((a) => (
                <Chip
                  key={a.key}
                  label={a.label}
                  selected={activityLevel === a.key}
                  onPress={() => setActivityLevel(a.key)}
                />
              ))}
            </ScrollView>

            <Input
              label="Daily Calorie Target"
              value={calorieTarget}
              onChangeText={setCalorieTarget}
              placeholder="2200"
              keyboardType="number-pad"
              containerStyle={{ marginTop: spacing.lg }}
            />
            <Input
              label="Daily Protein Target (g)"
              value={proteinTarget}
              onChangeText={setProteinTarget}
              placeholder="180"
              keyboardType="number-pad"
              containerStyle={{ marginTop: spacing.md }}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            fullWidth
            loading={isLoading}
            disabled={!displayName.trim()}
            style={{ marginTop: spacing.xl }}
          />
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
});
