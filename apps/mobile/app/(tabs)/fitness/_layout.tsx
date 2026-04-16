// =============================================================================
// TRANSFORMR -- Fitness Tab Stack Layout
// =============================================================================

import { Stack } from 'expo-router';
import { useTheme } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FitnessLayout() {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerStatusBarHeight: insets.top,
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
        name="index"
        options={{
          title: 'Fitness',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="workout-player"
        options={{
          title: 'Workout',
          headerBackTitle: 'Back',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="workout-summary"
        options={{
          title: 'Workout Summary',
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="exercises"
        options={{
          title: 'Exercise Library',
          headerBackTitle: 'Fitness',
        }}
      />
      <Stack.Screen
        name="exercise-detail"
        options={{
          title: 'Exercise',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="progress"
        options={{
          title: 'Progress',
          headerBackTitle: 'Fitness',
        }}
      />
      <Stack.Screen
        name="programs"
        options={{
          title: 'Programs',
          headerBackTitle: 'Fitness',
        }}
      />
      <Stack.Screen
        name="form-check"
        options={{
          title: 'AI Form Check',
          headerBackTitle: 'Fitness',
        }}
      />
      <Stack.Screen
        name="pain-tracker"
        options={{
          title: 'Pain Tracker',
          headerBackTitle: 'Fitness',
        }}
      />
      <Stack.Screen
        name="mobility"
        options={{
          title: 'Mobility & Recovery',
          headerBackTitle: 'Fitness',
        }}
      />
    </Stack>
  );
}
