export const colors = {
  dark: {
    background: {
      primary: '#0F172A',
      secondary: '#1E293B',
      tertiary: '#334155',
      input: '#1E293B',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      muted: '#64748B',
      inverse: '#0F172A',
    },
    accent: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      fire: '#F97316',
      gold: '#EAB308',
      pink: '#EC4899',
    },
    border: {
      default: '#334155',
      subtle: '#1E293B',
      focus: '#6366F1',
    },
  },
  light: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',
      input: '#F8FAFC',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#94A3B8',
      inverse: '#F8FAFC',
    },
    accent: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      fire: '#F97316',
      gold: '#EAB308',
      pink: '#EC4899',
    },
    border: {
      default: '#E2E8F0',
      subtle: '#F1F5F9',
      focus: '#6366F1',
    },
  },
} as const;

export type ThemeMode = 'dark' | 'light' | 'system';

interface BackgroundColors {
  readonly primary: string;
  readonly secondary: string;
  readonly tertiary: string;
  readonly input: string;
}

interface TextColors {
  readonly primary: string;
  readonly secondary: string;
  readonly muted: string;
  readonly inverse: string;
}

interface AccentColors {
  readonly primary: string;
  readonly secondary: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly info: string;
  readonly fire: string;
  readonly gold: string;
  readonly pink: string;
}

interface BorderColors {
  readonly default: string;
  readonly subtle: string;
  readonly focus: string;
}

export interface ColorScheme {
  readonly background: BackgroundColors;
  readonly text: TextColors;
  readonly accent: AccentColors;
  readonly border: BorderColors;
}
