// =============================================================================
// TRANSFORMR — Settings Store
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV({ id: 'transformr-settings' });

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

type ThemeMode = 'light' | 'dark' | 'system';

interface NotificationSettings {
  workoutReminders: boolean;
  mealReminders: boolean;
  habitReminders: boolean;
  partnerNudges: boolean;
  goalMilestones: boolean;
  weeklyReport: boolean;
}

interface SettingsState {
  theme: ThemeMode;
  notifications: NotificationSettings;
  voiceEnabled: boolean;
  narratorEnabled: boolean;
}

type SettingKey = keyof SettingsState;
type SettingValue<K extends SettingKey> = SettingsState[K];

interface SettingsActions {
  updateSetting: <K extends SettingKey>(key: K, value: SettingValue<K>) => void;
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

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // --- State ---
      theme: 'system',
      notifications: DEFAULT_NOTIFICATIONS,
      voiceEnabled: false,
      narratorEnabled: false,

      // --- Actions ---
      updateSetting: (key, value) => {
        set((state) => ({ ...state, [key]: value }));
      },
    }),
    {
      name: 'transformr-settings',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
