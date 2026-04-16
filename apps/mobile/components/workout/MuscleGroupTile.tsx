import { memo, useCallback } from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BodyMap } from '@components/ui/BodyMap';
import { useTheme } from '@theme/index';
import { categoryToBodyParts } from '@utils/muscleMapping';
import type { BodyPart } from '@components/ui/BodyMap';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MuscleGroupTileProps {
  muscleGroup: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
  size?: number;
  style?: ViewStyle;
}

export const MuscleGroupTile = memo(function MuscleGroupTile({
  muscleGroup, label, isSelected, onPress, size = 80, style,
}: MuscleGroupTileProps) {
  const { colors, typography } = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const parts: BodyPart[] = categoryToBodyParts(muscleGroup);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.93, { damping: 12, stiffness: 400 });
  }, [scale]);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1.0, { damping: 14, stiffness: 300 });
  }, [scale]);
  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected: isSelected }}
      style={[{ alignItems: 'center', gap: 5 }, style, animated]}
    >
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: isSelected ? colors.dim.primary : colors.background.secondary,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? colors.accent.primary : colors.border.default,
        shadowColor: isSelected ? colors.accent.primary : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: isSelected ? 0.5 : 0,
        shadowRadius: isSelected ? 10 : 0,
        elevation: isSelected ? 6 : 0,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <BodyMap mode="muscle" highlightPrimary={parts} size={Math.round(size * 0.48)} />
      </View>
      <Text
        style={[typography.tiny, {
          color: isSelected ? colors.accent.primary : colors.text.secondary,
          fontWeight: isSelected ? '600' : '400',
          textAlign: 'center',
          maxWidth: 70,
        }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
});
