// =============================================================================
// TRANSFORMR -- Labs Stack Layout
// =============================================================================

import { Stack } from 'expo-router';
import { useTheme } from '@theme/index';

export default function LabsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="detail" />
    </Stack>
  );
}
