import { memo, useCallback } from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BodyMap } from '@components/ui/BodyMap';
import { useTheme } from '@theme/index';
import { categoryToBodyParts } from '@utils/muscleMapping';
import type { BodyPart } from '@components/ui/BodyMap';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MUSCLE_CONFIG: Record<string, string> = {
  chest:     '#EF4444',
  back:      '#3B82F6',
  shoulders: '#F97316',
  biceps:    '#A855F7',
  triceps:   '#A855F7',
  abs:       '#22D3EE',
  legs:      '#10B981',
  glutes:    '#10B981',
  cardio:    '#EAB308',
};

const DEFAULT_ACCENT = '#A855F7';

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
  const { colors, typography, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const parts: BodyPart[] = categoryToBodyParts(muscleGroup);
  const accent = MUSCLE_CONFIG[muscleGroup.toLowerCase()] ?? DEFAULT_ACCENT;

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
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.background.glass,
        borderWidth: 1.5,
        borderColor: isSelected
          ? accent
          : isDark
            ? 'rgba(168,85,247,0.18)'
            : 'rgba(124,58,237,0.12)',
        shadowColor: isSelected ? accent : '#A855F7',
        shadowOffset: { width: 0, height: isSelected ? 6 : 2 },
        shadowOpacity: isSelected ? 0.45 : 0.12,
        shadowRadius: isSelected ? 14 : 6,
        elevation: isSelected ? 8 : 2,
      }}>
        {isSelected && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: size / 2,
            backgroundColor: `${accent}15`,
          }} />
        )}
        <BodyMap
          mode="muscle"
          highlightPrimary={parts}
          size={Math.round(size * 0.48)}
          accentColor={accent}
        />
      </View>
      <Text
        style={[typography.tiny, {
          color: isSelected ? accent : colors.text.secondary,
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
