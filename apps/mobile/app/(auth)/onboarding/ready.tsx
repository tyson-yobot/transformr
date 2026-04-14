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
  withRepeat,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { useProfileStore } from '@stores/profileStore';

// Confetti-style decorative orbs rendered behind the hero text
function ConfettiOrb({ color, style }: { color: string; style: object }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    scale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 120 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        { backgroundColor: color },
        style,
        animStyle,
      ]}
    />
  );
}

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
  const buttonScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Celebration entrance
    celebrationOpacity.value = withTiming(1, { duration: 400 });
    celebrationScale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 220 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );

    // Content fade in
    contentOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    contentTranslateY.value = withDelay(500, withSpring(0, { damping: 15, stiffness: 200 }));

    // Button
    buttonOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));

    // Subtle pulsing glow on the button to draw attention
    glowOpacity.value = withDelay(
      1100,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900 }),
          withTiming(0.4, { duration: 900 }),
        ),
        -1,
        true,
      ),
    );

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
    transform: [{ scale: buttonScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
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
    // Only navigate if the update succeeded (profile will be set in store)
    const { error } = useProfileStore.getState();
    if (!error) {
      router.replace('/(tabs)/dashboard');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary, padding: spacing.xxl }]}>
      {/* Decorative background orbs */}
      <ConfettiOrb color={colors.accent.primary + '30'} style={styles.orbTopLeft} />
      <ConfettiOrb color={colors.accent.secondary + '25'} style={styles.orbTopRight} />
      <ConfettiOrb color={colors.accent.primary + '18'} style={styles.orbBottomLeft} />

      {/* Celebration */}
      <Animated.View style={[styles.celebrationSection, celebrationStyle]}>
        <Text style={styles.trophyEmoji}>{'\uD83C\uDF89'}</Text>
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
              color: colors.accent.primary,
              textAlign: 'center',
              marginTop: spacing.sm,
              fontWeight: '600',
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

      {/* Start Button with pulsing glow */}
      <Animated.View style={[styles.buttonSection, buttonStyle]}>
        {/* Glow layer behind the button */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.buttonGlow,
            { backgroundColor: colors.accent.primary + '40' },
            glowStyle,
          ]}
        />
        <Button
          title="Let's Go — Start Transforming"
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
  // Decorative orbs
  orbTopLeft: { position: 'absolute', top: -20, left: -30, width: 160, height: 160, borderRadius: 80 },
  orbTopRight: { position: 'absolute', top: 60, right: -50, width: 120, height: 120, borderRadius: 60 },
  orbBottomLeft: { position: 'absolute', bottom: 120, left: -40, width: 100, height: 100, borderRadius: 50 },
  orb: {},
  // Hero
  celebrationSection: { alignItems: 'center', marginTop: 20, zIndex: 1 },
  trophyEmoji: { fontSize: 72, textAlign: 'center' },
  // Summary
  summarySection: { flex: 1, justifyContent: 'center', zIndex: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  // CTA
  buttonSection: { paddingBottom: 20, zIndex: 1 },
  buttonGlow: { borderRadius: 16, top: -6, bottom: -6, left: -6, right: -6 },
});
