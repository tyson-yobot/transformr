// =============================================================================
// TRANSFORMR -- Login Screen
// =============================================================================

import { useState, useCallback, useEffect, type ComponentType } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { useAuthStore } from '@stores/authStore';
import { Input } from '@components/ui/Input';
import { hapticLight } from '@utils/haptics';
import { isValidEmail } from '@utils/validators';
// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;

const GYM_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80';

// Google "G" icon — white to match dark theme
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '700', color: '#F0F0FC', lineHeight: size + 2 }}>
      G
    </Text>
  );
}

export default function LoginScreen() {
  const { colors, borderRadius } = useTheme();
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, loading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Clear any stale error from previous auth attempts on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSignIn = useCallback(async () => {
    clearError();
    setEmailError('');
    setPasswordError('');
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (password.length < 1) {
      setPasswordError('Please enter your password');
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
    <View style={[styles.root, { backgroundColor: colors.background.primary }]}>
      {/* Warm gym background */}
      <Image
        source={{ uri: GYM_IMAGE }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      {/* Gradient: atmosphere at top, solid form zone at bottom */}
      <LinearGradient
        colors={[
          'rgba(12,10,21,0.10)',
          'rgba(12,10,21,0.35)',
          'rgba(12,10,21,0.80)',
          'rgba(12,10,21,0.95)',
          '#0C0A15',
        ]}
        locations={[0, 0.25, 0.45, 0.65, 0.80]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo / Brand */}
            <Animated.View entering={FadeIn.duration(350)} style={styles.logoSection}>
              {/* Outer glow — very soft, wide */}
              <View style={styles.iconGlowOuter} />
              {/* Inner glow — brighter, tighter */}
              <View style={styles.iconGlow} />
              <Image
                source={require('@assets/images/icon.png')}
                style={styles.icon}
                contentFit="contain"
              />
            </Animated.View>

            {/* Accent gradient line between icon and title */}
            <View style={styles.gradientLine}>
              <LinearGradient
                colors={['#7E22CE', '#A855F7', '#C084FC', '#A855F7', '#7E22CE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: '100%', height: '100%' }}
              />
            </View>

            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.brandBlock}>
              {/* Double-glow title */}
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.heroTitle, styles.heroTitleGlow]}>TRANSFORMR</Text>
                <Text style={styles.heroTitle}>TRANSFORMR</Text>
              </View>
              <Text style={styles.tagline}>
                Every rep. Every meal. Every dollar. Every day.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              {/* Welcome text */}
              <Text style={styles.welcomeText}>Welcome back. Let's keep building.</Text>

              {/* Error Banner — only shown after an action, cleared on mount */}
              {error && (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: colors.accent.danger + '18',
                      borderRadius: borderRadius.md,
                      borderColor: colors.accent.danger + '40',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 13, color: colors.accent.danger, lineHeight: 18 }}>
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
                containerStyle={{ marginBottom: 20 }}
              />

              {/* Password Input */}
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(t: string) => { setPassword(t); setPasswordError(''); }}
                error={passwordError}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                containerStyle={{ marginBottom: 6 }}
              />

              {/* Forgot Password */}
              <Pressable
                onPress={() => { hapticLight(); handleForgotPassword(); }}
                accessibilityLabel="Forgot password"
                style={styles.forgotRow}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>

              {/* Sign In Button */}
              <Pressable
                onPress={handleSignIn}
                disabled={loading}
                style={({ pressed }) => [
                  styles.signInBtn,
                  pressed && styles.signInBtnPressed,
                ]}
              >
                <Text style={styles.signInBtnText}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Divider */}
            <Animated.View entering={FadeInDown.delay(450).duration(300)} style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* Social Auth Buttons */}
            <Animated.View entering={FadeInDown.delay(500).duration(300)}>
              <Pressable
                onPress={() => { hapticLight(); signInWithApple(); }}
                disabled={loading}
                style={({ pressed }) => [styles.socialBtn, pressed && styles.socialBtnPressed, loading && { opacity: 0.5 }]}
              >
                <Ionicons name="logo-apple" size={20} color="#F0F0FC" />
                <Text style={styles.socialBtnText}>Continue with Apple</Text>
              </Pressable>

              <Pressable
                onPress={() => { hapticLight(); signInWithGoogle(); }}
                disabled={loading}
                style={({ pressed }) => [styles.socialBtn, pressed && styles.socialBtnPressed, loading && { opacity: 0.5 }]}
              >
                <GoogleIcon size={18} />
                <Text style={styles.socialBtnText}>Continue with Google</Text>
              </Pressable>

              {/* Trust Indicator */}
              <View style={styles.trustRow}>
                <Ionicons name="lock-closed" size={12} color="#6B5E8A" />
                <Text style={styles.trustText}>256-bit encrypted · Your data stays yours</Text>
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpRow}>
                <Text style={styles.signUpText}>Don't have an account?{' '}</Text>
                <Pressable
                  onPress={() => { hapticLight(); handleSignUp(); }}
                  accessibilityLabel="Sign up for an account"
                  style={{ paddingVertical: 2 }}
                >
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  // Icon / brand
  logoSection: { alignItems: 'center', marginBottom: 8 },
  iconGlowOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,85,247,0.08)',
    top: -50,
  },
  iconGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(168,85,247,0.18)',
    top: -25,
  },
  icon: { width: 100, height: 100 },
  gradientLine: {
    width: 60,
    height: 2,
    borderRadius: 1,
    alignSelf: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  brandBlock: { alignItems: 'center', marginBottom: 16 },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#E2CBFF',
    letterSpacing: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(168,85,247,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  heroTitleGlow: {
    position: 'absolute',
    color: 'rgba(168,85,247,0.3)',
    textShadowRadius: 50,
    textShadowColor: 'rgba(168,85,247,0.6)',
  },
  tagline: {
    fontSize: 14,
    color: '#B8A8D8',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Welcome
  welcomeText: {
    fontSize: 16,
    color: '#F0F0FC',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  // Error
  errorBanner: {
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  // Forgot
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 28,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  forgotText: { fontSize: 13, color: '#C084FC', fontWeight: '500' },
  // Sign In button
  signInBtn: {
    backgroundColor: '#A855F7',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192,132,252,0.3)',
  },
  signInBtnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  signInBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 1.5 },
  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 28 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2248' },
  dividerText: { fontSize: 12, color: '#6B5E8A', marginHorizontal: 20, fontWeight: '600', letterSpacing: 2 },
  // Social buttons
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,18,42,0.7)',
    borderWidth: 1,
    borderColor: '#2A2248',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
    gap: 12,
  },
  socialBtnPressed: { borderColor: '#362C5E', backgroundColor: 'rgba(30,24,56,0.9)' },
  socialBtnText: { fontSize: 16, color: '#F0F0FC', fontWeight: '500' },
  // Trust indicator
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  trustText: { fontSize: 11, color: '#6B5E8A', letterSpacing: 0.5 },
  // Sign up
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingBottom: 40,
  },
  signUpText: { fontSize: 15, color: '#9B8FC0' },
  signUpLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C084FC',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(192,132,252,0.3)',
  },
});
