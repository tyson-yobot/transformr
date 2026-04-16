// =============================================================================
// TRANSFORMR — Settings Store
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '../utils/storage';
import { supabase } from '../services/supabase';
import type { Profile } from '../types/database';

// Synchronous MMKV adapter for zustand persist
const mmkvStorage = {
  getItem: (name: string): string | null => storage.getString(name) ?? null,
  setItem: (name: string, value: string): void => { storage.set(name, value); },
  removeItem: (name: string): void => { storage.delete(name); },
};

type ThemeMode = 'light' | 'dark' | 'system';

interface NotificationSettings {
  workoutReminders: boolean;
  mealReminders: boolean;
  habitReminders: boolean;
  partnerNudges: boolean;
  goalMilestones: boolean;
  weeklyReport: boolean;
}

export interface FitnessPreferences {
  workoutDaysPerWeek: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
}

interface SettingsState {
  theme: ThemeMode;
  notifications: NotificationSettings;
  voiceEnabled: boolean;
  narratorEnabled: boolean;
  briefingEnabled: boolean;
  lastBriefingDate: string | null;
  fitnessPreferences: FitnessPreferences;
}

type SettingKey = keyof SettingsState;
type SettingValue<K extends SettingKey> = SettingsState[K];

interface SettingsActions {
  updateSetting: <K extends SettingKey>(key: K, value: SettingValue<K>) => void;
  setFitnessPrefs: (prefs: Partial<FitnessPreferences>) => void;
  /** Sync theme/voice/narrator from a freshly-fetched profile (called on sign-in). */
  loadFromProfile: (profile: Profile) => void;
  /** Push theme/voice/narrator to Supabase profiles row. */
  syncToProfile: () => Promise<void>;
}

type SettingsStore = SettingsState & SettingsActions;

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  workoutReminders: true,
  mealReminders: true,
  habitReminders: true,
  partnerNudges: true,
  goalMilestones: true,
  weeklyReport: true,
};

// Fields that have a direct 1-to-1 mapping in the profiles table
const SYNCED_KEYS: ReadonlySet<SettingKey> = new Set<SettingKey>([
  'theme',
  'voiceEnabled',
  'narratorEnabled',
]);

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // --- State ---
      theme: 'dark',
      notifications: DEFAULT_NOTIFICATIONS,
      voiceEnabled: false,
      narratorEnabled: false,
      briefingEnabled: true,
      lastBriefingDate: null,
      fitnessPreferences: {
        workoutDaysPerWeek: 4,
        experienceLevel: 'intermediate',
        equipment: ['barbell', 'dumbbell'],
      },

      // --- Actions ---
      updateSetting: (key, value) => {
        set((state) => ({ ...state, [key]: value }));
        // Sync profile-backed fields to Supabase in the background
        if (SYNCED_KEYS.has(key)) {
          void get().syncToProfile();
        }
      },

      setFitnessPrefs: (prefs) => {
        set((state) => ({
          fitnessPreferences: { ...state.fitnessPreferences, ...prefs },
        }));
      },

      loadFromProfile: (profile) => {
        set({
          theme: (profile.theme as ThemeMode | undefined) ?? get().theme,
          voiceEnabled: profile.voice_commands_enabled ?? get().voiceEnabled,
          narratorEnabled: profile.narrator_enabled ?? get().narratorEnabled,
        });
      },

      syncToProfile: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { theme, voiceEnabled, narratorEnabled } = get();
          await supabase
            .from('profiles')
            .update({
              theme: theme as Profile['theme'],
              voice_commands_enabled: voiceEnabled,
              narrator_enabled: narratorEnabled,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        } catch {
          // Non-critical — local preferences remain intact
        }
      },
    }),
    {
      name: 'transformr-settings',
      storage: createJSONStorage(() => mmkvStorage),
      version: 1,
      migrate: (persistedState, version) => {
        if (version < 1) {
          // Migrate 'system' default → 'dark' (v0 had system as default which
          // shows light theme on emulators/Android that default to light mode)
          const state = persistedState as Partial<SettingsStore>;
          if (state.theme === 'system') {
            state.theme = 'dark';
          }
        }
        return persistedState as SettingsStore;
      },
    },
  ),
);
