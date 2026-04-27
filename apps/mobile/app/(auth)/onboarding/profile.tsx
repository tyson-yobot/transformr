// =============================================================================
// TRANSFORMR -- Onboarding: Profile Setup
// =============================================================================

import { useState, useCallback, type ComponentType } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { OnboardingBackground } from '@components/ui/OnboardingBackground';
import { useProfileStore } from '@stores/profileStore';
import { hapticLight } from '@utils/haptics';
import { formatDateInput, dateInputToISO, isoToDateInput } from '@utils/formatters';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;

const HERO_URL = 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1200&q=80';
const BLUR_HASH = 'LBF}@q~q~qj[~qj[WBj[j[j[M{j[';

type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
type GoalDirection = 'gain' | 'lose' | 'maintain';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const GOAL_DIRECTIONS: { value: GoalDirection; label: string; icon: string }[] = [
  { value: 'lose', label: 'Lose Weight', icon: '\u2193' },
  { value: 'maintain', label: 'Maintain', icon: '\u2194' },
  { value: 'gain', label: 'Gain Weight', icon: '\u2191' },
];

export default function ProfileScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const profile = useProfileStore((s) => s.profile);

  // Initialize from saved profile so data persists across back-navigation
  const [dateOfBirth, setDateOfBirth] = useState(() =>
    profile?.date_of_birth ? isoToDateInput(profile.date_of_birth) : '',
  );
  const [gender, setGender] = useState<Gender | null>(() =>
    (profile?.gender as Gender) ?? null,
  );
  const [heightFeet, setHeightFeet] = useState(() =>
    profile?.height_inches ? String(Math.floor(profile.height_inches / 12)) : '',
  );
  const [heightInches, setHeightInches] = useState(() =>
    profile?.height_inches ? String(profile.height_inches % 12) : '',
  );
  const [currentWeight, setCurrentWeight] = useState(() =>
    profile?.current_weight ? String(profile.current_weight) : '',
  );
  const [goalWeight, setGoalWeight] = useState(() =>
    profile?.goal_weight ? String(profile.goal_weight) : '',
  );
  const [goalDirection, setGoalDirection] = useState<GoalDirection>(() =>
    (profile?.goal_direction as GoalDirection) ?? 'lose',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};

    // Validate date of birth — must be MM/DD/YYYY and a real calendar date
    const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateOfBirth.trim()) {
      errs.dob = 'Date of birth is required';
    } else if (!dobRegex.test(dateOfBirth)) {
      errs.dob = 'Use format MM/DD/YYYY (e.g. 05/21/1990)';
    } else {
      const parsed = new Date(dateInputToISO(dateOfBirth));
      const now = new Date();
      if (isNaN(parsed.getTime()) || parsed >= now) {
        errs.dob = 'Enter a valid date in the past';
      }
    }

    if (!gender) {
      errs.gender = 'Please select your gender';
    }

    const feet = parseInt(heightFeet, 10);
    const inches = parseInt(heightInches, 10);
    if (isNaN(feet) || feet < 3 || feet > 8) {
      errs.height = 'Enter a valid height';
    }
    if (isNaN(inches) || inches < 0 || inches > 11) {
      errs.height = 'Enter valid inches (0-11)';
    }

    const cw = parseFloat(currentWeight);
    if (isNaN(cw) || cw < 50 || cw > 700) {
      errs.currentWeight = 'Enter a valid weight in lbs';
    }

    const gw = parseFloat(goalWeight);
    if (isNaN(gw) || gw < 50 || gw > 700) {
      errs.goalWeight = 'Enter a valid goal weight in lbs';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [dateOfBirth, gender, heightFeet, heightInches, currentWeight, goalWeight]);

  const handleContinue = useCallback(async () => {
    if (!validate()) return;

    const totalInches = parseInt(heightFeet, 10) * 12 + parseInt(heightInches, 10);

    await updateProfile({
      date_of_birth: dateInputToISO(dateOfBirth),
      gender: gender ?? 'prefer_not_to_say',
      height_inches: totalInches,
      current_weight: parseFloat(currentWeight),
      goal_weight: parseFloat(goalWeight),
      goal_direction: goalDirection,
    });

    router.push('/(auth)/onboarding/goals');
  }, [validate, dateOfBirth, gender, heightFeet, heightInches, currentWeight, goalWeight, goalDirection, updateProfile, router]);

  return (
    <OnboardingBackground imageUrl={HERO_URL} blurHash={BLUR_HASH} localSource={require('@assets/images/hero-profile.jpg')}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
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
            <Text style={styles.headline}>Where are you{'\n'}starting from?</Text>
            <Text style={styles.subheadline}>
              No judgment here. Every transformation has a starting line — this is yours.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>

            {/* Date of Birth */}
            <Input
              label="Date of Birth"
              placeholder="MM/DD/YYYY"
              value={dateOfBirth}
              onChangeText={(t) => {
                setDateOfBirth(formatDateInput(t));
                setErrors((prev) => ({ ...prev, dob: '' }));
              }}
              error={errors.dob}
              keyboardType="number-pad"
              maxLength={10}
              containerStyle={{ marginBottom: spacing.xl }}
            />

            {/* Gender Selection */}
            <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
              Gender
            </Text>
            <View style={[styles.chipRow, { marginBottom: spacing.xs }]}>
              {GENDERS.map((g) => {
                const isSelected = gender === g.value;
                return (
                  <Pressable
                    key={g.value}
                    onPress={() => {
                      hapticLight();
                      setGender(g.value);
                      setErrors((prev) => ({ ...prev, gender: '' }));
                    }}
                    accessibilityLabel={`Gender: ${g.label}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
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
                      {g.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.gender && (
              <Text style={[typography.caption, { color: colors.accent.danger, marginBottom: spacing.lg }]}>
                {errors.gender}
              </Text>
            )}

            {/* Height */}
            <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
              Height
            </Text>
            <View style={[styles.row, { marginBottom: errors.height ? spacing.xs : spacing.xl }]}>
              <View style={styles.halfInput}>
                <Input
                  placeholder="Feet"
                  value={heightFeet}
                  onChangeText={(t) => {
                    setHeightFeet(t);
                    setErrors((prev) => ({ ...prev, height: '' }));
                  }}
                  keyboardType="number-pad"
                  rightIcon={<Text style={[typography.caption, { color: colors.text.muted }]}>ft</Text>}
                />
              </View>
              <View style={[styles.halfInput, { marginLeft: spacing.md }]}>
                <Input
                  placeholder="Inches"
                  value={heightInches}
                  onChangeText={(t) => {
                    setHeightInches(t);
                    setErrors((prev) => ({ ...prev, height: '' }));
                  }}
                  keyboardType="number-pad"
                  rightIcon={<Text style={[typography.caption, { color: colors.text.muted }]}>in</Text>}
                />
              </View>
            </View>
            {errors.height && (
              <Text style={[typography.caption, { color: colors.accent.danger, marginBottom: spacing.lg }]}>
                {errors.height}
              </Text>
            )}

            {/* Current Weight */}
            <Input
              label="Current Weight"
              placeholder="175"
              value={currentWeight}
              onChangeText={(t) => {
                setCurrentWeight(t);
                setErrors((prev) => ({ ...prev, currentWeight: '' }));
              }}
              error={errors.currentWeight}
              keyboardType="decimal-pad"
              rightIcon={<Text style={[typography.caption, { color: colors.text.muted }]}>lbs</Text>}
              containerStyle={{ marginBottom: spacing.xl }}
            />

            {/* Goal Weight */}
            <Input
              label="Goal Weight"
              placeholder="165"
              value={goalWeight}
              onChangeText={(t) => {
                setGoalWeight(t);
                setErrors((prev) => ({ ...prev, goalWeight: '' }));
              }}
              error={errors.goalWeight}
              keyboardType="decimal-pad"
              rightIcon={<Text style={[typography.caption, { color: colors.text.muted }]}>lbs</Text>}
              containerStyle={{ marginBottom: spacing.xl }}
            />

            {/* Goal Direction */}
            <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
              Goal Direction
            </Text>
            <View style={[styles.directionRow, { marginBottom: spacing.xxxl }]}>
              {GOAL_DIRECTIONS.map((dir) => {
                const isSelected = goalDirection === dir.value;
                return (
                  <Pressable
                    key={dir.value}
                    onPress={() => { hapticLight(); setGoalDirection(dir.value); }}
                    accessibilityLabel={`Goal: ${dir.label}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.directionCard,
                      {
                        flex: 1,
                        backgroundColor: isSelected ? colors.accent.primary + '20' : colors.background.secondary,
                        borderRadius: borderRadius.md,
                        padding: spacing.md,
                        marginHorizontal: spacing.xs,
                        borderWidth: 1.5,
                        borderColor: isSelected ? colors.accent.primary : colors.border.default,
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 20, marginBottom: spacing.xs, color: isSelected ? colors.accent.primary : colors.text.primary }}>{dir.icon}</Text>
                    <Text
                      style={[
                        typography.captionBold,
                        { color: isSelected ? colors.accent.primary : colors.text.primary, textAlign: 'center' },
                      ]}
                    >
                      {dir.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Continue Button */}
            <Button
              title="Continue"
              onPress={handleContinue}
              fullWidth
              size="lg"
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {},
  row: { flexDirection: 'row' },
  halfInput: { flex: 1 },
  directionRow: { flexDirection: 'row' },
  directionCard: {},
});
