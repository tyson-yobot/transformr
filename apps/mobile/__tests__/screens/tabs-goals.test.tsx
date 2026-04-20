import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  Href: {},
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
jest.mock('@components/ui/Button', () => ({ Button: ({ label }: { label: string }) => {
  const { Text } = require('react-native');
  return <Text>{label}</Text>;
}}));
jest.mock('@components/ui/Badge', () => ({ Badge: () => null }));
jest.mock('@components/ui/ProgressBar', () => ({ ProgressBar: () => null }));
jest.mock('@components/ui/ProgressRing', () => ({ ProgressRing: () => null }));
jest.mock('@components/ui/Modal', () => ({ Modal: ({ children, visible }: { children: React.ReactNode; visible: boolean }) => visible ? children : null }));
jest.mock('@components/ui/Input', () => ({ Input: () => null }));
jest.mock('@components/ui/Chip', () => ({ Chip: ({ label }: { label: string }) => {
  const { Text } = require('react-native');
  return <Text>{label}</Text>;
}}));
jest.mock('@components/ui/MonoText', () => ({ MonoText: ({ children }: { children: React.ReactNode }) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
}}));
jest.mock('@components/ui/ScreenSkeleton', () => ({ ListSkeleton: () => null }));
jest.mock('@components/ui/SectionTile', () => ({ SectionTile: () => null }));
jest.mock('@components/ui/PurpleRadialBackground', () => ({ PurpleRadialBackground: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/EmptyState', () => ({ EmptyState: () => null }));
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@components/ui/ScreenHelpButton', () => ({ ScreenHelpButton: () => null }));
jest.mock('@components/cards/AIInsightCard', () => ({ AIInsightCard: () => null }));
jest.mock('@stores/goalStore', () => ({
  useGoalStore: jest.fn((selector: (s: object) => unknown) => {
    const state = {
      goals: [],
      isLoading: false,
      fetchGoals: jest.fn().mockResolvedValue(undefined),
      createGoal: jest.fn().mockResolvedValue(undefined),
      updateGoal: jest.fn().mockResolvedValue(undefined),
      deleteGoal: jest.fn().mockResolvedValue(undefined),
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@utils/formatters', () => ({
  formatDate: () => 'Apr 19',
  formatCountdown: () => '30 days',
  formatPercentage: (n: number) => `${n}%`,
  formatDateInput: () => '2026-04-19',
  dateInputToISO: (s: string) => s,
  isoToDateInput: (s: string) => s,
}));
jest.mock('@utils/haptics', () => ({
  hapticLight: jest.fn(),
  hapticSuccess: jest.fn(),
}));
jest.mock('../../constants/screenHelp', () => ({ SCREEN_HELP: {} }));

import GoalsScreen from '../../app/(tabs)/goals/index';

describe('Goals tab screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<GoalsScreen />)).not.toThrow();
  });
});
