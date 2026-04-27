// =============================================================================
// TRANSFORMR -- SectionHeader
// Section title with optional subtitle and action link.
// =============================================================================

import React from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { Icon3D, Icon3DName } from '@components/ui/Icon3D';
import { useTheme } from '@theme/index';

interface SectionHeaderAction {
  label?: string;
  icon?: Icon3DName;
  onPress: () => void;
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: SectionHeaderAction;
  style?: ViewStyle;
}

export function SectionHeader({ title, subtitle, action, style }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[{ marginTop: 24, marginBottom: 12 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.text.primary,
        }}>
          {title}
        </Text>
        {action && (
          <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button">
            {action.icon ? (
              <Icon3D name={action.icon} size={18} />
            ) : action.label ? (
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.accent.primary,
              }}>
                {action.label}
              </Text>
            ) : null}
          </Pressable>
        )}
      </View>
      {subtitle && (
        <Text style={{
          fontSize: 12,
          color: colors.text.muted,
          marginTop: 2,
        }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
