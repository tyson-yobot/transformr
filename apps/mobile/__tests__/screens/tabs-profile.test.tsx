import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => children,
  Rect: () => null,
  RoundedRect: () => null,
  BlurMask: () => null,
  RadialGradient: () => null,
  vec: jest.fn().mockReturnValue({ x: 0, y: 0 }),
  Fill: () => null,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
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
jest.mock('@components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/Toggle', () => ({ Toggle: () => null }));
jest.mock('@components/ui/MonoText', () => ({ MonoText: ({ children }: { children: React.ReactNode }) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
}}));
jest.mock('@components/ui/Avatar', () => ({ Avatar: () => null }));
jest.mock('@components/ui/ProgressBar', () => ({ ProgressBar: () => null }));
jest.mock('@components/ui/SectionTile', () => ({ SectionTile: () => null }));
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@components/ui/PurpleRadialBackground', () => ({ PurpleRadialBackground: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/ScreenHelpButton', () => ({ ScreenHelpButton: () => null }));
jest.mock('@components/cards/AIInsightCard', () => ({ AIInsightCard: () => null }));
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector: (s: object) => unknown) => {
    const state = {
      profile: { id: 'u1', name: 'Test User', email: 'test@example.com', avatar_url: null, fitness_goal: 'muscle_gain', coaching_tone: 'motivational' },
      isLoading: false,
      updateProfile: jest.fn().mockResolvedValue(undefined),
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/settingsStore', () => ({
  useSettingsStore: jest.fn((selector: (s: object) => unknown) => {
    const state = {
      notifications_enabled: true,
      units: 'metric',
      theme_mode: 'dark',
      updateSetting: jest.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/authStore', () => ({
  useAuthStore: jest.fn((selector: (s: object) => unknown) => {
    const state = { user: { id: 'u1' }, session: {}, signOut: jest.fn() };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/habitStore', () => ({
  useHabitStore: jest.fn((selector: (s: object) => unknown) => {
    const state = { habits: [], streaks: {}, isLoading: false };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/subscriptionStore', () => ({
  useSubscriptionStore: jest.fn((selector: (s: object) => unknown) => {
    const state = { tier: 'free' };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@hooks/useGamificationStyle', () => ({
  useGamificationStyle: jest.fn(() => ({ tone: 'motivational', label: 'Motivational', emoji: '🔥' })),
  CoachingTone: {},
}));
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: true,
    requiredTier: 'free',
    showUpgradeModal: jest.fn(),
    upgradeMessage: '',
  })),
  upgradeModalEvents: { emit: jest.fn(), setListener: jest.fn() },
}));
jest.mock('@utils/formatters', () => ({ formatNumber: (n: number) => String(n) }));
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn(), hapticMedium: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@services/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
    from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: [], error: null })) })) })),
  },
}));
jest.mock('../../constants/screenHelp', () => ({ SCREEN_HELP: {} }));

import ProfileScreen from '../../app/(tabs)/profile/index';

describe('Profile tab screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ProfileScreen />)).not.toThrow();
  });
});
