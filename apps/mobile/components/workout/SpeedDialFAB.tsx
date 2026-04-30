// =============================================================================
// TRANSFORMR — SpeedDialFAB
// Primary FAB that expands to reveal secondary action buttons
// =============================================================================

import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { hapticLight } from '@utils/haptics';

interface SpeedDialAction {
  icon: string;
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
}

interface SpeedDialFABProps {
  actions: SpeedDialAction[];
  primaryIcon?: string;
  primaryColor?: string;
  bottom?: number;
  right?: number;
}

const SPRING_CONFIG = { damping: 12, stiffness: 200 };
const ACTION_SPACING = 60;

export function SpeedDialFAB({
  actions,
  primaryIcon = 'sparkles',
  bottom = 100,
  right = 20,
}: SpeedDialFABProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const progress = useSharedValue(0);

  const toggle = useCallback(() => {
    const next = !isOpen;
    setIsOpen(next);
    progress.value = withSpring(next ? 1 : 0, SPRING_CONFIG);
    hapticLight();
  }, [isOpen, progress]);

  const handleActionPress = useCallback((action: SpeedDialAction) => {
    setIsOpen(false);
    progress.value = withTiming(0, { duration: 200 });
    hapticLight();
    action.onPress();
  }, [progress]);

  const primaryRotation = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.3,
    pointerEvents: progress.value > 0.1 ? 'auto' as const : 'none' as const,
  }));

  return (
    <>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', zIndex: 90 }, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={toggle} accessibilityLabel="Close actions" />
      </Animated.View>

      {/* FAB container */}
      <View style={[styles.container, { bottom, right, zIndex: 100 }]}>
        {/* Secondary actions */}
        {actions.map((action, index) => {
          const offset = (index + 1) * ACTION_SPACING;
          return (
            <SpeedDialItem
              key={action.label}
              action={action}
              offset={offset}
              progress={progress}
              onPress={() => handleActionPress(action)}
              accentColor={action.color ?? colors.accent.primary}
              glassColor={colors.background.glass}
              textColor={colors.text.inverse}
            />
          );
        })}

        {/* Primary FAB */}
        <Pressable
          onPress={toggle}
          accessibilityLabel={isOpen ? 'Close AI assistant menu' : 'Open AI assistant'}
          accessibilityRole="button"
          style={[
            styles.primaryFab,
            { backgroundColor: colors.accent.cyan, shadowColor: colors.accent.cyan },
          ]}
        >
          <Animated.View style={primaryRotation}>
            <Ionicons name={primaryIcon as keyof typeof Ionicons.glyphMap} size={24} color={colors.text.inverse} />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

interface SpeedDialItemProps {
  action: SpeedDialAction;
  offset: number;
  progress: Animated.SharedValue<number>;
  onPress: () => void;
  accentColor: string;
  glassColor: string;
  textColor: string;
}

function SpeedDialItem({ action, offset, progress, onPress, accentColor, glassColor, textColor }: SpeedDialItemProps) {
  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -offset]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.4, 0.8, 1]) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1]),
  }));

  return (
    <Animated.View style={[styles.actionRow, animStyle]}>
      <Animated.View style={[styles.label, { backgroundColor: glassColor }, labelStyle]}>
        <Text style={[styles.labelText, { color: textColor }]}>{action.label}</Text>
      </Animated.View>
      <Pressable
        onPress={onPress}
        accessibilityLabel={action.accessibilityLabel}
        accessibilityRole="button"
        style={[styles.actionFab, { backgroundColor: accentColor }]}
      >
        <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={20} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'flex-end',
  },
  primaryFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionRow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    marginRight: 6,
  },
  label: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
