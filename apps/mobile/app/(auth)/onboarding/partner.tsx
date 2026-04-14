// =============================================================================
// TRANSFORMR -- Onboarding: Partner Setup (Optional)
// =============================================================================

import { useState, useCallback, useEffect, type ComponentType } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';
const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import { hapticLight } from '@utils/haptics';
import { OnboardingHero } from '@components/onboarding/OnboardingHero';
import { usePartnerStore } from '@stores/partnerStore';

const HERO_URI = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80';
const BLUR_HASH = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';
const DEEP_SPACE = '#0C0A15';

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
  const router = useRouter();
  const createPartnershipInvite = usePartnerStore((s) => s.createPartnershipInvite);
  const linkPartner = usePartnerStore((s) => s.linkPartner);
  const { height: screenHeight } = useWindowDimensions();
  const imageHeight = screenHeight * 0.4;

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

  // Choice screen — hero image + action buttons
  if (mode === 'choice') {
    return (
      <View style={styles.choiceRoot}>
        {/* Hero image */}
        <View style={[styles.choiceImageWrap, { height: imageHeight }]}>
          <Image
            source={{ uri: HERO_URI }}
            style={styles.fill}
            contentFit="cover"
            cachePolicy="memory-disk"
            placeholder={{ blurhash: BLUR_HASH }}
            transition={300}
          />
          <LinearGradient
            colors={['transparent', DEEP_SPACE]}
            locations={[0.4, 1]}
            style={styles.fill}
          />
          {/* Heading over gradient */}
          <View style={[styles.choiceHeadingWrap, { paddingHorizontal: spacing.xxl }]}>
            <Text style={[typography.h1, { color: '#F0F0FC', marginBottom: spacing.sm }]}>
              Transform together.
            </Text>
            <Text style={[typography.body, { color: '#9B8FC0', lineHeight: 22 }]}>
              Invite your partner, friend, or accountability buddy. Sync workouts, share progress, and challenge each other.
            </Text>
          </View>
        </View>

        {/* Action area */}
        <View style={[styles.choiceActions, { paddingHorizontal: spacing.xxl }]}>
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
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OnboardingHero
          imageUri={HERO_URI}
          heading="Transform together."
          subheading="Invite your partner, friend, or accountability buddy. Sync workouts, share progress, and challenge each other."
          style={{ marginBottom: spacing.xl }}
        />
        <View style={{ paddingHorizontal: spacing.xxl }}>

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
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: { flex: 1, backgroundColor: '#0C0A15' },
  // Choice screen
  choiceRoot: { flex: 1, backgroundColor: '#0C0A15' },
  choiceImageWrap: { width: '100%', position: 'relative', overflow: 'hidden' },
  choiceHeadingWrap: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  choiceActions: { flex: 1, justifyContent: 'center' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
});
