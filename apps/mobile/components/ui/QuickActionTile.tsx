import { memo, useCallback } from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

export interface QuickActionTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accentColor: string;
  dimColor: string;
  onPress: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const QuickActionTile = memo(function QuickActionTile({
  icon, label, accentColor, dimColor, onPress, style,
}: QuickActionTileProps) {
  const { typography, spacing, borderRadius } = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback(() => { scale.value = withSpring(0.94, { damping: 12, stiffness: 400 }); }, [scale]);
  const handlePressOut = useCallback(() => { scale.value = withSpring(1.0, { damping: 14, stiffness: 300 }); }, [scale]);
  const handlePress = useCallback(() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }, [onPress]);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}
      accessibilityRole="button" accessibilityLabel={label}
      style={[{
        flex: 1, borderRadius: borderRadius.lg,
        backgroundColor: dimColor,
        borderWidth: 1, borderColor: `${accentColor}35`,
        padding: spacing.md,
        alignItems: 'center', gap: spacing.xs,
        minHeight: 76,
        justifyContent: 'center',
        shadowColor: accentColor,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
      }, style, animated]}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: accentColor, borderRadius: 2 }} />
      <Ionicons name={icon} size={26} color={accentColor} />
      <Text style={[typography.captionBold, { color: accentColor, textAlign: 'center' }]}>{label}</Text>
    </AnimatedPressable>
  );
});
