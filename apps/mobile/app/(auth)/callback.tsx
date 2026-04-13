// =============================================================================
// TRANSFORMR -- OAuth Callback Screen
// Handles deep link redirect after Google/Apple OAuth.
// =============================================================================

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';

// Complete any pending auth session — required for expo-web-browser OAuth flow
WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallbackScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Brief delay then navigate home — auth state change is handled by the auth listener
    const timer = setTimeout(() => {
      router.replace('/');
    }, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent.primary} size="large" />
    </View>
  );
}
