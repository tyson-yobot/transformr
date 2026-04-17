// =============================================================================
// TRANSFORMR -- Onboarding: Partner Setup (Optional)
// =============================================================================

import { useState, useCallback, useEffect, type ComponentType } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import { OnboardingBackground } from '@components/ui/OnboardingBackground';
import { hapticLight } from '@utils/haptics';
import { usePartnerStore } from '@stores/partnerStore';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;

const HERO_URL = 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&q=80';
const BLUR_HASH = 'LCF}@q~q~qj[~qj[WBofj[j[M{of';

interface PrivacyToggle {
  key: string;
  label: string;
  icon: string;
  enabled: boolean;
}

const DEFAULT_PRIVACY: PrivacyToggle[] = [
  { key: 'workouts', label: 'Workouts', icon: '\uD83C\uDFCB\uFE0F', enabled: true },
  { key: 'nutrition', label: 'Nutrition', icon: '\uD83C\uDF4E', enabled: true },
  { key: 'weight', label: 'Weight', icon: '\u2696\uFE0F', enabled: false },
  { key: 'habits', label: 'Habits', icon: '\u2705', enabled: true },
  { key: 'goals', label: 'Goals', icon: '\uD83C\uDFAF', enabled: true },
  { key: 'mood', label: 'Mood', icon: '\uD83D\uDE0A', enabled: false },
  { key: 'business', label: 'Business', icon: '\uD83D\uDCBC', enabled: false },
];

export default function PartnerScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createPartnershipInvite = usePartnerStore((s) => s.createPartnershipInvite);
  const linkPartner = usePartnerStore((s) => s.linkPartner);

  const [mode, setMode] = useState<'choice' | 'invite' | 'join'>('choice');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [privacy, setPrivacy] = useState<PrivacyToggle[]>(DEFAULT_PRIVACY);

  // Generate and persist invite code when entering invite mode
  useEffect(() => {
    if (mode === 'invite' && !generatedCode) {
      createPartnershipInvite().then((code) => {
        if (code) setGeneratedCode(code);
      });
    }
  }, [mode, generatedCode, createPartnershipInvite]);

  const togglePrivacy = useCallback((key: string) => {
    hapticLight();
    setPrivacy((prev) =>
      prev.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p)),
    );
  }, []);

  const handleSkip = useCallback(() => {
    router.push('/(auth)/onboarding/notifications');
  }, [router]);

  const handleContinue = useCallback(async () => {
    if (mode === 'join' && inviteCode.trim()) {
      await linkPartner(inviteCode.trim().toUpperCase());
    }
    router.push('/(auth)/onboarding/notifications');
  }, [mode, inviteCode, linkPartner, router]);

  // Choice screen — full background + action buttons
  if (mode === 'choice') {
    return (
      <OnboardingBackground imageUrl={HERO_URL} blurHash={BLUR_HASH}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <View style={styles.choiceRoot}>
          {/* Heading */}
          <View style={styles.choiceHero}>
            <Image
              source={require('@assets/images/transformr-icon.png')}
              style={styles.icon}
              contentFit="contain"
            />
            <Text style={styles.headline}>Better together.</Text>
            <Text style={styles.subheadline}>
              Invite your partner to train alongside you. Shared goals, live workout sync, and accountability that actually works.
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.choiceActions}>
            <Button
              title="Invite a Partner"
              onPress={() => setMode('invite')}
              fullWidth
              size="lg"
              style={{ marginBottom: spacing.md }}
            />
            <Button
              title="Enter Invite Code"
              onPress={() => setMode('join')}
              variant="outline"
              fullWidth
              size="lg"
              style={{ marginBottom: spacing.md }}
            />
            <Button
              title="I'll do this later"
              onPress={handleSkip}
              variant="ghost"
              fullWidth
              size="lg"
            />
          </View>
        </View>
      </OnboardingBackground>
    );
  }

  return (
    <OnboardingBackground imageUrl={HERO_URL} blurHash={BLUR_HASH}>
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
            <Image
              source={require('@assets/images/transformr-icon.png')}
              style={styles.icon}
              contentFit="contain"
            />
            <Text style={styles.headline}>Better together.</Text>
            <Text style={styles.subheadline}>
              {mode === 'invite'
                ? 'Share your invite code. They join. You both get held accountable.'
                : 'Enter the invite code your partner shared with you.'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>

            {mode === 'invite' ? (
              <Card style={{ marginBottom: spacing.xxl, alignItems: 'center' as const }}>
                <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
                  Your Invite Code
                </Text>
                <Text
                  style={[
                    typography.stat,
                    { color: colors.accent.primary, letterSpacing: 4 },
                  ]}
                >
                  {generatedCode || 'Generating…'}
                </Text>
                <Text style={[typography.caption, { color: colors.text.muted, marginTop: spacing.sm }]}>
                  Share this code with your partner
                </Text>
              </Card>
            ) : (
              <Input
                label="Partner Invite Code"
                placeholder="TFR-XXXXXX"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                containerStyle={{ marginBottom: spacing.xxl }}
              />
            )}

            {/* Privacy Toggles */}
            <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
              What to Share
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.lg }]}>
              Control what your partner can see. You can change these anytime.
            </Text>

            {privacy.map((item) => (
              <View
                key={item.key}
                style={[
                  styles.toggleRow,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.lg,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <Text style={{ fontSize: 20, marginRight: spacing.md }}>{item.icon}</Text>
                <Text style={[typography.body, { color: colors.text.primary, flex: 1 }]}>
                  {item.label}
                </Text>
                <Switch
                  value={item.enabled}
                  onValueChange={() => togglePrivacy(item.key)}
                  trackColor={{ false: colors.background.tertiary, true: colors.accent.primary + '60' }}
                  thumbColor={item.enabled ? colors.accent.primary : colors.text.muted}
                  accessibilityLabel={`Share ${item.label}`}
                  accessibilityRole="switch"
                />
              </View>
            ))}

            {/* Continue */}
            <Button
              title="Continue"
              onPress={handleContinue}
              fullWidth
              size="lg"
              style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}
            />
            <Button
              title="I'll do this later"
              onPress={handleSkip}
              variant="ghost"
              fullWidth
              size="md"
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
  // Choice screen
  choiceRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  choiceHero: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  choiceActions: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  // Shared
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.15)' },
});
