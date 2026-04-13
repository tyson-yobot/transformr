// =============================================================================
// TRANSFORMR -- Forgot Password Screen
// =============================================================================

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAuthStore } from '@stores/authStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { hapticLight } from '@utils/haptics';
import { isValidEmail } from '@utils/validators';

export default function ForgotPasswordScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { resetPassword, loading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSendReset = useCallback(async () => {
    clearError();
    setEmailError('');

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    await resetPassword(email);

    // If no store error was set, consider it sent
    const currentError = useAuthStore.getState().error;
    if (!currentError) {
      setSent(true);
    }
  }, [email, resetPassword, clearError]);

  const handleBackToLogin = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.primary }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { padding: spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <Text style={[typography.h1, { color: colors.text.primary, marginBottom: spacing.sm }]}>
              Reset Password
            </Text>
            <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.xxxl }]}>
              Enter your email and we'll send you a link to reset your password.
            </Text>
          </Animated.View>

          {/* Error Banner */}
          {error && (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: colors.accent.danger + '18',
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.accent.danger + '40',
                },
              ]}
            >
              <Text style={[typography.caption, { color: colors.accent.danger }]}>{error}</Text>
            </View>
          )}

          {/* Success Message */}
          {sent && !error && (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: colors.accent.success + '18',
                  borderRadius: borderRadius.md,
                  padding: spacing.lg,
                  marginBottom: spacing.xl,
                  borderWidth: 1,
                  borderColor: colors.accent.success + '40',
                },
              ]}
            >
              <Text style={[typography.bodyBold, { color: colors.accent.success, marginBottom: spacing.xs }]}>
                Check your email
              </Text>
              <Text style={[typography.caption, { color: colors.accent.success }]}>
                We've sent a password reset link to {email}. It may take a few minutes to arrive.
              </Text>
            </View>
          )}

          {!sent && (
            <>
              {/* Email Input */}
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={(t: string) => {
                  setEmail(t);
                  setEmailError('');
                }}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                containerStyle={{ marginBottom: spacing.xxl }}
              />

              {/* Send Button */}
              <Button
                title="Send Reset Link"
                onPress={handleSendReset}
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginBottom: spacing.xxl }}
              />
            </>
          )}

          {/* Back to Login */}
          <Pressable onPress={() => { hapticLight(); handleBackToLogin(); }} accessibilityLabel="Back to login" style={styles.backRow}>
            <Text style={[typography.body, { color: colors.accent.primary }]}>
              {'\u2190'} Back to Login
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  banner: {},
  backRow: { alignSelf: 'center' },
});
