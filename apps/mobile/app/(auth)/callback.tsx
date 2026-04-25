// =============================================================================
// TRANSFORMR -- OAuth Callback Screen
// Handles deep link redirect after Google/Apple OAuth.
// =============================================================================

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { supabase } from '@services/supabase';

// Signal completion for iOS/web openAuthSessionAsync flows.
// On Android this is a documented no-op — the code exchange is handled below.
WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallbackScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string | string[]; error?: string | string[] }>();

  // Normalise to scalar — Expo Router may return string or string[]
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const oauthError = Array.isArray(params.error) ? params.error[0] : params.error;

  useEffect(() => {
    if (oauthError) {
      // The OAuth provider returned an error — surface it by returning to login
      router.replace('/login');
      return;
    }

    if (code) {
      // Android deep-link path: openAuthSessionAsync never completes because
      // expo-web-browser's AuthSessionRedirectSingleton is not registered in
      // the current AndroidManifest. Expo Router routes the deep link here
      // instead, so we exchange the PKCE code directly as the fallback path.
      void supabase.auth.exchangeCodeForSession(code).catch(() => {
        router.replace('/login');
      });
    }

    // Navigate as soon as a valid session is detected
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        router.replace('/');
      }
    });

    // Also handle already-authenticated state (token exchanged before listener registered)
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });

    return () => subscription.unsubscribe();
  }, [code, oauthError, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ActivityIndicator color={colors.accent.primary} size="large" />
    </View>
  );
}
