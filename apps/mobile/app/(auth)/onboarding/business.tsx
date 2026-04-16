// =============================================================================
// TRANSFORMR -- Onboarding: Business Setup (Optional)
// =============================================================================

import { useState, useCallback, type ComponentType } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { hapticLight } from '@utils/haptics';
import { OnboardingHero } from '@components/onboarding/OnboardingHero';
import { useBusinessStore } from '@stores/businessStore';
// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;

const HERO_URI = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80';
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
  const deepSpace = colors.background.primary;
  const router = useRouter();
  const createBusiness = useBusinessStore((s) => s.createBusiness);
  const { height: screenHeight } = useWindowDimensions();
  const imageHeight = screenHeight * 0.4;

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

  // Decision screen — hero image + two choices
  if (trackBusiness === null) {
    return (
      <View style={[styles.decisionRoot, { backgroundColor: colors.background.primary }]}>
        {/* Hero image */}
        <View style={[styles.decisionImageWrap, { height: imageHeight }]}>
          <Image
            source={{ uri: HERO_URI }}
            style={styles.fill}
            contentFit="cover"
            cachePolicy="memory-disk"
            placeholder={{ blurhash: BLUR_HASH }}
            transition={300}
          />
          <LinearGradient
            colors={['transparent', deepSpace]}
            locations={[0.4, 1]}
            style={styles.fill}
          />
          {/* Heading over gradient */}
          <View style={[styles.decisionHeadingWrap, { paddingHorizontal: spacing.xxl }]}>
            <Text style={[typography.h1, { color: '#F0F0FC', marginBottom: spacing.sm }]}>
              Your health and wealth are connected.
            </Text>
            <Text style={[typography.body, { color: '#9B8FC0', lineHeight: 22 }]}>
              Track your revenue alongside your reps. TRANSFORMR shows the correlation between physical and financial growth.
            </Text>
          </View>
        </View>

        {/* Action area */}
        <View style={[styles.decisionActions, { paddingHorizontal: spacing.xxl }]}>
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
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background.primary }]}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OnboardingHero
          imageUri={HERO_URI}
          heading="Your health and wealth are connected."
          subheading="Track your revenue alongside your reps. TRANSFORMR shows the correlation between physical and financial growth."
          style={{ marginBottom: spacing.xl }}
        />
        <View style={{ paddingHorizontal: spacing.xxl }}>

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
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: { flex: 1 },
  // Decision screen
  decisionRoot: { flex: 1 },
  decisionImageWrap: { width: '100%', position: 'relative', overflow: 'hidden' },
  decisionHeadingWrap: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  decisionActions: { flex: 1, justifyContent: 'center' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  typeCard: {},
});
