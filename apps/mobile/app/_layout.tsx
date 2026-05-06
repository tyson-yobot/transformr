// =============================================================================
// TRANSFORMR -- Root Layout
// =============================================================================

import { useEffect, useCallback, useState, useRef } from 'react';
import { InteractionManager, Linking, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Slot, useRouter } from 'expo-router';
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
import {
  registerForPushNotifications,
  savePushToken,
  addNotificationResponseListener,
} from '@services/notifications';
import * as Notifications from 'expo-notifications';
import { notificationsLog } from '@/utils/notificationsLog';

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

// ---------------------------------------------------------------------------
// Notification helpers (Guards 1-6)
// ---------------------------------------------------------------------------

/** Guard 2 — Hard timeout on every async notification call */
async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T | null> {
  const TIMEOUT_COPY: Record<string, string> = {
    getLastNotificationResponseAsync:
      `getLastNotificationResponseAsync timed out after ${ms}ms; treating as no pending tap`,
    registerForPushNotifications:
      `registerForPushNotifications timed out after ${ms}ms; will retry on next foreground`,
  };
  return Promise.race([
    p,
    new Promise<null>((resolve) =>
      setTimeout(() => {
        notificationsLog.warn(TIMEOUT_COPY[label] ?? `${label} timed out after ${ms}ms`);
        resolve(null);
      }, ms),
    ),
  ]);
}

/** Guard 5 — Idempotency flag, reset on sign-out */
let pushTokenRegistered = false;

/** Deep link map for notification tap routing (Fix 3) */
const DEEP_LINK_ROUTES: Record<string, string> = {
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

function AppStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const listenToAuthChanges = useAuthStore((s) => s.listenToAuthChanges);
  useOfflineSync();
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const notificationSubRef = useRef<Notifications.EventSubscription | null>(null);

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

  // ---------------------------------------------------------------------------
  // Fix 1 — Push token registration on auth state change (Guards 1-6)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        pushTokenRegistered = false; // Guard 5: reset on sign-out
        return;
      }

      if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') return;

      // Guard 4 — Session presence check
      const userId = session?.user?.id;
      if (!userId) {
        notificationsLog.debug('skipping push token: no user id');
        return;
      }

      // Guard 5 — Idempotency (set eagerly to prevent race between rapid auth events)
      if (pushTokenRegistered) return;
      pushTokenRegistered = true;

      // Guard 1 — Defer to after first frame
      InteractionManager.runAfterInteractions(() => {
        void (async () => {
          try { // Guard 3 — try/catch
            notificationsLog.debug('deferred setup starting'); // Guard 6

            // Guard 2 — 15s timeout on cold-start registration
            const token = await withTimeout(
              registerForPushNotifications(),
              15000,
              'registerForPushNotifications',
            );

            if (!token) {
              notificationsLog.debug('no push token returned, skipping save (expected on emulator/simulator)');
              notificationsLog.debug('deferred setup complete'); // Guard 6
              return;
            }

            await withTimeout(savePushToken(userId, token), 5000, 'savePushToken');

            notificationsLog.debug('deferred setup complete'); // Guard 6
          } catch (err) {
            // Guard 3 — never throw up the React tree
            notificationsLog.warn('push token setup failed:', err);
          }
        })();
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Fix 3 — Notification tap handler with deep-link routing (Guards 1-3, 6)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Guard 1 — Defer to after first frame
    const handle = InteractionManager.runAfterInteractions(() => {
      try { // Guard 3
        // Subscribe to taps while app is foregrounded
        notificationSubRef.current = addNotificationResponseListener((response) => {
          try {
            const deepLink =
              (response.notification.request.content.data as Record<string, unknown> | undefined)
                ?.deep_link as string | undefined;
            const route = deepLink ? DEEP_LINK_ROUTES[deepLink] : undefined;
            if (route) {
              routerRef.current.push(route as never);
            } else {
              if (deepLink) {
                notificationsLog.warn('unmapped deep_link:', deepLink);
              }
              routerRef.current.push('/(tabs)/dashboard' as never);
            }
          } catch (err) {
            notificationsLog.warn('tap handler error:', err);
          }
        });

        // Guard 2 — Handle cold-start tap with timeout (15s for cold start)
        void (async () => {
          try {
            const lastResponse = await withTimeout(
              Notifications.getLastNotificationResponseAsync(),
              15000,
              'getLastNotificationResponseAsync',
            );
            if (lastResponse) {
              const deepLink =
                (lastResponse.notification.request.content.data as Record<string, unknown> | undefined)
                  ?.deep_link as string | undefined;
              const route = deepLink ? DEEP_LINK_ROUTES[deepLink] : undefined;
              routerRef.current.push((route ?? '/(tabs)/dashboard') as never);
            }
          } catch (err) {
            notificationsLog.warn('cold-start tap check failed:', err);
          }
        })();
      } catch (err) {
        notificationsLog.warn('tap handler setup failed:', err);
      }
    });

    return () => {
      handle.cancel();
      notificationSubRef.current?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
