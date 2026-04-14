// =============================================================================
// TRANSFORMR -- Entry Redirect
// =============================================================================

import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@stores/authStore';
import { useProfileStore } from '@stores/profileStore';
import { useSettingsStore } from '@stores/settingsStore';
import { useTheme } from '@theme/index';

export default function Index() {
  const { colors, typography, spacing } = useTheme();
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const router = useRouter();
  const pulse = useSharedValue(0.3);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.3, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    // User is authenticated -- check onboarding status
    fetchProfile()
      .then(() => {
        const currentProfile = useProfileStore.getState().profile;
        if (!currentProfile?.onboarding_completed) {
          router.replace('/(auth)/onboarding/welcome');
          return;
        }

        // Check if daily briefing should be shown
        const { briefingEnabled, lastBriefingDate } = useSettingsStore.getState();
        const today = new Date().toDateString();
        if (briefingEnabled && lastBriefingDate !== today) {
          router.replace('/daily-briefing');
        } else {
          router.replace('/(tabs)/dashboard');
        }
      })
      .catch(() => {
        // Profile fetch failed — go to onboarding (profile will be created on first save)
        router.replace('/(auth)/onboarding/welcome');
      });
  }, [session, loading, router, fetchProfile]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Animated.Text
        style={[
          typography.hero,
          { color: colors.text.primary, letterSpacing: 4 },
          pulseStyle,
        ]}
        accessibilityRole="text"
        accessibilityLabel="Loading TRANSFORMR"
      >
        TRANSFORMR
      </Animated.Text>
      <View style={[styles.dots, { marginTop: spacing.xl }]}>
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: colors.accent.primary },
            pulseStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
