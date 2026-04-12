// =============================================================================
// TRANSFORMR -- Root Layout
// =============================================================================

import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
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

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('@assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('@assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('@assets/fonts/Inter-Bold.ttf'),
    'JetBrainsMono-Regular': require('@assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrainsMono-SemiBold': require('@assets/fonts/JetBrainsMono-SemiBold.ttf'),
    'JetBrainsMono-Bold': require('@assets/fonts/JetBrainsMono-Bold.ttf'),
  });

  useEffect(() => {
    const subscription = listenToAuthChanges();
    return () => {
      subscription.unsubscribe();
    };
  }, [listenToAuthChanges]);

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    void onLayoutReady();
  }, [onLayoutReady]);

  if (!fontsLoaded) {
    return null;
  }

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
