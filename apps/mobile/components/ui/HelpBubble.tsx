import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@theme/index';

interface HelpBubbleProps {
  id: string;
  message: string;
  position: 'above' | 'below';
  showOnce?: boolean;
  delay?: number;
}

const DISMISS_PREFIX = 'helpbubble_dismissed_';
const AUTO_HIDE_MS = 10000;
const PULSE_DURATION_MS = 2000;

export function HelpBubble({
  id,
  message,
  position,
  showOnce = true,
  delay = 1500,
}: HelpBubbleProps): React.JSX.Element | null {
  const { colors, spacing, borderRadius, typography } = useTheme();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checked, setChecked] = useState(false);

  const pulseOpacity = useSharedValue(0.3);

  const pulsingStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(1.0, { duration: PULSE_DURATION_MS }),
      -1,
      true,
    );
  }, [pulseOpacity]);

  useEffect(() => {
    let mounted = true;

    const checkDismissed = async (): Promise<void> => {
      if (showOnce) {
        const value = await AsyncStorage.getItem(`${DISMISS_PREFIX}${id}`);
        if (value !== null) {
          if (mounted) {
            setDismissed(true);
            setChecked(true);
          }
          return;
        }
      }
      if (mounted) {
        setChecked(true);
      }
    };

    checkDismissed();

    return () => {
      mounted = false;
    };
  }, [id, showOnce]);

  useEffect(() => {
    if (!checked || dismissed) return;

    const showTimer = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => {
      clearTimeout(showTimer);
    };
  }, [checked, dismissed, delay]);

  useEffect(() => {
    if (!visible) return;

    const autoHideTimer = setTimeout(() => {
      setVisible(false);
      setDismissed(true);
    }, AUTO_HIDE_MS);

    return () => {
      clearTimeout(autoHideTimer);
    };
  }, [visible]);

  const handleDismiss = useCallback(async (): Promise<void> => {
    setVisible(false);
    setDismissed(true);
    await AsyncStorage.setItem(`${DISMISS_PREFIX}${id}`, '1');
  }, [id]);

  if (!visible || dismissed) {
    return null;
  }

  const enterAnimation = position === 'below'
    ? FadeInDown.duration(300).withInitialValues({ transform: [{ translateY: -4 }] })
    : FadeInUp.duration(300).withInitialValues({ transform: [{ translateY: 4 }] });

  const styles = StyleSheet.create({
    container: {
      marginVertical: spacing.sm,
    },
    bubble: {
      backgroundColor: 'rgba(30, 24, 56, 0.95)',
      borderLeftWidth: 3,
      borderLeftColor: colors.accent.cyan,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    pulsingDot: {
      width: 6,
      height: 6,
      borderRadius: borderRadius.full,
      backgroundColor: colors.accent.cyan,
      marginRight: spacing.sm,
      marginTop: 4,
    },
    contentContainer: {
      flex: 1,
    },
    messageText: {
      ...typography.caption,
      color: colors.text.secondary,
    },
    dismissButton: {
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
    },
    dismissText: {
      ...typography.captionBold,
      color: colors.accent.cyan,
    },
  });

  return (
    <Animated.View
      entering={enterAnimation}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <Pressable onPress={handleDismiss} accessibilityRole="button" accessibilityLabel="Dismiss help tip">
        <View style={styles.bubble}>
          <Animated.View style={[styles.pulsingDot, pulsingStyle]} />
          <View style={styles.contentContainer}>
            <Text style={styles.messageText}>{message}</Text>
            <Pressable onPress={handleDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
