import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  dot = false,
  style,
}: BadgeProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: colors.background.tertiary, text: colors.text.secondary },
    success: { bg: `${colors.accent.success}20`, text: colors.accent.success },
    warning: { bg: `${colors.accent.warning}20`, text: colors.accent.warning },
    danger: { bg: `${colors.accent.danger}20`, text: colors.accent.danger },
    info: { bg: `${colors.accent.info}20`, text: colors.accent.info },
  };

  const sizeConfig: Record<BadgeSize, { height: number; px: number; dotSize: number }> = {
    sm: { height: 20, px: spacing.sm, dotSize: 6 },
    md: { height: 26, px: spacing.md, dotSize: 8 },
  };

  const colorSet = variantColors[variant];
  const sizeSet = sizeConfig[size];

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          {
            width: sizeSet.dotSize,
            height: sizeSet.dotSize,
            borderRadius: sizeSet.dotSize / 2,
            backgroundColor: colorSet.text,
          },
          style,
        ]}
        accessibilityRole="text"
        accessibilityLabel={`${variant} status indicator`}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colorSet.bg,
          height: sizeSet.height,
          paddingHorizontal: sizeSet.px,
          borderRadius: borderRadius.full,
        },
        style,
      ]}
      accessibilityRole="text"
    >
      <Text
        style={[
          size === 'sm' ? typography.tiny : typography.caption,
          { color: colorSet.text, fontWeight: '600' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {},
});
