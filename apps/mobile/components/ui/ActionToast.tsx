// =============================================================================
// TRANSFORMR — ActionToast + useActionToast
// Lightweight per-screen confirmation toast for write operations.
// Appears at the top of the screen, auto-dismisses after 2.2 s.
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'pr' | 'streak' | 'info';

interface ActionToastProps {
  message: string;
  subtext?: string;
  visible: boolean;
  onHide: () => void;
  type?: ToastType;
}

const ICON_MAP: Record<ToastType, React.ComponentProps<typeof Ionicons>['name']> = {
  success: 'checkmark-circle',
  pr:      'trophy',
  streak:  'flame',
  info:    'information-circle',
};

export function ActionToast({
  message,
  subtext,
  visible,
  onHide,
  type = 'success',
}: ActionToastProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colorMap: Record<ToastType, string> = {
    success: colors.accent.success,
    pr:      colors.accent.gold,
    streak:  colors.accent.fire,
    info:    colors.accent.info,
  };

  const accentColor = colorMap[type];

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 250 });
      opacity.value = withTiming(1, { duration: 200 });

      timerRef.current = setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 250 });
        opacity.value = withTiming(0, { duration: 250 });
        setTimeout(onHide, 280);
      }, 2200);
    } else {
      translateY.value = withTiming(-100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 12,
          backgroundColor: colors.background.secondary,
          borderColor: accentColor,
          borderRadius: borderRadius.md,
        },
        animatedStyle,
      ]}
    >
      <Ionicons name={ICON_MAP[type]} size={20} color={accentColor} style={{ marginRight: spacing.md }} />
      <View style={styles.textContainer}>
        <Text style={[typography.bodyBold, { color: colors.text.primary }]}>{message}</Text>
        {subtext ? (
          <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]}>
            {subtext}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Hook — manage toast state within a single screen
// ---------------------------------------------------------------------------

interface ToastState {
  message: string;
  subtext?: string;
  type: ToastType;
  visible: boolean;
}

export function useActionToast() {
  const [toast, setToast] = React.useState<ToastState>({
    message: '',
    type: 'success',
    visible: false,
  });

  const show = (
    message: string,
    options?: { subtext?: string; type?: ToastType },
  ) => {
    setToast({
      message,
      subtext: options?.subtext,
      type: options?.type ?? 'success',
      visible: true,
    });
  };

  const hide = () => setToast((prev) => ({ ...prev, visible: false }));

  return { toast, show, hide };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000', /* brand-ok */
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  textContainer: {
    flex: 1,
  },
});
