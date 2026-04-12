// =============================================================================
// TRANSFORMR -- Gamification Store (Module 13)
// Persists the user's gamification mode preference (competitive vs supportive)
// using MMKV via Zustand persist middleware — same pattern as settingsStore.
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

export type GamificationMode = 'competitive' | 'supportive';

const mmkv = new MMKV({ id: 'transformr-gamification' });

const mmkvStorage: StateStorage = {
  getItem: (name: string): string | null => {
    return mmkv.getString(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    mmkv.set(name, value);
  },
  removeItem: (name: string): void => {
    mmkv.delete(name);
  },
};

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
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
