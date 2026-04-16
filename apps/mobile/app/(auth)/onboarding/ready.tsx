// =============================================================================
// TRANSFORMR -- Onboarding: Ready Screen
// =============================================================================

import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { useProfileStore } from '@stores/profileStore';
import { OnboardingHero } from '@components/onboarding/OnboardingHero';

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
  const vividPurple = colors.accent.primary;
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);

  // Spring press animation for CTA
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    contentTranslateY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 200 }));
    buttonOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));

    // Pulsing purple glow to draw attention
    glowOpacity.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900 }),
          withTiming(0.4, { duration: 900 }),
        ),
        -1,
        true,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
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
      items.push({ label: 'Target', value: `${profile.daily_calorie_target} cal/day`, icon: '\uD83D\uDD25' });
    }
    if (profile?.activity_level) {
      const levelLabels: Record<string, string> = {
        sedentary: 'Sedentary',
        light: 'Light',
        moderate: 'Moderate',
        very_active: 'Very Active',
        extra_active: 'Extra Active',
      };
      items.push({ label: 'Coach style', value: levelLabels[profile.activity_level] ?? 'Adaptive', icon: '\uD83E\uDD16' });
    }

    return items;
  }, [profile]);

  const handleStart = async () => {
    await updateProfile({ onboarding_completed: true });
    const { error } = useProfileStore.getState();
    if (!error) {
      router.replace('/(tabs)/dashboard');
    }
  };

  const onPressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };
  const onPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <OnboardingHero
        imageUri={require('@assets/images/hero-ready.jpg') as number}
        heading="You're ready. Let's go."
        subheading="Everything is set. Your AI coach is calibrated. Your plan is built. Today is Day 1 of your transformation."
        style={{ marginBottom: spacing.xl }}
      />

      {/* Decorative celebration orbs */}
      <ConfettiOrb color={vividPurple + '30'} style={styles.orbTopLeft} />
      <ConfettiOrb color={vividPurple + '18'} style={styles.orbTopRight} />
      <ConfettiOrb color={vividPurple + '10'} style={styles.orbBottomRight} />

      <Animated.View style={[{ paddingHorizontal: spacing.xxl }, contentStyle]}>
        {/* Summary card */}
        {summaryItems.length > 0 && (
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
        )}

        {/* CTA — spring press + purple glow */}
        <Animated.View style={[styles.ctaWrap, buttonAnimStyle]}>
          {/* Pulsing glow layer behind button */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.ctaGlow,
              { backgroundColor: vividPurple + '40' },
              glowStyle,
            ]}
          />
          <Pressable
            onPress={handleStart}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            accessibilityLabel="Start My Transformation"
            accessibilityRole="button"
            style={[
              styles.ctaButton,
              { backgroundColor: vividPurple, shadowColor: vividPurple },
            ]}
          >
            <Text style={[styles.ctaText, { color: colors.text.inverse }]}>Start My Transformation</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.text.muted }]}>By Automate AI</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  // Decorative orbs
  orbTopLeft: { position: 'absolute', top: 0, left: -30, width: 140, height: 140, borderRadius: 70 },
  orbTopRight: { position: 'absolute', top: 60, right: -50, width: 110, height: 110, borderRadius: 55 },
  orbBottomRight: { position: 'absolute', bottom: 120, right: -40, width: 90, height: 90, borderRadius: 45 },
  orb: {},
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  // CTA
  ctaWrap: { position: 'relative', marginBottom: 8 },
  ctaGlow: { borderRadius: 14, top: -6, bottom: -6, left: -6, right: -6 },
  ctaButton: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  footer: {
    marginTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 1,
  },
});
