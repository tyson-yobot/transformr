// =============================================================================
// TRANSFORMR -- Gamification Store (Module 13)
// Persists the user's gamification mode preference (competitive vs supportive)
// using MMKV via Zustand persist middleware — same pattern as settingsStore.
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GamificationMode = 'competitive' | 'supportive';

interface GamificationState {
  mode: GamificationMode;
}

interface GamificationActions {
  setMode: (mode: GamificationMode) => void;
}

type GamificationStore = GamificationState & GamificationActions;

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set) => ({
      // --- State ---
      mode: 'competitive',

      // --- Actions ---
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'transformr-gamification',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
