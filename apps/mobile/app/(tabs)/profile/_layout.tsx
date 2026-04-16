// =============================================================================
// TRANSFORMR -- Profile Tab Stack Layout
// =============================================================================

import { Stack } from 'expo-router';
import { useTheme } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileLayout() {
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
          title: 'Profile',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="partner"
        options={{
          title: 'Partner',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="dashboard-builder"
        options={{
          title: 'Customize Dashboard',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="notifications-settings"
        options={{
          title: 'Notifications',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="nfc-setup"
        options={{
          title: 'NFC Triggers',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="integrations"
        options={{
          title: 'Integrations',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="data-export"
        options={{
          title: 'Export Data',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'About',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          headerBackTitle: 'Profile',
        }}
      />
    </Stack>
  );
}
