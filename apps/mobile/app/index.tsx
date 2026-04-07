// =============================================================================
// TRANSFORMR -- Entry Redirect
// =============================================================================

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@stores/authStore';
import { useProfileStore } from '@stores/profileStore';
import { useTheme } from '@theme/index';

export default function Index() {
  const { colors, typography, spacing } = useTheme();
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    // User is authenticated -- check onboarding status
    fetchProfile().then(() => {
      const currentProfile = useProfileStore.getState().profile;
      if (currentProfile?.onboarding_completed) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(auth)/onboarding/welcome');
      }
    });
  }, [session, loading, router, fetchProfile]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Text style={[typography.hero, { color: colors.text.primary, marginBottom: spacing.lg }]}>
        TRANSFORMR
      </Text>
      <ActivityIndicator size="large" color={colors.accent.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
