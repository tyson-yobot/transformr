// =============================================================================
// TRANSFORMR — Global Error Boundary (Expo Router)
// =============================================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { ErrorBoundaryProps } from 'expo-router';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { EmptyStateBackground } from '@components/ui/EmptyStateBackground';

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@transformr.ai';

export default function ErrorBoundary({ error }: ErrorBoundaryProps) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';

  return (
    <View style={[styles.container, { overflow: 'hidden' }]}>
      <ScreenBackground />
      <AmbientBackground />
      <EmptyStateBackground query="calm minimal dark" opacity={0.20} />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        style={styles.button}
        onPress={() => {
          const subject = encodeURIComponent('TRANSFORMR App Error');
          const body = encodeURIComponent(`Hi TRANSFORMR Support,\n\nI encountered an error in the app:\n\n${message}\n\nPlease help.`);
          void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
        }}
        accessibilityRole="button"
        accessibilityLabel="Get Help"
      >
        <Text style={styles.buttonText}>Get Help</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#0C0A15', /* brand-ok */
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F0F0FC', /* brand-ok */
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B5E8A', /* brand-ok */
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#A855F7', /* brand-ok */
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#F0F0FC', /* brand-ok */
    fontWeight: '600',
    fontSize: 16,
  },
});
