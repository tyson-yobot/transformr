import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@theme/index';
import { TypographyVariant } from '@theme/typography';

interface MonoTextProps extends TextProps {
  variant?: Extract<TypographyVariant, 'stat' | 'statSmall' | 'countdown' | 'monoBody' | 'monoCaption'>;
  color?: string;
}

export function MonoText({
  children,
  variant = 'monoBody',
  color,
  style,
  ...rest
}: MonoTextProps) {
  const { typography, colors } = useTheme();

  const variantStyle = typography[variant] as TextStyle;

  return (
    <Text
      style={[
        variantStyle,
        { color: color ?? colors.text.primary },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
