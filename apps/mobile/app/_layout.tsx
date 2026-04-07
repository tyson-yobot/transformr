// =============================================================================
// TRANSFORMR -- Root Layout
// =============================================================================

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@theme/index';
import { useAuthStore } from '@stores/authStore';
import { useSettingsStore } from '@stores/settingsStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const listenToAuthChanges = useAuthStore((s) => s.listenToAuthChanges);
  const themeMode = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const subscription = listenToAuthChanges();
    return () => {
      subscription.unsubscribe();
    };
  }, [listenToAuthChanges]);

  useEffect(() => {
    // Hide splash screen after a brief delay to allow auth state to resolve
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider mode={themeMode}>
          <StatusBar style="light" />
          <Slot />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
