// =============================================================================
// TRANSFORMR -- Onboarding: Ready Screen
// =============================================================================

import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { useProfileStore } from '@stores/profileStore';

export default function ReadyScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);

  // Animations
  const celebrationScale = useSharedValue(0);
  const celebrationOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Celebration entrance
    celebrationOpacity.value = withTiming(1, { duration: 400 });
    celebrationScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );

    // Content fade in
    contentOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    contentTranslateY.value = withDelay(500, withSpring(0, { damping: 15, stiffness: 200 }));

    // Button
    buttonOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
    // Reanimated shared values are stable refs — no re-run needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const celebrationStyle = useAnimatedStyle(() => ({
    opacity: celebrationOpacity.value,
    transform: [{ scale: celebrationScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const summaryItems = useMemo(() => {
    const items: { label: string; value: string; icon: string }[] = [];

    if (profile?.goal_direction) {
      const dirLabels = { gain: 'Gain Weight', lose: 'Lose Weight', maintain: 'Maintain' };
      items.push({ label: 'Goal', value: dirLabels[profile.goal_direction], icon: '\uD83C\uDFAF' });
    }
    if (profile?.daily_calorie_target) {
      items.push({ label: 'Calories', value: `${profile.daily_calorie_target} cal/day`, icon: '\uD83D\uDD25' });
    }
    if (profile?.daily_protein_target) {
      items.push({ label: 'Protein', value: `${profile.daily_protein_target}g/day`, icon: '\uD83E\uDD69' });
    }
    if (profile?.activity_level) {
      const levelLabels: Record<string, string> = {
        sedentary: 'Sedentary',
        light: 'Light',
        moderate: 'Moderate',
        very_active: 'Very Active',
        extra_active: 'Extra Active',
      };
      items.push({ label: 'Activity', value: levelLabels[profile.activity_level] ?? 'Moderate', icon: '\uD83C\uDFC3' });
    }

    return items;
  }, [profile]);

  const handleStart = async () => {
    await updateProfile({ onboarding_completed: true });
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary, padding: spacing.xxl }]}>
      {/* Celebration */}
      <Animated.View style={[styles.celebrationSection, celebrationStyle]}>
        <Text style={{ fontSize: 64, textAlign: 'center' }}>{'\uD83C\uDF89'}</Text>
        <Text
          style={[
            typography.hero,
            {
              color: colors.text.primary,
              textAlign: 'center',
              marginTop: spacing.lg,
            },
          ]}
        >
          You're All Set!
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: colors.text.secondary,
              textAlign: 'center',
              marginTop: spacing.sm,
            },
          ]}
        >
          Your transformation starts now
        </Text>
      </Animated.View>

      {/* Summary */}
      <Animated.View style={[styles.summarySection, contentStyle]}>
        <Card style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.lg }]}>
            Your Setup Summary
          </Text>
          {summaryItems.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.summaryRow,
                {
                  paddingVertical: spacing.md,
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: colors.border.subtle,
                },
              ]}
            >
              <Text style={{ fontSize: 20, marginRight: spacing.md }}>{item.icon}</Text>
              <Text style={[typography.body, { color: colors.text.secondary, flex: 1 }]}>
                {item.label}
              </Text>
              <Text style={[typography.monoBody, { color: colors.text.primary, fontWeight: '700' }]}>
                {item.value}
              </Text>
            </View>
          ))}
          {summaryItems.length === 0 && (
            <Text style={[typography.body, { color: colors.text.muted, textAlign: 'center' }]}>
              Your personalized plan is ready
            </Text>
          )}
        </Card>
      </Animated.View>

      {/* Start Button */}
      <Animated.View style={[styles.buttonSection, buttonStyle]}>
        <Button
          title="Start Transforming"
          onPress={handleStart}
          fullWidth
          size="lg"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  celebrationSection: { alignItems: 'center', marginTop: 20 },
  summarySection: { flex: 1, justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  buttonSection: { paddingBottom: 20 },
});
