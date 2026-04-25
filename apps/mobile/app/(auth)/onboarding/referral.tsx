// =============================================================================
// TRANSFORMR -- Onboarding: Referral Code Entry
// =============================================================================

import { useState, useCallback, type ComponentType } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { OnboardingBackground } from '@components/ui/OnboardingBackground';
import { useReferralStore } from '@stores/referralStore';
import { useAuthStore } from '@stores/authStore';

const Image = ExpoImage as unknown as ComponentType<ImageProps>;

const HERO_URL = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80';
const BLUR_HASH = 'L9F}n+~q~q-;~q-;RjRjWBazofaz';

export default function OnboardingReferral() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);

  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  const validateCode = useReferralStore((s) => s.validateCode);
  const applyCode = useReferralStore((s) => s.applyCode);
  const validationResult = useReferralStore((s) => s.validationResult);
  const validationLoading = useReferralStore((s) => s.validationLoading);
  const codeLoading = useReferralStore((s) => s.codeLoading);

  const handleApply = useCallback(async () => {
    if (!code.trim() || !userId) return;

    const result = await validateCode(code.trim().toUpperCase());
    if (result.valid && result.referrerId) {
      await applyCode(code.trim().toUpperCase(), userId);
      setReferrerName('a friend');
      setApplied(true);
    }
  }, [code, userId, validateCode, applyCode]);

  const handleSkip = useCallback(() => {
    router.push('/(auth)/onboarding/ready' as Parameters<typeof router.push>[0]);
  }, [router]);

  const handleContinue = useCallback(() => {
    router.push('/(auth)/onboarding/ready' as Parameters<typeof router.push>[0]);
  }, [router]);

  const isLoading = validationLoading || codeLoading;
  const isInvalid = validationResult !== null && !validationResult.valid && !applied;

  return (
    <OnboardingBackground
      imageUrl={HERO_URL}
      localSource={require('@assets/images/gym-hero.jpg')}
      blurHash={BLUR_HASH}
    >
      <StatusBar style="light" />

      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.dim.gold }]}>
            <Ionicons name="gift-outline" size={32} color={colors.accent.gold} />
          </View>
          <Text style={[styles.title, typography.h2, { color: colors.text.primary }]}>
            Got a referral code?
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            If someone invited you to TRANSFORMR, enter their code below to connect.
          </Text>
        </Animated.View>

        {/* Input */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.inputSection}>
          {applied ? (
            <View style={[styles.successCard, { backgroundColor: colors.dim.success, borderRadius: borderRadius.lg }]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.accent.success} />
              <Text style={[styles.successText, { color: colors.accent.success }]}>
                Referred by {referrerName}!
              </Text>
              <Text style={[styles.successSubtext, { color: colors.text.secondary }]}>
                You&apos;re connected. Rewards will activate once you subscribe.
              </Text>
            </View>
          ) : (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: isInvalid ? colors.accent.danger : colors.border.default,
                    borderRadius: borderRadius.md,
                  },
                ]}
                placeholder="Enter referral code"
                placeholderTextColor={colors.text.muted}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isLoading}
              />
              {isInvalid && (
                <Text style={[styles.errorText, { color: colors.accent.danger }]}>
                  Invalid or expired referral code
                </Text>
              )}
              <Pressable
                style={[
                  styles.applyButton,
                  {
                    backgroundColor: code.trim() ? colors.accent.primary : colors.background.tertiary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                onPress={handleApply}
                disabled={!code.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.text.primary} />
                ) : (
                  <Text style={[styles.applyButtonText, { color: colors.text.primary }]}>
                    Apply Code
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </Animated.View>

        {/* Bottom actions */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.bottomActions}>
          {applied ? (
            <Pressable
              style={[styles.continueButton, { backgroundColor: colors.accent.success, borderRadius: borderRadius.md }]}
              onPress={handleContinue}
            >
              <Text style={[styles.continueText, { color: colors.text.primary }]}>
                Continue
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.text.primary} />
            </Pressable>
          ) : (
            <Pressable
              style={[styles.skipButton, { borderRadius: borderRadius.md }]}
              onPress={handleSkip}
            >
              <Text style={[styles.skipText, { color: colors.text.secondary }]}>
                Skip — I don&apos;t have a code
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  input: {
    height: 52,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: 'SpaceMono',
    letterSpacing: 2,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  applyButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  successCard: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
  },
  successSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  bottomActions: {
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 15,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    width: '100%',
    gap: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
