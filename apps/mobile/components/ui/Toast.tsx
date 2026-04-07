import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

// --- Single toast item ---

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typeConfig: Record<ToastType, { bg: string; icon: string }> = {
    success: { bg: colors.accent.success, icon: '\u2713' },
    error: { bg: colors.accent.danger, icon: '\u2717' },
    warning: { bg: colors.accent.warning, icon: '\u26A0' },
    info: { bg: colors.accent.info, icon: '\u2139' },
  };

  const config = typeConfig[toast.type];

  const dismiss = useCallback(() => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-100, { duration: 250, easing: Easing.in(Easing.cubic) });
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss, opacity, translateY]);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 250 });
    opacity.value = withTiming(1, { duration: 200 });

    const duration = toast.duration ?? 3000;
    timerRef.current = setTimeout(() => {
      dismiss();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.duration, dismiss, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.toastItem,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          borderLeftWidth: 4,
          borderLeftColor: config.bg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.toastIcon, { color: config.bg }]}>{config.icon}</Text>
      <Text
        style={[typography.body, { color: colors.text.primary, flex: 1, marginLeft: spacing.sm }]}
        numberOfLines={2}
      >
        {toast.message}
      </Text>
      <Pressable onPress={dismiss} hitSlop={12}>
        <Text style={[typography.caption, { color: colors.text.muted }]}>{'\u2715'}</Text>
      </Pressable>
    </Animated.View>
  );
}

// --- Toast Manager ---

type ToastListener = (toasts: ToastData[]) => void;

class ToastManagerClass {
  private toasts: ToastData[] = [];
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = [...this.toasts];
    this.listeners.forEach((fn) => fn(snapshot));
  }

  show(type: ToastType, message: string, duration?: number): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.toasts = [...this.toasts, { id, type, message, duration }];
    this.notify();
  }

  dismiss(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  success(message: string, duration?: number): void {
    this.show('success', message, duration);
  }

  error(message: string, duration?: number): void {
    this.show('error', message, duration);
  }

  warning(message: string, duration?: number): void {
    this.show('warning', message, duration);
  }

  info(message: string, duration?: number): void {
    this.show('info', message, duration);
  }
}

export const toastManager = new ToastManagerClass();

// --- Toast Container (mount at app root) ---

export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const handleDismiss = useCallback((id: string) => {
    toastManager.dismiss(id);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  toastIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
});
