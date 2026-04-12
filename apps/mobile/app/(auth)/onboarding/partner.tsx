// =============================================================================
// TRANSFORMR -- Onboarding: Partner Setup (Optional)
// =============================================================================

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import { hapticLight } from '@utils/haptics';

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

  const [mode, setMode] = useState<'choice' | 'invite' | 'join'>('choice');
  const [inviteCode, setInviteCode] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyToggle[]>(DEFAULT_PRIVACY);

  const togglePrivacy = useCallback((key: string) => {
    hapticLight();
    setPrivacy((prev) =>
      prev.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p)),
    );
  }, []);

  const handleSkip = useCallback(() => {
    router.push('/(auth)/onboarding/notifications');
  }, [router]);

  const handleContinue = useCallback(() => {
    // In full implementation, create/join partnership via partnerStore
    router.push('/(auth)/onboarding/notifications');
  }, [router]);

  // Choice screen
  if (mode === 'choice') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary, padding: spacing.xxl }]}>
        <View style={styles.centerContent}>
          <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: spacing.xl }}>
            {'\uD83D\uDC65'}
          </Text>
          <Text style={[typography.h1, { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm }]}>
            Accountability Partner
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xxxl },
            ]}
          >
            Connect with a partner to share progress, challenge each other, and stay accountable.
          </Text>

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
        {mode === 'invite' ? 'Invite Partner' : 'Join Partner'}
      </Text>
      <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.xxl }]}>
        {mode === 'invite'
          ? 'Share this code with your partner so they can connect with you.'
          : 'Enter the invite code you received from your partner.'}
      </Text>

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
            TFR-{Math.random().toString(36).substring(2, 8).toUpperCase()}
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
  container: { flex: 1, justifyContent: 'center' },
  centerContent: { alignItems: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
});
