import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
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
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@services/heroImagePreloader', () => ({
  HERO_IMAGES: { FITNESS: null, DASHBOARD: null, NUTRITION: null },
  preloadHeroImages: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => children,
  Rect: () => null,
  RoundedRect: () => null,
  BlurMask: () => null,
  RadialGradient: () => null,
  vec: jest.fn().mockReturnValue({ x: 0, y: 0 }),
  Fill: () => null,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/Button', () => ({ Button: ({ label }: { label: string }) => {
  const { Text } = require('react-native');
  return <Text>{label}</Text>;
}}));
jest.mock('@components/ui/MonoText', () => ({ MonoText: ({ children }: { children: React.ReactNode }) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
}}));
jest.mock('@components/ui/ScreenSkeleton', () => ({ ListSkeleton: () => null }));
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@components/ui/ScreenHelpButton', () => ({ ScreenHelpButton: () => null }));
jest.mock('@components/ui/PurpleRadialBackground', () => ({ PurpleRadialBackground: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/HeroCard', () => ({ HeroCard: () => null }));
jest.mock('@components/ui/SpotifyMiniPlayer', () => ({ SpotifyMiniPlayer: () => null }));
jest.mock('@components/cards/AIInsightCard', () => ({ AIInsightCard: () => null }));
jest.mock('@components/charts/WeightChart', () => ({ WeightChart: () => null }));
jest.mock('@stores/workoutStore', () => ({
  useWorkoutStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = {
      sessions: [],
      templates: [],
      isLoading: false,
      fetchSessions: jest.fn().mockResolvedValue(undefined),
      fetchTemplates: jest.fn().mockResolvedValue(undefined),
      startWorkout: jest.fn().mockResolvedValue('session-1'),
      personalRecords: [],
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@hooks/useScreenEntrance', () => ({
  useScreenEntrance: jest.fn(() => ({
    entered: true,
    getEntranceStyle: jest.fn(() => ({})),
  })),
}));
jest.mock('@utils/formatters', () => ({
  formatVolume: (n: number) => `${n}kg`,
  formatRelativeTime: () => '2h ago',
  formatDuration: (n: number) => `${n}min`,
}));
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn() }));
jest.mock('@services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(() => ({ order: jest.fn(() => ({ limit: jest.fn(() => Promise.resolve({ data: [], error: null })) })) })) })),
    })),
  },
}));
jest.mock('@services/calendar', () => ({ addWorkoutToCalendar: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../constants/screenHelp', () => ({ SCREEN_HELP: {} }));

import FitnessScreen from '../../app/(tabs)/fitness/index';

describe('Fitness tab screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<FitnessScreen />)).not.toThrow();
  });
});
