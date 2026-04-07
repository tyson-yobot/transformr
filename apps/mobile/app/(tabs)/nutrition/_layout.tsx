// =============================================================================
// TRANSFORMR -- Nutrition Stack Layout
// =============================================================================

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@theme/index';

export default function NutritionLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background.primary },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Nutrition', headerShown: false }}
      />
      <Stack.Screen
        name="add-food"
        options={{ title: 'Add Food', presentation: 'modal' }}
      />
      <Stack.Screen
        name="meal-camera"
        options={{ title: 'AI Meal Scanner', headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="barcode-scanner"
        options={{ title: 'Scan Barcode', headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="menu-scanner"
        options={{ title: 'Menu Scanner', headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="saved-meals"
        options={{ title: 'Saved Meals' }}
      />
      <Stack.Screen
        name="meal-plans"
        options={{ title: 'Meal Plans' }}
      />
      <Stack.Screen
        name="meal-prep"
        options={{ title: 'Meal Prep' }}
      />
      <Stack.Screen
        name="grocery-list"
        options={{ title: 'Grocery List' }}
      />
      <Stack.Screen
        name="supplements"
        options={{ title: 'Supplements' }}
      />
      <Stack.Screen
        name="analytics"
        options={{ title: 'Nutrition Analytics' }}
      />
    </Stack>
  );
}
