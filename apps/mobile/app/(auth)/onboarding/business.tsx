// =============================================================================
// TRANSFORMR -- Onboarding: Business Setup (Optional)
// =============================================================================

import { useState, useCallback, type ComponentType } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { OnboardingBackground } from '@components/ui/OnboardingBackground';
import { hapticLight } from '@utils/haptics';
import { useBusinessStore } from '@stores/businessStore';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;

const HERO_URL = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80';
const BLUR_HASH = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';

type BusinessType = 'saas' | 'service' | 'product' | 'consulting' | 'other';

const BUSINESS_TYPES: { value: BusinessType; label: string; icon: string }[] = [
  { value: 'saas', label: 'SaaS', icon: '\uD83D\uDCBB' },
  { value: 'service', label: 'Service', icon: '\uD83D\uDEE0\uFE0F' },
  { value: 'product', label: 'Product', icon: '\uD83D\uDCE6' },
  { value: 'consulting', label: 'Consulting', icon: '\uD83D\uDCCA' },
  { value: 'other', label: 'Other', icon: '\uD83D\uDD27' },
];

export default function BusinessScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createBusiness = useBusinessStore((s) => s.createBusiness);

  const [trackBusiness, setTrackBusiness] = useState<boolean | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [currentMRR, setCurrentMRR] = useState('');
  const [revenueGoal, setRevenueGoal] = useState('');

  const handleSkip = useCallback(() => {
    router.push('/(auth)/onboarding/partner');
  }, [router]);

  const handleContinue = useCallback(async () => {
    if (businessName.trim()) {
      await createBusiness({
        name: businessName.trim(),
        type: businessType ?? undefined,
        monthly_revenue: currentMRR ? parseFloat(currentMRR) : 0,
        description: revenueGoal ? `Revenue goal: $${revenueGoal}/mo` : undefined,
      });
    }
    router.push('/(auth)/onboarding/partner');
  }, [businessName, businessType, currentMRR, revenueGoal, createBusiness, router]);

  // Decision screen — full-screen background + two choices
  if (trackBusiness === null) {
    return (
      <OnboardingBackground imageUrl={HERO_URL} blurHash={BLUR_HASH}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <View style={styles.decisionRoot}>
          {/* Heading */}
          <View style={styles.decisionHero}>
            <Image
              source={require('@assets/images/transformr-icon.png')}
              style={styles.icon}
              contentFit="contain"
            />
            <Text style={styles.headline}>Your health and{'\n'}wealth are connected.</Text>
            <Text style={styles.subheadline}>
              Track your revenue alongside your reps. TRANSFORMR shows the correlation between physical and financial growth.
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.decisionActions}>
            <Button
              title="Yes, Set Up Business Tracking"
              onPress={() => setTrackBusiness(true)}
              fullWidth
              size="lg"
              style={{ marginBottom: spacing.md }}
            />
            <Button
              title="Skip for Now"
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
            <Text style={styles.headline}>Build your business{'\n'}alongside your body.</Text>
            <Text style={styles.subheadline}>
              The discipline you build in the gym carries into your business. Let's track both.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>

            {/* Business Name */}
            <Input
              label="Business Name"
              placeholder="My Awesome Company"
              value={businessName}
              onChangeText={setBusinessName}
              containerStyle={{ marginBottom: spacing.xl }}
            />

            {/* Business Type */}
            <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
              Business Type
            </Text>
            <View style={[styles.typeRow, { marginBottom: spacing.xl }]}>
              {BUSINESS_TYPES.map((type) => {
                const isSelected = businessType === type.value;
                return (
                  <Pressable
                    key={type.value}
                    onPress={() => { hapticLight(); setBusinessType(type.value); }}
                    accessibilityLabel={`Business type: ${type.label}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor: isSelected ? colors.accent.primary + '15' : colors.background.secondary,
                        borderRadius: borderRadius.md,
                        padding: spacing.md,
                        marginRight: spacing.sm,
                        marginBottom: spacing.sm,
                        borderWidth: 1.5,
                        borderColor: isSelected ? colors.accent.primary : colors.border.default,
                        alignItems: 'center',
                        minWidth: 90,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 22, marginBottom: spacing.xs }}>{type.icon}</Text>
                    <Text
                      style={[
                        typography.captionBold,
                        { color: isSelected ? colors.accent.primary : colors.text.primary },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Current MRR */}
            <Input
              label="Current Monthly Revenue (MRR)"
              placeholder="0"
              value={currentMRR}
              onChangeText={setCurrentMRR}
              keyboardType="numeric"
              leftIcon={
                <Text style={[typography.body, { color: colors.text.muted }]}>$</Text>
              }
              containerStyle={{ marginBottom: spacing.xl }}
            />

            {/* Revenue Goal */}
            <Input
              label="Monthly Revenue Goal"
              placeholder="10000"
              value={revenueGoal}
              onChangeText={setRevenueGoal}
              keyboardType="numeric"
              leftIcon={
                <Text style={[typography.body, { color: colors.text.muted }]}>$</Text>
              }
              containerStyle={{ marginBottom: spacing.xxxl }}
            />

            {/* Continue */}
            <Button
              title="Continue"
              onPress={handleContinue}
              fullWidth
              size="lg"
              style={{ marginBottom: spacing.md }}
            />
            <Button
              title="Skip for Now"
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
  // Decision screen
  decisionRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  decisionHero: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  decisionActions: {
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
  typeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  typeCard: {},
});
