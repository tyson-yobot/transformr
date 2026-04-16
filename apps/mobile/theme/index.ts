import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors, ColorScheme, ThemeMode } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';
import { useSettingsStore } from '@stores/settingsStore';

interface ThemeContextValue {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  isDark: boolean;
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  /** When true, always renders the dark theme regardless of user preference. */
  forceDark?: boolean;
}

export function ThemeProvider({ children, forceDark = false }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const mode = useSettingsStore((s) => s.theme);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const isDark = forceDark || (mode === 'system'
    ? systemScheme !== 'light'
    : mode === 'dark');

  const themeColors: ColorScheme = isDark ? colors.dark : colors.light;

  const setMode = useCallback(
    (next: ThemeMode) => {
      updateSetting('theme', next);
    },
    [updateSetting],
  );

  const toggleTheme = useCallback(() => {
    setMode(isDark ? 'light' : 'dark');
  }, [isDark, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: themeColors,
      typography,
      spacing,
      borderRadius,
      isDark,
      mode,
      toggleTheme,
      setMode,
    }),
    [themeColors, isDark, mode, toggleTheme, setMode],
  );

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
      toggleTheme: () => undefined,
      setMode: () => undefined,
    };
  }
  return context;
}

export { colors } from './colors';
export { typography } from './typography';
export { spacing, borderRadius } from './spacing';
export type { ThemeMode, ColorScheme } from './colors';
export type { TypographyVariant } from './typography';
