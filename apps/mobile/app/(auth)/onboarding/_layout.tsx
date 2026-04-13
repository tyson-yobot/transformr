// =============================================================================
// TRANSFORMR -- Onboarding Layout
// =============================================================================

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { ProgressBar } from '@components/ui/ProgressBar';

const ONBOARDING_STEPS = [
  'welcome',
  'profile',
  'goals',
  'fitness',
  'nutrition',
  'business',
  'partner',
  'notifications',
  'ready',
] as const;

export default function OnboardingLayout() {
  const { colors, typography, spacing } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Determine current step from pathname
  const currentSegment = pathname.split('/').pop() ?? 'welcome';
  const currentIndex = ONBOARDING_STEPS.indexOf(currentSegment as typeof ONBOARDING_STEPS[number]);
  const stepNumber = currentIndex >= 0 ? currentIndex + 1 : 1;
  const totalSteps = ONBOARDING_STEPS.length;
  const progress = stepNumber / totalSteps;

  const showBack = stepNumber > 1 && currentSegment !== 'ready';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.primary }]} edges={['top']}>
      {/* Progress Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xxl, paddingTop: spacing.md }]}>
        <View style={styles.headerTop}>
          {showBack ? (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={[typography.body, { color: colors.text.secondary }]}>
                {'\u2190'} Back
              </Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Text style={[typography.caption, { color: colors.text.muted }]}>
            {stepNumber} of {totalSteps}
          </Text>
        </View>
        <ProgressBar
          progress={progress}
          color={colors.accent.primary}
          height={4}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {},
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
