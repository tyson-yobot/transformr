import { memo } from 'react';
import { View, ViewStyle } from 'react-native';
import { BodyMap } from '@components/ui/BodyMap';
import { useTheme } from '@theme/index';
import { musclesToBodyParts, categoryToBodyParts } from '@utils/muscleMapping';
import type { BodyPart } from '@components/ui/BodyMap';

interface ExerciseThumbnailProps {
  muscleGroups: string[];
  category?: string;
  size?: number;
  style?: ViewStyle;
}

export const ExerciseThumbnail = memo(function ExerciseThumbnail({
  muscleGroups, category, size = 56, style,
}: ExerciseThumbnailProps) {
  const { colors, borderRadius } = useTheme();
  const primaryParts: BodyPart[] = muscleGroups.length > 0
    ? musclesToBodyParts(muscleGroups)
    : (category ? categoryToBodyParts(category) : []);

  return (
    <View
      style={[{
        width: size + 16,
        height: Math.round(size * 2.1) + 8,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: primaryParts.length > 0 ? `${colors.accent.primary}30` : colors.border.default,
        alignItems: 'center',
        justifyContent: 'center',
      }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <BodyMap mode="muscle" highlightPrimary={primaryParts} size={size} />
    </View>
  );
});
