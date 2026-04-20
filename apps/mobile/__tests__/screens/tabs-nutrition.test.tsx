import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
// Mock Skia early — PurpleRadialBackground and GlowCard need it
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => children,
  Rect: () => null,
  RoundedRect: () => null,
  BlurMask: () => null,
  RadialGradient: () => null,
  vec: jest.fn().mockReturnValue({ x: 0, y: 0 }),
  useFont: jest.fn().mockReturnValue(null),
  Fill: () => null,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), setOptions: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@components/ui/MonoText', () => ({ MonoText: ({ children }: { children: React.ReactNode }) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
}}));
jest.mock('@components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/GlowCard', () => ({ GlowCard: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/Badge', () => ({ Badge: () => null }));
jest.mock('@components/ui/ProgressRing', () => ({ ProgressRing: () => null }));
jest.mock('@components/ui/ProgressBar', () => ({ ProgressBar: () => null }));
jest.mock('@components/ui/BottomSheet', () => ({ BottomSheet: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/EmptyState', () => ({ EmptyState: () => null }));
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@components/ui/HelpIcon', () => ({ HelpIcon: () => null }));
jest.mock('@components/ui/SectionTile', () => ({ SectionTile: () => null }));
jest.mock('@components/ui/ScreenHelpButton', () => ({ ScreenHelpButton: () => null }));
jest.mock('@components/ui/ActionToast', () => ({
  ActionToast: () => null,
  useActionToast: jest.fn(() => ({
    toast: { message: '', subtext: '', visible: false },
    show: jest.fn(),
    hide: jest.fn(),
  })),
}));
jest.mock('@components/ui/Coachmark', () => ({ Coachmark: () => null }));
jest.mock('@components/ui/VoiceMicButton', () => ({ VoiceMicButton: () => null }));
jest.mock('@components/cards/AIInsightCard', () => ({ AIInsightCard: () => null }));
jest.mock('@components/nutrition/MealCard', () => ({ MealCard: () => null }));
jest.mock('@services/voice', () => ({
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  isRecording: jest.fn().mockReturnValue(false),
  transcribeAudio: jest.fn().mockResolvedValue(''),
  parseVoiceCommandAI: jest.fn().mockResolvedValue({ type: 'unknown' }),
}));
jest.mock('@hooks/useNutrition', () => ({
  useNutrition: jest.fn(() => ({
    logs: [],
    isLoading: false,
    addLog: jest.fn(),
    todayMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    waterOz: 0,
    logWater: jest.fn(),
  })),
}));
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: true,
    requiredTier: 'free',
    showUpgradeModal: jest.fn(),
    upgradeMessage: '',
  })),
}));
jest.mock('@stores/nutritionStore', () => ({
  useNutritionStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = {
      logs: [],
      todayLogs: [],
      waterLogs: [],
      supplements: [],
      supplementLogs: [],
      isLoading: false,
      fetchLogs: jest.fn().mockResolvedValue(undefined),
      fetchTodayNutrition: jest.fn().mockResolvedValue(undefined),
      logWater: jest.fn().mockResolvedValue(undefined),
      deleteLog: jest.fn().mockResolvedValue(undefined),
      foodNameMap: {},
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = { profile: {
      daily_calorie_target: 2000,
      daily_protein_target: 150,
      daily_carb_target: 200,
      daily_fat_target: 65,
      daily_water_target_oz: 64,
    }};
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@utils/formatters', () => ({
  formatCalories: (n: number) => `${n} kcal`,
  formatMacro: (n: number) => `${n}g`,
  formatOz: (n: number) => `${n}oz`,
  formatDateShort: () => 'Apr 19',
}));
jest.mock('@utils/constants', () => ({
  MEAL_TYPES: ['breakfast', 'lunch', 'dinner', 'snack'],
  MACRO_COLORS: { protein: '#22C55E', carbs: '#F59E0B', fat: '#EF4444' },
  DEFAULT_WATER_TARGET_OZ: 64,
}));
jest.mock('@utils/haptics', () => ({
  hapticLight: jest.fn(),
  hapticMedium: jest.fn(),
  hapticSuccess: jest.fn(),
}));
jest.mock('@utils/storage', () => ({
  getStorageBool: jest.fn().mockReturnValue(false),
  setStorageBool: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { supabaseUrl: '', supabaseAnonKey: '' } } },
}));
jest.mock('@services/supabase', () => {
  const chain: Record<string, unknown> = {};
  const resolved = Promise.resolve({ data: [], error: null });
  ['eq', 'neq', 'in', 'order', 'limit', 'single'].forEach(
    (m) => { chain[m] = jest.fn(() => chain); }
  );
  chain['then'] = (resolve: (v: { data: unknown[]; error: null }) => void) =>
    resolved.then(resolve);
  return {
    supabase: {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: jest.fn(() => ({ select: jest.fn(() => chain) })),
    },
  };
});
jest.mock('@stores/challengeStore', () => ({
  useChallengeStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = {
      challenges: [], activeChallenges: [], challengeDefinitions: [],
      activeEnrollment: null, todayLog: null, isLoading: false,
      logChallengeActivity: jest.fn().mockResolvedValue(undefined),
    };
    return selector ? selector(state) : state;
  }),
}));

import NutritionScreen from '../../app/(tabs)/nutrition/index';

describe('Nutrition tab screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<NutritionScreen />)).not.toThrow();
  });
});
