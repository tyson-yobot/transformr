// =============================================================================
// TRANSFORMR -- useGamificationStyle Hook (Module 13)
// Returns a full GamificationStyle object based on the user's stored tone.
// Provides setTone to switch between the 4 coaching tones.
// Persisted via gamificationStore (AsyncStorage-backed Zustand).
// =============================================================================

import { useCallback } from 'react';
import { useTheme } from '@theme/index';
import { useGamificationStore, CoachingTone } from '@stores/gamificationStore';

export type { CoachingTone };

export interface GamificationStyle {
  tone: CoachingTone;
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
  motivationStyle: 'intense' | 'neutral' | 'calm';
}

export interface UseGamificationStyleResult {
  style: GamificationStyle;
  tone: CoachingTone;
  isDrillSergeant: boolean;
  isMotivational: boolean;
  isBalanced: boolean;
  isCalm: boolean;
  setTone: (tone: CoachingTone) => void;
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

function buildDrillSergeantStyle(primaryColor: string): GamificationStyle {
  return {
    tone: 'drill_sergeant',
    achievementLabel: 'PR. Raise the bar.',
    streakLabel: '{count} days. Keep the streak alive.',
    missedDayLabel: 'Missed. No excuses. Fix it tomorrow.',
    progressLabel: 'EXECUTE',
    primaryColor,
    showFireEmojis: true,
    showLeaderboard: true,
    cardElevation: 'high',
    motivationStyle: 'intense',
  };
}

function buildMotivationalStyle(primaryColor: string): GamificationStyle {
  return {
    tone: 'motivational',
    achievementLabel: "LET'S GO! New PR! 🔥",
    streakLabel: '🔥 {count}-day fire streak!',
    missedDayLabel: "Everyone slips — you've got this tomorrow 💪",
    progressLabel: 'CRUSHING IT',
    primaryColor,
    showFireEmojis: true,
    showLeaderboard: true,
    cardElevation: 'high',
    motivationStyle: 'intense',
  };
}

function buildBalancedStyle(primaryColor: string): GamificationStyle {
  return {
    tone: 'balanced',
    achievementLabel: 'Goal achieved.',
    streakLabel: '{count}-day consistency streak',
    missedDayLabel: 'Session missed. Adjust your schedule.',
    progressLabel: 'On track',
    primaryColor,
    showFireEmojis: false,
    showLeaderboard: false,
    cardElevation: 'normal',
    motivationStyle: 'neutral',
  };
}

function buildCalmStyle(primaryColor: string): GamificationStyle {
  return {
    tone: 'calm',
    achievementLabel: 'Milestone reached.',
    streakLabel: '{count} days of showing up',
    missedDayLabel: 'Rest is part of the process.',
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
  const tone = useGamificationStore((s) => s.tone);
  const setToneInStore = useGamificationStore((s) => s.setTone);

  const intensePrimary = colors.accent.primary;
  const neutralPrimary = colors.accent.secondary;

  let style: GamificationStyle;
  switch (tone) {
    case 'drill_sergeant':
      style = buildDrillSergeantStyle(intensePrimary);
      break;
    case 'motivational':
      style = buildMotivationalStyle(intensePrimary);
      break;
    case 'balanced':
      style = buildBalancedStyle(neutralPrimary);
      break;
    case 'calm':
      style = buildCalmStyle(neutralPrimary);
      break;
  }

  const setTone = useCallback(
    (newTone: CoachingTone) => {
      setToneInStore(newTone);
    },
    [setToneInStore],
  );

  return {
    style,
    tone,
    isDrillSergeant: tone === 'drill_sergeant',
    isMotivational: tone === 'motivational',
    isBalanced: tone === 'balanced',
    isCalm: tone === 'calm',
    setTone,
  };
}
