// =============================================================================
// TRANSFORMR -- Auth Group Layout
// Auth screens are always dark regardless of device color scheme.
// =============================================================================

import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '@theme/index';

function AuthStack() {
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

export default function AuthLayout() {
  return (
    <ThemeProvider mode="dark">
      <AuthStack />
    </ThemeProvider>
  );
}
