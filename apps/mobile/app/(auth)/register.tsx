// =============================================================================
// TRANSFORMR -- Registration Screen
// =============================================================================

import React, { useState, useCallback, useMemo } from 'react';
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
import { isValidEmail, isValidPassword, isNotEmpty } from '@utils/validators';

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (password.length === 0) return { level: 0, label: '', color: 'transparent' };
  const { errors } = isValidPassword(password);
  const passed = 4 - errors.length;
  if (passed <= 1) return { level: 1, label: 'Weak', color: '#EF4444' };
  if (passed === 2) return { level: 2, label: 'Fair', color: '#F59E0B' };
  if (passed === 3) return { level: 3, label: 'Good', color: '#3B82F6' };
  return { level: 4, label: 'Strong', color: '#22C55E' };
}

export default function RegisterScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { signUp, loading, error, clearError } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};

    if (!isNotEmpty(displayName)) {
      errs.displayName = 'Display name is required';
    }
    if (!isValidEmail(email)) {
      errs.email = 'Please enter a valid email address';
    }
    const { valid, errors: pwErrors } = isValidPassword(password);
    if (!valid && pwErrors[0]) {
      errs.password = pwErrors[0];
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (!agreedToTerms) {
      errs.terms = 'You must agree to the Terms of Service';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [displayName, email, password, confirmPassword, agreedToTerms]);

  const handleSignUp = useCallback(async () => {
    clearError();
    if (!validate()) return;
    await signUp(email, password, displayName);

    // If sign-up succeeds the auth listener will update session,
    // and the root index will redirect to onboarding.
  }, [validate, email, password, displayName, signUp, clearError]);

  const handleSignIn = useCallback(() => {
    router.push('/(auth)/login');
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
              Create Account
            </Text>
            <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.xxxl }]}>
              Start your transformation journey
            </Text>
          </Animated.View>

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
              <Text style={[typography.caption, { color: colors.accent.danger }]}>{error}</Text>
            </View>
          )}

          {/* Display Name */}
          <Input
            label="Display Name"
            placeholder="What should we call you?"
            value={displayName}
            onChangeText={(t: string) => {
              setDisplayName(t);
              setFieldErrors((prev) => ({ ...prev, displayName: '' }));
            }}
            error={fieldErrors.displayName}
            autoCapitalize="words"
            autoComplete="name"
            containerStyle={{ marginBottom: spacing.lg }}
          />

          {/* Email */}
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t: string) => {
              setEmail(t);
              setFieldErrors((prev) => ({ ...prev, email: '' }));
            }}
            error={fieldErrors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            containerStyle={{ marginBottom: spacing.lg }}
          />

          {/* Password */}
          <Input
            label="Password"
            placeholder="Create a strong password"
            value={password}
            onChangeText={(t: string) => {
              setPassword(t);
              setFieldErrors((prev) => ({ ...prev, password: '' }));
            }}
            error={fieldErrors.password}
            secureTextEntry
            autoCapitalize="none"
            containerStyle={{ marginBottom: spacing.sm }}
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={[styles.strengthRow, { marginBottom: spacing.lg }]}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          level <= passwordStrength.level
                            ? passwordStrength.color
                            : colors.background.tertiary,
                        borderRadius: 2,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[typography.caption, { color: passwordStrength.color, marginLeft: spacing.sm }]}>
                {passwordStrength.label}
              </Text>
            </View>
          )}

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(t: string) => {
              setConfirmPassword(t);
              setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }}
            error={fieldErrors.confirmPassword}
            secureTextEntry
            autoCapitalize="none"
            containerStyle={{ marginBottom: spacing.xl }}
          />

          {/* Terms Checkbox */}
          <Pressable
            onPress={() => {
              hapticLight();
              setAgreedToTerms(!agreedToTerms);
              setFieldErrors((prev) => ({ ...prev, terms: '' }));
            }}
            accessibilityLabel="Agree to terms of service"
            style={[styles.termsRow, { marginBottom: spacing.xxl }]}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: fieldErrors.terms ? colors.accent.danger : colors.border.default,
                  borderRadius: borderRadius.sm / 2,
                  backgroundColor: agreedToTerms ? colors.accent.primary : 'transparent',
                },
              ]}
            >
              {agreedToTerms && (
                <Text style={{ color: '#FFFFFF', fontSize: 12, lineHeight: 14 }}>
                  {'\u2713'}
                </Text>
              )}
            </View>
            <Text style={[typography.caption, { color: colors.text.secondary, flex: 1, marginLeft: spacing.sm }]}>
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </Pressable>
          {fieldErrors.terms && (
            <Text
              style={[
                typography.caption,
                { color: colors.accent.danger, marginTop: -spacing.lg, marginBottom: spacing.lg },
              ]}
            >
              {fieldErrors.terms}
            </Text>
          )}

          {/* Create Account Button */}
          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginBottom: spacing.xxl }}
          />

          {/* Sign In Link */}
          <View style={styles.signInRow}>
            <Text style={[typography.body, { color: colors.text.secondary }]}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => { hapticLight(); handleSignIn(); }} accessibilityLabel="Go to sign in">
              <Text style={[typography.bodyBold, { color: colors.accent.primary }]}>Sign In</Text>
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
  scroll: { flexGrow: 1 },
  errorBanner: {},
  strengthRow: { flexDirection: 'row', alignItems: 'center' },
  strengthBars: { flexDirection: 'row', flex: 1, gap: 4 },
  strengthBar: { flex: 1, height: 4 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  signInRow: { flexDirection: 'row', justifyContent: 'center' },
});
