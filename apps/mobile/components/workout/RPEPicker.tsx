// =============================================================================
// TRANSFORMR — RPEPicker
// Horizontal segmented RPE control (6–10) with color gradation
// =============================================================================

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { hapticLight } from '@utils/haptics';

interface RPEPickerProps {
  value: number;
  onChange: (value: number) => void;
}

const RPE_VALUES = [6, 7, 8, 9, 10] as const;

const RPE_COLORS: Record<number, string> = {
  6: '#22C55E', // green — easy
  7: '#84CC16', // lime — moderate
  8: '#F59E0B', // amber — hard
  9: '#F97316', // orange — very hard
  10: '#EF4444', // red — max effort
};

const RPE_LABELS: Record<number, string> = {
  6: 'Easy',
  7: 'Moderate',
  8: 'Hard',
  9: 'Very Hard',
  10: 'Max',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function RPEButton({
  rpe,
  isSelected,
  onPress,
  color,
}: {
  rpe: number;
  isSelected: boolean;
  onPress: () => void;
  color: string;
}) {
  const { colors, typography } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 12, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 300 });
  }, [scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={`RPE ${rpe}: ${RPE_LABELS[rpe]}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={[
        styles.rpeButton,
        {
          backgroundColor: isSelected ? color : colors.background.glass,
          borderColor: isSelected ? color : colors.border.light,
          borderWidth: 1.5,
        },
        animStyle,
      ]}
    >
      <Text
        style={[
          styles.rpeNumber,
          {
            color: isSelected ? '#FFFFFF' : colors.text.secondary,
            fontWeight: isSelected ? '800' : '600',
          },
        ]}
      >
        {rpe}
      </Text>
      <Text
        style={[
          typography.tiny,
          {
            color: isSelected ? 'rgba(255,255,255,0.85)' : colors.text.muted,
            fontSize: 9,
            fontWeight: '500',
          },
        ]}
        numberOfLines={1}
      >
        {RPE_LABELS[rpe]}
      </Text>
    </AnimatedPressable>
  );
}

export function RPEPicker({ value, onChange }: RPEPickerProps) {
  const handleSelect = useCallback(
    (rpe: number) => {
      hapticLight();
      onChange(rpe);
    },
    [onChange],
  );

  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel="Rate of Perceived Exertion">
      {RPE_VALUES.map((rpe) => (
        <RPEButton
          key={rpe}
          rpe={rpe}
          isSelected={value === rpe}
          onPress={() => handleSelect(rpe)}
          color={RPE_COLORS[rpe] ?? '#A855F7'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  rpeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    minHeight: 44,
    minWidth: 44,
  },
  rpeNumber: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
