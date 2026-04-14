// =============================================================================
// TRANSFORMR — Settings Store
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      },
      setFitnessPrefs: (prefs) => {
        set((state) => ({
          fitnessPreferences: { ...state.fitnessPreferences, ...prefs },
        }));
      },
    }),
    {
      name: 'transformr-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
