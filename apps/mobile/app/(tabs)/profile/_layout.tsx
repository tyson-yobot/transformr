// =============================================================================
// TRANSFORMR -- Profile Tab Stack Layout
// =============================================================================

import { Stack } from 'expo-router';
import { useTheme } from '@theme/index';

export default function ProfileLayout() {
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
      <Stack.Screen
        name="referrals"
        options={{
          title: 'Referral Hub',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="squad"
        options={{
          title: 'My Squad',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="gifts"
        options={{
          title: 'Milestone Gifts',
          headerBackTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="creator"
        options={{
          title: 'Creator Dashboard',
          headerBackTitle: 'Profile',
        }}
      />
    </Stack>
  );
}
