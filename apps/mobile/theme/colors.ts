// =============================================================================
// TRANSFORMR -- Design Tokens
// Purple Ambient Glow System + Full Light Mode Overhaul
// =============================================================================

export const colors = {
  dark: {
    background: {
      primary:        '#0C0A15',   // Deep Space
      secondary:      '#16122A',   // Surface
      tertiary:       '#1E1838',   // Surface Light
      input:          '#16122A',   // Input fields
      elevated:       '#2D2450',   // Elevated surfaces
      glass:          'rgba(22,18,42,0.88)',
      overlay:        'rgba(0,0,0,0.6)',
      // Legacy aliases kept for backwards compat:
      surface:        '#16122A',
      surfaceElevated:'#1E1838',
      surfaceHover:   '#271F48',
      alt:            '#08060E',
    },
    text: {
      primary:   '#F0F0FC',
      secondary: '#9B8FC0',
      muted:     '#6B5E8A',
      inverse:   '#0C0A15',
      link:      '#A855F7',
    },
    accent: {
      primary:       '#A855F7',   // TRANSFORMR Purple
      primaryLight:  '#C084FC',
      primaryDark:   '#7E22CE',
      secondary:     '#7E22CE',   // Legacy alias
      success:       '#10B981',
      warning:       '#F59E0B',
      danger:        '#EF4444',
      info:          '#3B82F6',
      fire:          '#F97316',
      gold:          '#EAB308',
      pink:          '#EC4899',
      cyan:          '#06B6D4',
      // Dim tokens (legacy + canonical)
      primaryDim:    'rgba(168,85,247,0.12)',
      cyanDim:       'rgba(6,182,212,0.12)',
      successDim:    'rgba(16,185,129,0.12)',
      warningDim:    'rgba(245,158,11,0.12)',
      dangerDim:     'rgba(239,68,68,0.12)',
      infoDim:       'rgba(59,130,246,0.12)',
      fireDim:       'rgba(249,115,22,0.12)',
      goldDim:       'rgba(234,179,8,0.12)',
      pinkDim:       'rgba(236,72,153,0.12)',
      purpleGlow:    'rgba(168,85,247,0.25)',
      primaryMuted:  'rgba(168,85,247,0.15)',
      // Subtle aliases (same opacity as Dim — semantic naming)
      primarySubtle: 'rgba(168,85,247,0.12)',
      successSubtle: 'rgba(16,185,129,0.12)',
      cyanSubtle:    'rgba(6,182,212,0.12)',
      warningSubtle: 'rgba(245,158,11,0.12)',
      dangerSubtle:  'rgba(239,68,68,0.12)',
      fireSubtle:    'rgba(249,115,22,0.12)',
      goldSubtle:    'rgba(234,179,8,0.12)',
      pinkSubtle:    'rgba(236,72,153,0.12)',
    },
    border: {
      default: '#2A2248',
      light:   '#362C5E',
      subtle:  '#1E1838',
      focus:   '#A855F7',
      glow:    'rgba(168,85,247,0.25)',
      error:   '#EF4444',
    },
    dim: {
      primary:     'rgba(168,85,247,0.12)',
      primaryGlow: 'rgba(168,85,247,0.25)',
      success:     'rgba(16,185,129,0.12)',
      warning:     'rgba(245,158,11,0.12)',
      danger:      'rgba(239,68,68,0.12)',
      info:        'rgba(59,130,246,0.12)',
      fire:        'rgba(249,115,22,0.12)',
      gold:        'rgba(234,179,8,0.12)',
      cyan:        'rgba(6,182,212,0.12)',
      pink:        'rgba(236,72,153,0.12)',
    },
    // -------------------------------------------------------------------------
    // Purple Ambient Glow System
    // -------------------------------------------------------------------------
    glow: {
      purple:       'rgba(168, 85, 247, 0.18)',
      purpleStrong: 'rgba(168, 85, 247, 0.32)',
      purpleSoft:   'rgba(168, 85, 247, 0.08)',
      success:      'rgba(16, 185, 129, 0.15)',
      fire:         'rgba(249, 115, 22, 0.15)',
      gold:         'rgba(234, 179, 8, 0.15)',
      cyan:         'rgba(6, 182, 212, 0.15)',
      pink:         'rgba(236, 72, 153, 0.15)',
      danger:       'rgba(239, 68, 68, 0.15)',
    },
    shadow: {
      card: {
        shadowColor:    '#A855F7',
        shadowOffset:   { width: 0, height: 4 },
        shadowOpacity:  0.18,
        shadowRadius:   16,
        elevation:      8,
      },
      cardStrong: {
        shadowColor:    '#A855F7',
        shadowOffset:   { width: 0, height: 8 },
        shadowOpacity:  0.28,
        shadowRadius:   24,
        elevation:      12,
      },
      cardSubtle: {
        shadowColor:    '#A855F7',
        shadowOffset:   { width: 0, height: 2 },
        shadowOpacity:  0.10,
        shadowRadius:   8,
        elevation:      4,
      },
      glowPurpleCard: {
        shadowColor:    '#A855F7',
        shadowOpacity:  0.25,
        shadowRadius:   16,
        shadowOffset:   { width: 0, height: 0 },
        elevation:      8,
      },
      glowPinkCard: {
        shadowColor:    '#EC4899',
        shadowOpacity:  0.22,
        shadowRadius:   14,
        shadowOffset:   { width: 0, height: 0 },
        elevation:      7,
      },
      glowCyanCard: {
        shadowColor:    '#06B6D4',
        shadowOpacity:  0.20,
        shadowRadius:   14,
        shadowOffset:   { width: 0, height: 0 },
        elevation:      7,
      },
    },
    gradient: {
      primary:    ['#A855F7', '#7C3AED'] as [string, string],
      ai:         ['#A855F7', '#06B6D4'] as [string, string],
      purplePink: ['#A855F7', '#EC4899'] as [string, string],
      cyanPurple: ['#06B6D4', '#A855F7'] as [string, string],
      fire:       ['#F97316', '#EAB308'] as [string, string],
      success:    ['#10B981', '#059669'] as [string, string],
      partner:    ['#EC4899', '#A855F7'] as [string, string],
      cardHeader: ['rgba(168,85,247,0.12)', 'rgba(168,85,247,0.0)'] as [string, string],
      overlay:    ['rgba(12,10,21,0)', 'rgba(12,10,21,0.95)'] as [string, string],
    },
    tab: {
      bar:      '#16122A',
      border:   '#2A2248',
      active:   '#A855F7',
      inactive: '#6B5E8A',
    },
  },

  light: {
    background: {
      primary:        '#F3EDE8',   // Warm cream — locked light mode background
      secondary:      '#FFFFFF',   // Cards: white pops against lavender bg
      tertiary:       '#EBE8F2',   // Elevated surfaces (brand kit Surface Light)
      input:          '#FFFFFF',
      elevated:       '#E4DEFA',   // Highest elevation: rich violet tint
      glass:          'rgba(255,255,255,0.90)',
      overlay:        'rgba(0,0,0,0.45)',
      // Legacy aliases
      surface:        '#FFFFFF',
      surfaceElevated:'#E4DEFA',
      surfaceHover:   '#E4DEFA',
      alt:            '#EDE5FF',
    },
    text: {
      primary:   '#1A1530',   // Deep purple-black — warmer than pure black
      secondary: '#4A3F6B',   // Medium purple-gray
      muted:     '#6B5E8A',   // Slightly darker for better readability
      inverse:   '#F0F0FC',
      link:      '#7C3AED',
    },
    accent: {
      primary:       '#7C3AED',   // Deeper purple — WCAG AA on white
      primaryLight:  '#9333EA',
      primaryDark:   '#6D28D9',
      secondary:     '#6D28D9',
      success:       '#059669',
      warning:       '#D97706',
      danger:        '#DC2626',
      info:          '#2563EB',
      fire:          '#EA580C',
      gold:          '#CA8A04',
      pink:          '#DB2777',
      cyan:          '#0891B2',
      primaryDim:    'rgba(124,58,237,0.14)',
      cyanDim:       'rgba(8,145,178,0.14)',
      successDim:    'rgba(5,150,105,0.14)',
      warningDim:    'rgba(217,119,6,0.14)',
      dangerDim:     'rgba(220,38,38,0.14)',
      infoDim:       'rgba(37,99,235,0.14)',
      fireDim:       'rgba(234,88,12,0.14)',
      goldDim:       'rgba(202,138,4,0.14)',
      pinkDim:       'rgba(219,39,119,0.14)',
      purpleGlow:    'rgba(124,58,237,0.22)',
      primaryMuted:  'rgba(124,58,237,0.20)',
      primarySubtle: 'rgba(124,58,237,0.12)',
      successSubtle: 'rgba(5,150,105,0.12)',
      cyanSubtle:    'rgba(8,145,178,0.12)',
      warningSubtle: 'rgba(217,119,6,0.12)',
      dangerSubtle:  'rgba(220,38,38,0.12)',
      fireSubtle:    'rgba(234,88,12,0.12)',
      goldSubtle:    'rgba(202,138,4,0.12)',
      pinkSubtle:    'rgba(219,39,119,0.12)',
    },
    border: {
      default: '#CBC4E0',   // Stronger purple border — visible contrast
      light:   '#B8B0D0',   // Even more visible for dividers
      subtle:  '#DDD8F0',   // Soft but still visible
      focus:   '#7C3AED',
      glow:    'rgba(124,58,237,0.22)',
      error:   '#DC2626',
    },
    dim: {
      primary:     'rgba(124,58,237,0.14)',
      primaryGlow: 'rgba(124,58,237,0.22)',
      success:     'rgba(5,150,105,0.14)',
      warning:     'rgba(217,119,6,0.14)',
      danger:      'rgba(220,38,38,0.14)',
      info:        'rgba(37,99,235,0.14)',
      fire:        'rgba(234,88,12,0.14)',
      gold:        'rgba(202,138,4,0.14)',
      cyan:        'rgba(8,145,178,0.14)',
      pink:        'rgba(219,39,119,0.14)',
    },
    glow: {
      purple:       'rgba(124, 58, 237, 0.18)',
      purpleStrong: 'rgba(124, 58, 237, 0.30)',
      purpleSoft:   'rgba(124, 58, 237, 0.10)',
      success:      'rgba(5, 150, 105, 0.15)',
      fire:         'rgba(234, 88, 12, 0.15)',
      gold:         'rgba(202, 138, 4, 0.15)',
      cyan:         'rgba(8, 145, 178, 0.15)',
      pink:         'rgba(219, 39, 119, 0.15)',
      danger:       'rgba(220, 38, 38, 0.15)',
    },
    shadow: {
      card: {
        shadowColor:    '#7C3AED',
        shadowOffset:   { width: 0, height: 4 },
        shadowOpacity:  0.18,
        shadowRadius:   16,
        elevation:      6,
      },
      cardStrong: {
        shadowColor:    '#7C3AED',
        shadowOffset:   { width: 0, height: 8 },
        shadowOpacity:  0.25,
        shadowRadius:   24,
        elevation:      10,
      },
      cardSubtle: {
        shadowColor:    '#7C3AED',
        shadowOffset:   { width: 0, height: 2 },
        shadowOpacity:  0.12,
        shadowRadius:   8,
        elevation:      3,
      },
      glowPurpleCard: {
        shadowColor:    '#A855F7',
        shadowOpacity:  0.18,
        shadowRadius:   14,
        shadowOffset:   { width: 0, height: 2 },
        elevation:      6,
      },
      glowPinkCard: {
        shadowColor:    '#EC4899',
        shadowOpacity:  0.15,
        shadowRadius:   12,
        shadowOffset:   { width: 0, height: 2 },
        elevation:      5,
      },
      glowCyanCard: {
        shadowColor:    '#06B6D4',
        shadowOpacity:  0.14,
        shadowRadius:   12,
        shadowOffset:   { width: 0, height: 2 },
        elevation:      5,
      },
    },
    gradient: {
      primary:    ['#7C3AED', '#6D28D9'] as [string, string],
      ai:         ['#7C3AED', '#0891B2'] as [string, string],
      purplePink: ['#7C3AED', '#DB2777'] as [string, string],
      cyanPurple: ['#0891B2', '#7C3AED'] as [string, string],
      fire:       ['#EA580C', '#CA8A04'] as [string, string],
      success:    ['#059669', '#047857'] as [string, string],
      partner:    ['#DB2777', '#7C3AED'] as [string, string],
      cardHeader: ['rgba(124,58,237,0.14)', 'rgba(124,58,237,0.0)'] as [string, string],
      overlay:    ['rgba(243,241,248,0)', 'rgba(243,241,248,0.98)'] as [string, string],
    },
    tab: {
      bar:      '#FAFAFF',   // Faint purple-white — not flat white
      border:   '#CBC4E0',   // Visible tab border
      active:   '#7C3AED',
      inactive: '#7B6FA0',   // Slightly darker inactive for contrast
    },
  },
} as const;

export type ThemeMode = 'dark' | 'light' | 'system';

// -----------------------------------------------------------------------------
// Interface definitions
// -----------------------------------------------------------------------------

interface BackgroundColors {
  readonly primary:         string;
  readonly secondary:       string;
  readonly tertiary:        string;
  readonly input:           string;
  readonly elevated:        string;
  readonly glass:           string;
  readonly overlay:         string;
  readonly surface:         string;
  readonly surfaceElevated: string;
  readonly surfaceHover:    string;
  readonly alt:             string;
}

interface TextColors {
  readonly primary:   string;
  readonly secondary: string;
  readonly muted:     string;
  readonly inverse:   string;
  readonly link:      string;
}

interface AccentColors {
  readonly primary:        string;
  readonly primaryLight:   string;
  readonly primaryDark:    string;
  readonly secondary:      string;
  readonly success:        string;
  readonly warning:        string;
  readonly danger:         string;
  readonly info:           string;
  readonly fire:           string;
  readonly gold:           string;
  readonly pink:           string;
  readonly cyan:           string;
  // Dim tokens (legacy names)
  readonly primaryDim:     string;
  readonly cyanDim:        string;
  readonly successDim:     string;
  readonly warningDim:     string;
  readonly dangerDim:      string;
  readonly infoDim:        string;
  readonly fireDim:        string;
  readonly goldDim:        string;
  readonly pinkDim:        string;
  readonly purpleGlow:     string;
  readonly primaryMuted:   string;
  // Subtle aliases (semantic naming — same opacity)
  readonly primarySubtle:  string;
  readonly successSubtle:  string;
  readonly cyanSubtle:     string;
  readonly warningSubtle:  string;
  readonly dangerSubtle:   string;
  readonly fireSubtle:     string;
  readonly goldSubtle:     string;
  readonly pinkSubtle:     string;
}

interface BorderColors {
  readonly default: string;
  readonly light:   string;
  readonly subtle:  string;
  readonly focus:   string;
  readonly glow:    string;
  readonly error:   string;
}

interface DimColors {
  readonly primary:     string;
  readonly primaryGlow: string;
  readonly success:     string;
  readonly warning:     string;
  readonly danger:      string;
  readonly info:        string;
  readonly fire:        string;
  readonly gold:        string;
  readonly cyan:        string;
  readonly pink:        string;
}

interface GlowColors {
  readonly purple:       string;
  readonly purpleStrong: string;
  readonly purpleSoft:   string;
  readonly success:      string;
  readonly fire:         string;
  readonly gold:         string;
  readonly cyan:         string;
  readonly pink:         string;
  readonly danger:       string;
}

interface ShadowToken {
  readonly shadowColor:   string;
  readonly shadowOffset:  { readonly width: number; readonly height: number };
  readonly shadowOpacity: number;
  readonly shadowRadius:  number;
  readonly elevation:     number;
}

interface ShadowTokens {
  readonly card:           ShadowToken;
  readonly cardStrong:     ShadowToken;
  readonly cardSubtle:     ShadowToken;
  readonly glowPurpleCard: ShadowToken;
  readonly glowPinkCard:   ShadowToken;
  readonly glowCyanCard:   ShadowToken;
}

interface GradientTokens {
  readonly primary:    readonly [string, string];
  readonly ai:         readonly [string, string];
  readonly purplePink: readonly [string, string];
  readonly cyanPurple: readonly [string, string];
  readonly fire:       readonly [string, string];
  readonly success:    readonly [string, string];
  readonly partner:    readonly [string, string];
  readonly cardHeader: readonly [string, string];
  readonly overlay:    readonly [string, string];
}

interface TabColors {
  readonly bar:      string;
  readonly border:   string;
  readonly active:   string;
  readonly inactive: string;
}

export interface ColorScheme {
  readonly background: BackgroundColors;
  readonly text:       TextColors;
  readonly accent:     AccentColors;
  readonly border:     BorderColors;
  readonly dim:        DimColors;
  readonly glow:       GlowColors;
  readonly shadow:     ShadowTokens;
  readonly gradient:   GradientTokens;
  readonly tab:        TabColors;
}
