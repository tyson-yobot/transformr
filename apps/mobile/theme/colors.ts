export const colors = {
  dark: {
    background: {
      primary: '#0C0A15',        // Deep Space
      secondary: '#16122A',      // Surface
      tertiary: '#1E1838',       // Surface Light
      input: '#16122A',          // Input fields
      elevated: '#2D2450',       // Elevated surfaces (brand kit)
      // Legacy aliases kept for backwards compat:
      surface: '#16122A',
      surfaceElevated: '#1E1838',
      surfaceHover: '#261F45',
      alt: '#110E20',
    },
    text: {
      primary: '#F0F0FC',
      secondary: '#9B8FC0',
      muted: '#6B5E8A',
      inverse: '#0C0A15',
    },
    accent: {
      primary: '#A855F7',        // TRANSFORMR Purple
      primaryLight: '#C084FC',   // Lighter purple for highlights (brand kit)
      primaryDark: '#7E22CE',    // Darker purple for pressed states (brand kit)
      // Legacy alias:
      secondary: '#7E22CE',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      fire: '#F97316',
      gold: '#EAB308',
      pink: '#EC4899',
      cyan: '#22D3EE',
      // Legacy dim tokens (kept for backwards compat):
      primaryDim: 'rgba(168,85,247,0.12)',
      cyanDim: 'rgba(34,211,238,0.12)',
      successDim: 'rgba(16,185,129,0.12)',
      warningDim: 'rgba(245,158,11,0.12)',
      dangerDim: 'rgba(239,68,68,0.12)',
      fireDim: 'rgba(249,115,22,0.12)',
      goldDim: 'rgba(234,179,8,0.12)',
      pinkDim: 'rgba(236,72,153,0.12)',
      purpleGlow: 'rgba(168,85,247,0.25)',
    },
    border: {
      default: '#2A2248',
      light: '#362C5E',          // brand kit addition
      // Legacy alias:
      subtle: '#1E1838',
      focus: '#A855F7',
      glow: 'rgba(168,85,247,0.25)',
    },
    // Semantic dim tokens as a dedicated namespace (brand kit)
    dim: {
      primary: 'rgba(168,85,247,0.12)',
      primaryGlow: 'rgba(168,85,247,0.25)',
      success: 'rgba(16,185,129,0.12)',
      warning: 'rgba(245,158,11,0.12)',
      danger: 'rgba(239,68,68,0.12)',
      info: 'rgba(59,130,246,0.12)',
      fire: 'rgba(249,115,22,0.12)',
      gold: 'rgba(234,179,8,0.12)',
      cyan: 'rgba(34,211,238,0.12)',
      pink: 'rgba(236,72,153,0.12)',
    },
  },
  light: {
    background: {
      primary: '#FAFBFC',
      secondary: '#FFFFFF',
      tertiary: '#F5F3FF',
      input: '#FFFFFF',
      elevated: '#EDE9FE',
      surface: '#FFFFFF',
      surfaceElevated: '#F5F3FF',
      surfaceHover: '#EDE9FE',
      alt: '#F8F7FF',
    },
    text: {
      primary: '#1A1530',
      secondary: '#4A3F6B',
      muted: '#7B6FA0',
      inverse: '#F0F0FC',
    },
    accent: {
      primary: '#7C3AED',        // Deeper purple — WCAG AA on white
      primaryLight: '#9333EA',
      primaryDark: '#6D28D9',
      secondary: '#6D28D9',
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
      info: '#2563EB',
      fire: '#EA580C',
      gold: '#CA8A04',
      pink: '#DB2777',
      cyan: '#0891B2',
      primaryDim: 'rgba(124,58,237,0.08)',
      cyanDim: 'rgba(8,145,178,0.08)',
      successDim: 'rgba(5,150,105,0.08)',
      warningDim: 'rgba(217,119,6,0.08)',
      dangerDim: 'rgba(220,38,38,0.08)',
      fireDim: 'rgba(234,88,12,0.08)',
      goldDim: 'rgba(202,138,4,0.08)',
      pinkDim: 'rgba(219,39,119,0.08)',
      purpleGlow: 'rgba(124,58,237,0.15)',
    },
    border: {
      default: '#DDD8F0',
      light: '#C8C2DC',
      subtle: '#EDE9FE',
      focus: '#7C3AED',
      glow: 'rgba(124,58,237,0.15)',
    },
    dim: {
      primary: 'rgba(124,58,237,0.08)',
      primaryGlow: 'rgba(124,58,237,0.15)',
      success: 'rgba(5,150,105,0.08)',
      warning: 'rgba(217,119,6,0.08)',
      danger: 'rgba(220,38,38,0.08)',
      info: 'rgba(37,99,235,0.08)',
      fire: 'rgba(234,88,12,0.08)',
      gold: 'rgba(202,138,4,0.08)',
      cyan: 'rgba(8,145,178,0.08)',
      pink: 'rgba(219,39,119,0.08)',
    },
  },
} as const;

export type ThemeMode = 'dark' | 'light' | 'system';

interface BackgroundColors {
  readonly primary: string;
  readonly secondary: string;
  readonly tertiary: string;
  readonly input: string;
  readonly elevated: string;
  readonly surface: string;
  readonly surfaceElevated: string;
  readonly surfaceHover: string;
  readonly alt: string;
}

interface TextColors {
  readonly primary: string;
  readonly secondary: string;
  readonly muted: string;
  readonly inverse: string;
}

interface AccentColors {
  readonly primary: string;
  readonly primaryLight: string;
  readonly primaryDark: string;
  readonly secondary: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly info: string;
  readonly fire: string;
  readonly gold: string;
  readonly pink: string;
  readonly cyan: string;
  readonly primaryDim: string;
  readonly cyanDim: string;
  readonly successDim: string;
  readonly warningDim: string;
  readonly dangerDim: string;
  readonly fireDim: string;
  readonly goldDim: string;
  readonly pinkDim: string;
  readonly purpleGlow: string;
}

interface BorderColors {
  readonly default: string;
  readonly light: string;
  readonly subtle: string;
  readonly focus: string;
  readonly glow: string;
}

interface DimColors {
  readonly primary: string;
  readonly primaryGlow: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly info: string;
  readonly fire: string;
  readonly gold: string;
  readonly cyan: string;
  readonly pink: string;
}

export interface ColorScheme {
  readonly background: BackgroundColors;
  readonly text: TextColors;
  readonly accent: AccentColors;
  readonly border: BorderColors;
  readonly dim: DimColors;
}
