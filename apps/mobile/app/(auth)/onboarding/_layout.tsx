// =============================================================================
// TRANSFORMR -- Onboarding Layout
// Dot progress overlay sits on top of hero images, edge-to-edge.
// =============================================================================

import { type ComponentType } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';
// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;

const VIVID_PURPLE = '#A855F7';
const DOT_UPCOMING = '#2A2248';
const BG = '#0C0A15';

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

const SKIPPABLE_STEPS: readonly string[] = [
  'goals',
  'fitness',
  'nutrition',
  'business',
  'partner',
  'notifications',
];

export default function OnboardingLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const currentSegment = pathname.split('/').pop() ?? 'welcome';
  const currentIndex = ONBOARDING_STEPS.indexOf(currentSegment as typeof ONBOARDING_STEPS[number]);
  const stepNumber = currentIndex >= 0 ? currentIndex + 1 : 1;

  const showBack = stepNumber > 1 && currentSegment !== 'ready';
  const showSkip = SKIPPABLE_STEPS.includes(currentSegment);

  const handleSkip = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < ONBOARDING_STEPS.length) {
      const nextStep = ONBOARDING_STEPS[nextIndex];
      router.push(`/(auth)/onboarding/${nextStep}` as Parameters<typeof router.push>[0]);
    }
  };

  return (
    // SafeAreaView only for bottom — hero images go edge-to-edge at top
    <SafeAreaView style={[styles.root, { backgroundColor: BG }]} edges={['bottom']}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: BG },
          animation: 'slide_from_right',
        }}
      />

      {/* Progress dots — absolute overlay with gradient bg to prevent text bleed-through */}
      <View
        style={[styles.overlay, { top: 0 }]}
        pointerEvents="box-none"
      >
        {/* Gradient fade: opaque at top → transparent below nav area */}
        <LinearGradient
          colors={['rgba(12,10,21,0.85)', 'rgba(12,10,21,0.0)']}
          locations={[0, 1]}
          style={[styles.overlayGradient, { height: insets.top + 56 }]}
          pointerEvents="none"
        />
        <View style={[styles.headerRow, { marginTop: insets.top + 10 }]} pointerEvents="auto">
          {/* Back */}
          <View style={styles.sideSlot}>
            {showBack ? (
              <Pressable onPress={() => router.back()} hitSlop={12} style={styles.sideButton}>
                <Text style={styles.backText}>{'← Back'}</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Dots */}
          <View style={styles.dots}>
            {ONBOARDING_STEPS.map((_, i) => {
              const completed = i < stepNumber;
              const active = i === stepNumber - 1;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: completed ? VIVID_PURPLE : DOT_UPCOMING },
                    active && styles.dotActive,
                  ]}
                />
              );
            })}
          </View>

          {/* Skip */}
          <View style={[styles.sideSlot, styles.sideRight]}>
            {showSkip ? (
              <Pressable onPress={handleSkip} hitSlop={12} style={styles.sideButton}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 100,
  },
  overlayGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sideSlot: { width: 64, minHeight: 32 },
  sideRight: { alignItems: 'flex-end' },
  sideButton: { paddingVertical: 4 },
  backText: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  skipText: { color: VIVID_PURPLE, fontSize: 14, fontWeight: '600' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 20, borderRadius: 3 },
});
