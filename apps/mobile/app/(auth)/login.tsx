// =============================================================================
// TRANSFORMR -- Login Screen
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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';
import { useAuthStore } from '@stores/authStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { hapticLight } from '@utils/haptics';
import { isValidEmail } from '@utils/validators';

const GYM_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80';

export default function LoginScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, loading, error, clearError } = useAuthStore();

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
    <View style={styles.root}>
      {/* Warm gym background */}
      <Image
        source={{ uri: GYM_IMAGE }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['rgba(12,10,21,0.75)', 'rgba(12,10,21,0.92)', '#0C0A15']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
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
            <Animated.View entering={FadeInDown.delay(100)} style={[styles.logoSection, { marginBottom: spacing.xxxl }]}>
              <Image
                source={require('@assets/images/icon.png')}
                style={[styles.icon, { marginBottom: spacing.md }]}
                contentFit="contain"
              />
              <Text style={[typography.hero, { color: colors.accent.primary, letterSpacing: 6, textAlign: 'center' }]}>
                TRANSFORMR
              </Text>
              <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' }]}>
                Every rep. Every meal. Every dollar. Every day.
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
                <Text style={[typography.caption, { color: colors.accent.danger }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Email Input */}
            <Animated.View entering={FadeInDown.delay(200)}>
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
            </Animated.View>

            {/* Password Input */}
            <Animated.View entering={FadeInDown.delay(300)}>
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
            </Animated.View>

            {/* Forgot Password */}
            <Pressable
              onPress={() => { hapticLight(); handleForgotPassword(); }}
              accessibilityLabel="Forgot password"
              style={[styles.forgotRow, { marginBottom: spacing.xxl }]}
            >
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
              onPress={() => { hapticLight(); signInWithApple(); }}
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
              onPress={() => { hapticLight(); signInWithGoogle(); }}
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
              <Pressable
                onPress={() => { hapticLight(); handleSignUp(); }}
                accessibilityLabel="Sign up for an account"
              >
                <Text style={[typography.bodyBold, { color: colors.accent.primary }]}>
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0A15' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  logoSection: { alignItems: 'center' },
  icon: { width: 80, height: 80 },
  errorBanner: {},
  forgotRow: { alignSelf: 'flex-end' },
  dividerRow: { flexDirection: 'row', alignItems: 'center' },
  dividerLine: { flex: 1, height: 1 },
  signUpRow: { flexDirection: 'row', justifyContent: 'center' },
});
