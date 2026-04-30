// =============================================================================
// TRANSFORMR -- Root Layout
// =============================================================================

import { useEffect, useCallback, useState, useRef } from 'react';
import { Linking, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Slot, useRouter, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ThemeProvider, useTheme } from '@theme/index';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuthStore } from '@stores/authStore';
import { usePartnerStore } from '@stores/partnerStore';
import { useOfflineSync } from '@hooks/useOfflineSync';
import { supabase } from '@services/supabase';
import { SplashOverlay } from '@components/SplashOverlay';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  savePushToken,
  addNotificationResponseListener,
} from '@services/notifications';

// Suppress dev-overlay for expected network failures — Supabase unreachable in emulator dev mode.
// All fetch errors are caught and shown as friendly UI states; the overlay adds no value.
LogBox.ignoreLogs(['Network request failed']);

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
      // Only retry once; use exponential backoff so a network failure does not
      // create a tight retry loop (default linear delay is 1s per attempt).
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30_000),
      // Pause queries automatically while the device is offline so React Query
      // does not hammer the network when Supabase is unreachable.
      networkMode: 'online',
      // Reduce background refetch storms — prevents unnecessary network threads
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Deep-link map for notification tap routing
const NOTIFICATION_DEEP_LINK_MAP: Record<string, string> = {
  'transformr://dashboard': '/(tabs)/dashboard',
  'transformr://nutrition': '/(tabs)/nutrition',
  'transformr://nutrition/add': '/(tabs)/nutrition/add-food',
  'transformr://workout/start': '/(tabs)/fitness/workout-player',
  'transformr://workout/log': '/(tabs)/fitness',
  'transformr://goals': '/(tabs)/goals',
  'transformr://goals/journal': '/(tabs)/goals/journal',
  'transformr://goals/sleep': '/(tabs)/goals/sleep',
  'transformr://goals/habits': '/(tabs)/goals/habits',
  'transformr://partner': '/(tabs)/profile/partner',
  'transformr://profile': '/(tabs)/profile',
};

function AppStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const listenToAuthChanges = useAuthStore((s) => s.listenToAuthChanges);
  const session = useAuthStore((s) => s.session);
  const pushTokenRegistered = useRef(false);
  const router = useRouter();
  useOfflineSync();
  const [showSplash, setShowSplash] = useState(true);

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

      // PKCE code exchange is handled by authStore (foreground) or callback.tsx (fallback).
      // Do NOT call exchangeCodeForSession here — a PKCE code is single-use and a
      // duplicate exchange attempt causes an "invalid grant" race condition.
      const code = parsed.searchParams.get('code');
      if (code) {
        // Deep link will be routed by Expo Router to callback.tsx
        return;
      }

      // Hash-based token (implicit flow fallback)
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

  // Hide the custom SplashOverlay once fonts are loaded (no artificial delay).
  // Also call hideAsync() directly here — the SplashOverlay onLayout callback
  // may never fire if React batches the mount+unmount into a single UI-thread
  // commit (fonts load immediately from cache, so the SplashOverlay can be
  // removed before native performs a layout pass).
  useEffect(() => {
    if (fontsLoaded) {
      setShowSplash(false);
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Bug 1: Register push token on sign-in and cold-start with existing session
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || pushTokenRegistered.current) return;
    pushTokenRegistered.current = true;

    void (async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await savePushToken(userId, token);
        }
      } catch {
        // Push token registration must not block app usage
      }
    })();
  }, [session?.user?.id]);

  // Bug 3: Handle notification taps (foreground + cold-start)
  useEffect(() => {
    function handleNotificationResponse(response: Notifications.NotificationResponse) {
      const deepLink = response.notification.request.content.data?.deep_link as string | undefined;
      const route = deepLink ? NOTIFICATION_DEEP_LINK_MAP[deepLink] : undefined;
      if (!route) {
        if (deepLink) {
          console.warn(`[Notifications] Unknown deep_link: ${deepLink}`);
        }
        router.push('/(tabs)/dashboard');
        return;
      }
      router.push(route as Href);
    }

    const subscription = addNotificationResponseListener(handleNotificationResponse);

    // Cold-start: app launched from a notification tap
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.automateai.transformr">
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AppStatusBar />
              <Slot />
              <SplashOverlay visible={showSplash} onReady={() => void SplashScreen.hideAsync()} />
            </ThemeProvider>
          </QueryClientProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
