// =============================================================================
// TRANSFORMR -- Auth Group Layout
// =============================================================================

import { Stack } from 'expo-router';
import { useTheme } from '@theme/index';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
      }}
    />
  );
}
