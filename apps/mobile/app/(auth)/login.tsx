// =============================================================================
// TRANSFORMR -- Login Screen
// =============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAuthStore } from '@stores/authStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { isValidEmail } from '@utils/validators';

export default function LoginScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { signIn, loading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSignIn = useCallback(async () => {
    clearError();
    setEmailError('');

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (password.length < 1) {
      return;
    }

    await signIn(email, password);
  }, [email, password, signIn, clearError]);

  const handleForgotPassword = useCallback(() => {
    router.push('/(auth)/forgot-password');
  }, [router]);

  const handleSignUp = useCallback(() => {
    router.push('/(auth)/register');
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
          {/* Logo / Brand */}
          <View style={[styles.logoSection, { marginBottom: spacing.xxxl }]}>
            <Text style={[typography.hero, { color: colors.accent.primary, letterSpacing: 4 }]}>
              TRANSFORMR
            </Text>
            <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.sm }]}>
              Every rep. Every meal. Every dollar. Every day.
            </Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View
              style={[
                styles.errorBanner,
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
              <Text style={[typography.caption, { color: colors.accent.danger }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Email Input */}
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text: string) => {
              setEmail(text);
              setEmailError('');
            }}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            containerStyle={{ marginBottom: spacing.lg }}
          />

          {/* Password Input */}
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            containerStyle={{ marginBottom: spacing.sm }}
          />

          {/* Forgot Password */}
          <Pressable onPress={handleForgotPassword} style={[styles.forgotRow, { marginBottom: spacing.xxl }]}>
            <Text style={[typography.caption, { color: colors.accent.primary }]}>
              Forgot Password?
            </Text>
          </Pressable>

          {/* Sign In Button */}
          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginBottom: spacing.xl }}
          />

          {/* Divider */}
          <View style={[styles.dividerRow, { marginBottom: spacing.xl }]}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border.default }]} />
            <Text style={[typography.caption, { color: colors.text.muted, marginHorizontal: spacing.md }]}>
              OR
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border.default }]} />
          </View>

          {/* Social Auth Buttons */}
          <Button
            title="Continue with Apple"
            onPress={() => {}}
            variant="outline"
            fullWidth
            size="lg"
            leftIcon={
              <Text style={{ fontSize: 18, color: colors.text.primary, marginRight: spacing.sm }}>
                {'\uF8FF'}
              </Text>
            }
            style={{ marginBottom: spacing.md }}
          />
          <Button
            title="Continue with Google"
            onPress={() => {}}
            variant="outline"
            fullWidth
            size="lg"
            leftIcon={
              <Text style={{ fontSize: 16, color: colors.text.primary, marginRight: spacing.sm }}>
                G
              </Text>
            }
            style={{ marginBottom: spacing.xxxl }}
          />

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={[typography.body, { color: colors.text.secondary }]}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={handleSignUp}>
              <Text style={[typography.bodyBold, { color: colors.accent.primary }]}>
                Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  logoSection: { alignItems: 'center' },
  errorBanner: {},
  forgotRow: { alignSelf: 'flex-end' },
  dividerRow: { flexDirection: 'row', alignItems: 'center' },
  dividerLine: { flex: 1, height: 1 },
  signUpRow: { flexDirection: 'row', justifyContent: 'center' },
});
