// =============================================================================
// TRANSFORMR -- Partner Stack Layout
// =============================================================================

import { Stack } from 'expo-router';
import { useTheme } from '@theme/index';

export default function PartnerLayout() {
  const { colors, typography } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          ...typography.h3,
          color: colors.text.primary,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Partner Dashboard',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="live-workout"
        options={{
          title: 'Live Workout',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="challenges"
        options={{
          title: 'Challenges',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="nudge"
        options={{
          title: 'Send Nudge',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
