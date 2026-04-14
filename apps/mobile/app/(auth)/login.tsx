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
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';
// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { useAuthStore } from '@stores/authStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { hapticLight } from '@utils/haptics';
import { isValidEmail } from '@utils/validators';

const GYM_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80';

// Google branded "G" icon — Google blue
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '700', color: '#4285F4', marginRight: 8, lineHeight: size + 2 }}>
      G
    </Text>
  );
}

export default function LoginScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, loading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  // Entrance animations
  const iconScale = useSharedValue(0.6);
  const iconOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(24);
  const socialOpacity = useSharedValue(0);

  useEffect(() => {
    iconScale.value = withSpring(1, { damping: 12, stiffness: 120 });
    iconOpacity.value = withTiming(1, { duration: 400 });
    titleOpacity.value = withDelay(180, withTiming(1, { duration: 500 }));
    formOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    formTranslateY.value = withDelay(400, withSpring(0, { damping: 16 }));
    socialOpacity.value = withDelay(620, withTiming(1, { duration: 400 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));
  const titleAnimStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const formAnimStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));
  const socialAnimStyle = useAnimatedStyle(() => ({ opacity: socialOpacity.value }));

  const handleSignIn = useCallback(async () => {
    clearError();
    setEmailError('');
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (password.length < 1) return;
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
      {/* Gradient: let image breathe at top, solid at bottom */}
      <LinearGradient
        colors={[
          'rgba(12,10,21,0.35)',
          'rgba(12,10,21,0.60)',
          'rgba(12,10,21,0.92)',
          '#0C0A15',
        ]}
        locations={[0, 0.3, 0.55, 0.75]}
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
            <Animated.View style={[styles.logoSection, iconAnimStyle]}>
              {/* Purple glow behind icon */}
              <View style={styles.iconGlow} />
              <Image
                source={require('@assets/images/icon.png')}
                style={styles.icon}
                contentFit="contain"
              />
            </Animated.View>

            <Animated.View style={[styles.brandBlock, titleAnimStyle]}>
              <Text style={styles.heroTitle}>TRANSFORMR</Text>
              <Text style={styles.tagline}>
                Every rep. Every meal. Every dollar. Every day.
              </Text>
            </Animated.View>

            <Animated.View style={formAnimStyle}>
              {/* Error Banner */}
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
                onChangeText={setPassword}
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
            <Animated.View style={[styles.dividerRow, socialAnimStyle]}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* Social Auth Buttons */}
            <Animated.View style={socialAnimStyle}>
              <Pressable
                onPress={() => { hapticLight(); signInWithApple(); }}
                style={({ pressed }) => [styles.socialBtn, pressed && styles.socialBtnPressed]}
              >
                <Ionicons name="logo-apple" size={20} color="#F0F0FC" />
                <Text style={styles.socialBtnText}>Continue with Apple</Text>
              </Pressable>

              <Pressable
                onPress={() => { hapticLight(); signInWithGoogle(); }}
                style={({ pressed }) => [styles.socialBtn, pressed && styles.socialBtnPressed, { marginBottom: 24 }]}
              >
                <GoogleIcon size={18} />
                <Text style={styles.socialBtnText}>Continue with Google</Text>
              </Pressable>

              {/* Sign Up Link */}
              <View style={styles.signUpRow}>
                <Text style={styles.signUpText}>Don't have an account?{' '}</Text>
                <Pressable
                  onPress={() => { hapticLight(); handleSignUp(); }}
                  accessibilityLabel="Sign up for an account"
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
  logoSection: { alignItems: 'center', marginBottom: 16 },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168,85,247,0.15)',
    top: -20,
  },
  icon: { width: 100, height: 100 },
  brandBlock: { alignItems: 'center', marginBottom: 40 },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#A855F7',
    letterSpacing: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(168,85,247,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 14,
    color: '#9B8FC0',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  // Error
  errorBanner: {
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  // Forgot
  forgotRow: { alignSelf: 'flex-end', marginBottom: 28, paddingVertical: 4 },
  forgotText: { fontSize: 13, color: '#A855F7', fontWeight: '500' },
  // Sign In button
  signInBtn: {
    backgroundColor: '#A855F7',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  signInBtnPressed: { opacity: 0.88 },
  signInBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 1 },
  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2248' },
  dividerText: { fontSize: 12, color: '#6B5E8A', marginHorizontal: 16, fontWeight: '500', letterSpacing: 1 },
  // Social buttons
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,18,42,0.8)',
    borderWidth: 1,
    borderColor: '#2A2248',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
    gap: 10,
  },
  socialBtnPressed: { borderColor: '#362C5E', backgroundColor: 'rgba(30,24,56,0.9)' },
  socialBtnText: { fontSize: 16, color: '#F0F0FC', fontWeight: '500' },
  // Sign up
  signUpRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signUpText: { fontSize: 15, color: '#9B8FC0' },
  signUpLink: { fontSize: 15, fontWeight: '700', color: '#A855F7' },
});
