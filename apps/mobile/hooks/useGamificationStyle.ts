// =============================================================================
// TRANSFORMR -- useGamificationStyle Hook (Module 13)
// Returns a full GamificationStyle object based on the user's stored mode.
// Provides toggleMode and setMode to switch between competitive/supportive.
// Persisted via gamificationStore (MMKV-backed Zustand).
// =============================================================================

import { useCallback } from 'react';
import { useTheme } from '@theme/index';
import { useGamificationStore } from '@stores/gamificationStore';

export type GamificationMode = 'competitive' | 'supportive';

export interface GamificationStyle {
  mode: GamificationMode;
  // Tone labels
  achievementLabel: string;
  streakLabel: string;
  missedDayLabel: string;
  progressLabel: string;
  // Visual
  primaryColor: string;
  showFireEmojis: boolean;
  showLeaderboard: boolean;
  cardElevation: 'high' | 'normal';
  // Text
  motivationStyle: 'intense' | 'calm';
}

export interface UseGamificationStyleResult {
  style: GamificationStyle;
  mode: GamificationMode;
  toggleMode: () => void;
  setMode: (mode: GamificationMode) => void;
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

function buildCompetitiveStyle(primaryColor: string): GamificationStyle {
  return {
    mode: 'competitive',
    achievementLabel: 'New PR! 🔥',
    streakLabel: '🔥 {count}-day fire streak!',
    missedDayLabel: 'Streak broken 💀',
    progressLabel: 'CRUSHING IT',
    primaryColor,
    showFireEmojis: true,
    showLeaderboard: true,
    cardElevation: 'high',
    motivationStyle: 'intense',
  };
}

function buildSupportiveStyle(primaryColor: string): GamificationStyle {
  return {
    mode: 'supportive',
    achievementLabel: 'Nice improvement!',
    streakLabel: '{count} days consistent',
    missedDayLabel: 'Everyone misses a day — back tomorrow',
    progressLabel: 'Making progress',
    primaryColor,
    showFireEmojis: false,
    showLeaderboard: false,
    cardElevation: 'normal',
    motivationStyle: 'calm',
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGamificationStyle(): UseGamificationStyleResult {
  const { colors } = useTheme();
  const mode = useGamificationStore((s) => s.mode);
  const setModeInStore = useGamificationStore((s) => s.setMode);

  // Supportive mode uses a slightly softer purple tint
  const competitivePrimary = colors.accent.primary;
  const supportivePrimary = colors.accent.secondary; // #7E22CE — softer

  const style: GamificationStyle =
    mode === 'competitive'
      ? buildCompetitiveStyle(competitivePrimary)
      : buildSupportiveStyle(supportivePrimary);

  const toggleMode = useCallback(() => {
    setModeInStore(mode === 'competitive' ? 'supportive' : 'competitive');
  }, [mode, setModeInStore]);

  const setMode = useCallback(
    (newMode: GamificationMode) => {
      setModeInStore(newMode);
    },
    [setModeInStore],
  );

  return { style, mode, toggleMode, setMode };
}
