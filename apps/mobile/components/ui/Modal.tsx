import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

interface ModalProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  showCloseButton?: boolean;
  showHandle?: boolean;
  /** When false, backdrop press and close button are disabled. Default: true */
  dismissable?: boolean;
  children: React.ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function Modal({
  visible,
  onDismiss,
  title,
  showCloseButton = true,
  showHandle = true,
  dismissable = true,
  children,
}: ModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const isRendered = useSharedValue(false);

  useEffect(() => {
    if (visible) {
      isRendered.value = true;
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible, translateY, backdropOpacity, isRendered]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0 ? 'auto' as const : 'none' as const,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleBackdropPress = useCallback(() => {
    if (dismissable) onDismiss();
  }, [onDismiss, dismissable]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background.secondary,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
            },
            sheetStyle,
          ]}
        >
          {showHandle && (
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: colors.border.default },
                ]}
              />
            </View>
          )}
          {(title || showCloseButton) && (
            <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingBottom: spacing.md }]}>
              <Text
                style={[typography.h3, { color: colors.text.primary, flex: 1 }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {showCloseButton && dismissable && (
                <Pressable
                  onPress={onDismiss}
                  hitSlop={12}
                  style={[
                    styles.closeButton,
                    { backgroundColor: colors.background.tertiary },
                  ]}
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                >
                  <Text style={[typography.body, { color: colors.text.secondary }]}>
                    {'\u2715'}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          <View style={[styles.content, { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }]}>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 20,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {},
});
