// =============================================================================
// TRANSFORMR -- FeatureHighlightRow
// Icon + title + subtitle row for feature showcases (onboarding, subscription).
// =============================================================================

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Icon3D, Icon3DName } from '@components/ui/Icon3D';
import { useTheme } from '@theme/index';

interface FeatureHighlightRowProps {
  icon: Icon3DName;
  iconColor: string;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function FeatureHighlightRow({
  icon,
  iconColor,
  title,
  subtitle,
  style,
}: FeatureHighlightRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }, style]}>
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: `${iconColor}1F`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
      }}>
        <Icon3D name={icon} size={22} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: colors.text.primary,
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            fontSize: 13,
            color: colors.text.secondary,
            marginTop: 2,
          }}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
