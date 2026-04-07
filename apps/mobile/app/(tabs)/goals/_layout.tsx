// =============================================================================
// TRANSFORMR -- Goals Tab Stack Layout
// =============================================================================

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@theme/index';

export default function GoalsLayout() {
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
          title: 'Goals',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="habits"
        options={{
          title: 'Habit Tracker',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="sleep"
        options={{
          title: 'Sleep Tracker',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="mood"
        options={{
          title: 'Mood Logger',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="journal"
        options={{
          title: 'AI Journal',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="focus-mode"
        options={{
          title: 'Focus Mode',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="vision-board"
        options={{
          title: 'Vision Board',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="skills"
        options={{
          title: 'Skills & Knowledge',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="challenges"
        options={{
          title: 'Challenges',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="stake-goals"
        options={{
          title: 'Stake Goals',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="business/index"
        options={{
          title: 'Business',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="business/revenue"
        options={{
          title: 'Log Revenue',
          headerBackTitle: 'Business',
        }}
      />
      <Stack.Screen
        name="business/customers"
        options={{
          title: 'Customers',
          headerBackTitle: 'Business',
        }}
      />
      <Stack.Screen
        name="business/milestones"
        options={{
          title: 'Milestones',
          headerBackTitle: 'Business',
        }}
      />
      <Stack.Screen
        name="finance/index"
        options={{
          title: 'Personal Finance',
          headerBackTitle: 'Goals',
        }}
      />
      <Stack.Screen
        name="finance/transactions"
        options={{
          title: 'Transactions',
          headerBackTitle: 'Finance',
        }}
      />
      <Stack.Screen
        name="finance/budgets"
        options={{
          title: 'Budgets',
          headerBackTitle: 'Finance',
        }}
      />
      <Stack.Screen
        name="finance/net-worth"
        options={{
          title: 'Net Worth',
          headerBackTitle: 'Finance',
        }}
      />
      <Stack.Screen
        name="challenge-detail"
        options={{
          title: 'Challenge',
          headerBackTitle: 'Challenges',
        }}
      />
      <Stack.Screen
        name="challenge-active"
        options={{
          title: 'Active Challenge',
          headerBackTitle: 'Challenges',
        }}
      />
      <Stack.Screen
        name="challenge-builder"
        options={{
          title: 'Create Challenge',
          headerBackTitle: 'Challenges',
        }}
      />
    </Stack>
  );
}
