// =============================================================================
// TRANSFORMR -- PRCelebration
// Full-screen PR overlay with confetti. Mounted once at root layout.
// Triggered via ref.celebrate(liftName, achievement).
// =============================================================================

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  useAnimatedStyle,
  cancelAnimation,
  makeMutable,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { triggerHaptic } from '@/constants/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface PRCelebrationHandle {
  celebrate(liftName: string, achievement: string): void;
}

type ConfettiParticle = {
  x: ReturnType<typeof makeMutable<number>>;
  y: ReturnType<typeof makeMutable<number>>;
  rotation: ReturnType<typeof makeMutable<number>>;
  opacity: ReturnType<typeof makeMutable<number>>;
  vx: number;
  vy: number;
};

// ---------------------------------------------------------------------------
// Sub-component: individual confetti piece
// ---------------------------------------------------------------------------
function ConfettiPiece({ p }: { p: ConfettiParticle }) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: p.x.value },
      { translateY: p.y.value },
      { rotate: `${p.rotation.value}deg` },
    ],
    opacity: p.opacity.value,
  }));

  return <Animated.View style={[styles.confettiPiece, style]} />;
}

export const PRCelebration = forwardRef<PRCelebrationHandle, Record<string, never>>(
  (_props, ref) => {
    const { colors, typography, spacing, borderRadius } = useTheme();
    const [isVisible, setIsVisible] = useState(false);

    // Store liftName/achievement in state so back-to-back celebrate() calls re-render the badge
    const [displayData, setDisplayData] = useState({ liftName: '', achievement: '' });

    // Timer refs — dismiss and delayed haptics
    const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hapticTimer1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hapticTimer2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Badge scale animation
    const badgeScale = useSharedValue(0);

    // Dismiss text opacity
    const dismissOpacity = useSharedValue(0);

    // Pre-create 40 confetti particles at mount
    const confetti = useRef<ConfettiParticle[]>(
      Array.from({ length: 40 }, () => ({
        x: makeMutable(0),
        y: makeMutable(0),
        rotation: makeMutable(0),
        opacity: makeMutable(0),
        vx: (Math.random() - 0.5) * 300,
        vy: -(Math.random() * 400 + 200),
      })),
    ).current;

    const cancelAllConfetti = () => {
      confetti.forEach((p) => {
        cancelAnimation(p.x);
        cancelAnimation(p.y);
        cancelAnimation(p.rotation);
        cancelAnimation(p.opacity);
        p.opacity.value = 0;
      });
    };

    const dismiss = () => {
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      // Cancel pending haptic timers
      if (hapticTimer1Ref.current !== null) { clearTimeout(hapticTimer1Ref.current); hapticTimer1Ref.current = null; }
      if (hapticTimer2Ref.current !== null) { clearTimeout(hapticTimer2Ref.current); hapticTimer2Ref.current = null; }
      cancelAllConfetti();
      cancelAnimation(badgeScale);
      cancelAnimation(dismissOpacity);
      badgeScale.value = 0;
      dismissOpacity.value = 0;
      setIsVisible(false);
    };

    useImperativeHandle(ref, () => ({
      celebrate(liftName: string, achievement: string) {
        // Cancel any in-flight celebration before starting a new one
        if (dismissTimerRef.current !== null) { clearTimeout(dismissTimerRef.current); dismissTimerRef.current = null; }
        if (hapticTimer1Ref.current !== null) { clearTimeout(hapticTimer1Ref.current); hapticTimer1Ref.current = null; }
        if (hapticTimer2Ref.current !== null) { clearTimeout(hapticTimer2Ref.current); hapticTimer2Ref.current = null; }
        cancelAllConfetti();
        cancelAnimation(badgeScale);
        cancelAnimation(dismissOpacity);

        setDisplayData({ liftName, achievement });

        // Reset animations
        badgeScale.value = 0;
        dismissOpacity.value = 0;

        setIsVisible(true);

        // Haptic sequence (store refs for cleanup)
        void triggerHaptic('achievement');
        hapticTimer1Ref.current = setTimeout(() => { void triggerHaptic('achievement'); hapticTimer1Ref.current = null; }, 200);
        hapticTimer2Ref.current = setTimeout(() => { void triggerHaptic('achievement'); hapticTimer2Ref.current = null; }, 400);

        // Fire confetti — pure Reanimated 3
        confetti.forEach((p) => {
          p.x.value = 0;
          p.y.value = 0;
          p.opacity.value = 1;
          p.rotation.value = 0;

          p.x.value = withTiming(p.vx, {
            duration: 2000,
            easing: Easing.out(Easing.quad),
          });
          p.y.value = withTiming(p.vy + 600, {
            duration: 2000,
            easing: Easing.in(Easing.quad),
          });
          p.rotation.value = withTiming(Math.random() * 720, { duration: 2000 });
          p.opacity.value = withSequence(
            withTiming(1, { duration: 200 }),
            withDelay(1400, withTiming(0, { duration: 400 })),
          );
        });

        // Badge entrance
        badgeScale.value = withDelay(
          300,
          withSpring(1.0, { stiffness: 200, damping: 18 }),
        );

        // Dismiss hint
        dismissOpacity.value = withDelay(2800, withTiming(1, { duration: 300 }));

        // Auto-dismiss
        dismissTimerRef.current = setTimeout(() => {
          dismissTimerRef.current = null;
          cancelAllConfetti();
          cancelAnimation(badgeScale);
          cancelAnimation(dismissOpacity);
          badgeScale.value = 0;
          dismissOpacity.value = 0;
          setIsVisible(false);
        }, 3200);
      },
    }));

    const badgeStyle = useAnimatedStyle(() => ({
      transform: [{ scale: badgeScale.value }],
    }));

    const dismissTextStyle = useAnimatedStyle(() => ({
      opacity: dismissOpacity.value,
    }));

    if (!isVisible) return null;

    return (
      <Pressable
        style={styles.overlay}
        onPress={dismiss}
        accessibilityLabel="Dismiss PR celebration"
        accessibilityRole="button"
      >
        {/* Background tint — design constant rgba */}
        <View style={styles.background} pointerEvents="none" />

        {/* Confetti */}
        <View style={styles.confettiContainer} pointerEvents="none">
          {confetti.map((p, i) => (
            <ConfettiPiece key={i} p={p} />
          ))}
        </View>

        {/* PR Badge card */}
        <View style={styles.badgeShadow} pointerEvents="none">
        <Animated.View
          style={[
            styles.badge,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
            },
            badgeStyle,
          ]}
          pointerEvents="none"
        >
          <Text style={[typography.h1, { color: '#FFFFFF', textAlign: 'center' }]}>
            🏆 NEW PR
          </Text>
          <Text
            style={[
              typography.h2,
              { color: '#FFFFFF', textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            {displayData.liftName}
          </Text>
          <Text
            style={[
              typography.bodyBold,
              {
                color: 'rgba(255,255,255,0.85)',
                textAlign: 'center',
                marginTop: spacing.xs,
              },
            ]}
          >
            {displayData.achievement}
          </Text>
        </Animated.View>
        </View>

        {/* Dismiss hint */}
        <Animated.Text
          style={[
            typography.caption,
            { color: 'rgba(255,255,255,0.7)', marginTop: spacing.xl },
            dismissTextStyle,
          ]}
          pointerEvents="none"
        >
          Tap to dismiss
        </Animated.Text>
      </Pressable>
    );
  },
);

PRCelebration.displayName = 'PRCelebration';

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(168,85,247,0.15)', /* design constant: PR overlay tint */
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2,
    left: SCREEN_WIDTH / 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A855F7', /* design constant: confetti accent */
  },
  badgeShadow: {
    shadowColor: '#000', /* design constant: shadow always black */
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  badge: {
    minWidth: 260,
  },
});
