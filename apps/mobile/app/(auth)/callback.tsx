// =============================================================================
// TRANSFORMR -- OAuth Callback Screen
// Handles deep link redirect after Google/Apple OAuth.
// =============================================================================

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@theme/index';
import { supabase } from '@services/supabase';

// Complete any pending auth session — required for expo-web-browser OAuth flow
WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallbackScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
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
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary, alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ActivityIndicator color={colors.accent.primary} size="large" />
    </View>
  );
}
