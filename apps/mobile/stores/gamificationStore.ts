// =============================================================================
// TRANSFORMR -- Gamification Store (Module 13)
// Persists the user's coaching tone preference using MMKV via Zustand persist
// middleware — same pattern as settingsStore.
// v2: Expanded from 2 modes (competitive/supportive) to 4 coaching tones.
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CoachingTone = 'drill_sergeant' | 'motivational' | 'balanced' | 'calm';

interface GamificationState {
  tone: CoachingTone;
}

interface GamificationActions {
  setTone: (tone: CoachingTone) => void;
}

type GamificationStore = GamificationState & GamificationActions;

// Migrate legacy 2-mode values to the new 4-tone system
function migrateLegacyTone(stored: unknown): CoachingTone {
  if (stored === 'competitive') return 'motivational';
  if (stored === 'supportive') return 'calm';
  const validTones: CoachingTone[] = ['drill_sergeant', 'motivational', 'balanced', 'calm'];
  if (typeof stored === 'string' && validTones.includes(stored as CoachingTone)) {
    return stored as CoachingTone;
  }
  return 'motivational';
}

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set) => ({
      // --- State ---
      tone: 'motivational',

      // --- Actions ---
      setTone: (tone) => set({ tone }),
    }),
    {
      name: 'transformr-gamification',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          const legacy = persisted as { mode?: unknown } | null;
          const migratedTone = migrateLegacyTone(legacy?.mode);
          return { tone: migratedTone };
        }
        return persisted as GamificationStore;
      },
    },
  ),
);
