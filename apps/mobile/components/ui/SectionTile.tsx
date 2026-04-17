import { memo, useCallback } from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

export interface SectionTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accentColor?: string;
  isSelected?: boolean;
  badge?: string | number;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SIZES = { sm: 64, md: 72, lg: 88 } as const;

export const SectionTile = memo(function SectionTile({
  icon, label, accentColor, isSelected = false, badge, onPress, size = 'md', style, accessibilityLabel,
}: SectionTileProps) {
  const { colors, typography } = useTheme();
  const accent = accentColor ?? colors.accent.primary;
  const w = SIZES[size];
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback(() => { scale.value = withSpring(0.92, { damping: 12, stiffness: 400 }); }, []);
  const handlePressOut = useCallback(() => { scale.value = withSpring(1.0, { damping: 14, stiffness: 300 }); }, []);
  const handlePress = useCallback(() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }, [onPress]);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}
      accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: isSelected }}
      style={[{ alignItems: 'center', gap: 5, width: w }, style, animated]}
    >
      <View style={{
        width: w, height: w, borderRadius: w * 0.28,
        backgroundColor: isSelected ? `${accent}18` : colors.background.secondary,
        borderWidth: isSelected ? 1.5 : 1,
        borderColor: isSelected ? `${accent}60` : colors.border.default,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: isSelected ? accent : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: isSelected ? 0.35 : 0,
        shadowRadius: isSelected ? 8 : 0,
        elevation: isSelected ? 4 : 0,
      }}>
        <Ionicons
          name={icon}
          size={size === 'sm' ? 20 : size === 'md' ? 24 : 28}
          color={isSelected ? accent : colors.text.muted}
        />
        {badge !== undefined && (
          <View style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 16, height: 16, borderRadius: 8,
            backgroundColor: colors.accent.danger,
            alignItems: 'center', justifyContent: 'center',
            paddingHorizontal: 3,
            borderWidth: 1.5, borderColor: colors.background.primary,
          }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>
              {typeof badge === 'number' && badge > 99 ? '99+' : String(badge)}
            </Text>
          </View>
        )}
      </View>
      <Text style={[typography.tiny, {
        color: isSelected ? accent : colors.text.secondary,
        fontWeight: isSelected ? '600' : '400',
        textAlign: 'center',
        maxWidth: w + 8,
      }]} numberOfLines={1}>{label}</Text>
    </AnimatedPressable>
  );
});
