// =============================================================================
// TRANSFORMR -- Root Layout
// =============================================================================

import { useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ThemeProvider } from '@theme/index';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuthStore } from '@stores/authStore';
import { useSettingsStore } from '@stores/settingsStore';
import { usePartnerStore } from '@stores/partnerStore';
import { useOfflineSync } from '@hooks/useOfflineSync';
import { supabase } from '@services/supabase';

const STRIPE_PUBLISHABLE_KEY = process.env['EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'] ?? '';

// Configure native Google Sign-In once at module load.
// webClientId must match the OAuth 2.0 Web Client ID in Google Cloud Console
// (the same one registered in Supabase Auth > Google provider).
GoogleSignin.configure({
  webClientId: process.env['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'] ?? '',
  scopes: ['email', 'profile'],
  offlineAccess: true,
});

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
  useOfflineSync();

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

  // Handle OAuth deep link callbacks (PKCE code exchange on cold start or resume)
  // Also handles partner invite deep links: scheme://partner/join?code=TRFM-XXXXX
  const handleOAuthUrl = useCallback(async (url: string) => {
    // Partner invite link
    if (url.includes('partner/join')) {
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        if (code) {
          usePartnerStore.getState().setPendingInviteCode(code);
        }
      } catch {
        // ignore malformed URL
      }
      return;
    }

    if (!url.includes('auth/callback')) return;
    try {
      const parsed = new URL(url);
      const code = parsed.searchParams.get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        return;
      }
      const hash = parsed.hash.startsWith('#') ? parsed.hash.substring(1) : '';
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    } catch {
      // deep link parse failed — ignore
    }
  }, []);

  useEffect(() => {
    // Handle OAuth redirect on cold start
    void Linking.getInitialURL().then((url) => {
      if (url) void handleOAuthUrl(url);
    });

    // Handle OAuth redirect while app is running
    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleOAuthUrl(url);
    });

    return () => sub.remove();
  }, [handleOAuthUrl]);

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    void onLayoutReady();
  }, [onLayoutReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.automateai.transformr">
          <QueryClientProvider client={queryClient}>
            <ThemeProvider mode={themeMode}>
              <StatusBar style="light" />
              <Slot />
            </ThemeProvider>
          </QueryClientProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
