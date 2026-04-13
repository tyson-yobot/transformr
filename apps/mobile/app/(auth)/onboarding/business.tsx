// =============================================================================
// TRANSFORMR -- Onboarding: Business Setup (Optional)
// =============================================================================

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { hapticLight } from '@utils/haptics';

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
  const router = useRouter();

  const [trackBusiness, setTrackBusiness] = useState<boolean | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [currentMRR, setCurrentMRR] = useState('');
  const [revenueGoal, setRevenueGoal] = useState('');

  const handleSkip = useCallback(() => {
    router.push('/(auth)/onboarding/partner');
  }, [router]);

  const handleContinue = useCallback(async () => {
    // In a full implementation, we would save business data via businessStore
    router.push('/(auth)/onboarding/partner');
  }, [router]);

  // Show initial decision screen
  if (trackBusiness === null) {
    return (
      <View style={[styles.decisionContainer, { backgroundColor: colors.background.primary, padding: spacing.xxl }]}>
        <View style={styles.decisionContent}>
          <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: spacing.xl }}>
            {'\uD83D\uDCBC'}
          </Text>
          <Text style={[typography.h1, { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm }]}>
            Track Your Business?
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xxxl },
            ]}
          >
            TRANSFORMR can track revenue, expenses, and business goals alongside your fitness journey.
          </Text>

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
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ padding: spacing.xxl, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[typography.h1, { color: colors.text.primary, marginBottom: spacing.sm }]}>
        Business Setup
      </Text>
      <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.xxxl }]}>
        Tell us about your business so we can track your entrepreneurial growth.
      </Text>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  decisionContainer: { flex: 1, justifyContent: 'center' },
  decisionContent: { alignItems: 'center' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  typeCard: {},
});
