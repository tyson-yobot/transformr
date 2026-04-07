import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors, ColorScheme, ThemeMode } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';

interface ThemeContextValue {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  isDark: boolean;
  mode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  mode?: ThemeMode;
  children: React.ReactNode;
}

export function ThemeProvider({ mode = 'dark', children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();

  const isDark = mode === 'system'
    ? systemScheme !== 'light'
    : mode === 'dark';

  const themeColors: ColorScheme = isDark ? colors.dark : colors.light;

  const value = useMemo<ThemeContextValue>(() => ({
    colors: themeColors,
    typography,
    spacing,
    borderRadius,
    isDark,
    mode,
  }), [themeColors, isDark, mode]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return dark theme defaults when outside provider
    return {
      colors: colors.dark,
      typography,
      spacing,
      borderRadius,
      isDark: true,
      mode: 'dark',
    };
  }
  return context;
}

export { colors } from './colors';
export { typography } from './typography';
export { spacing, borderRadius } from './spacing';
export type { ThemeMode, ColorScheme } from './colors';
export type { TypographyVariant } from './typography';
