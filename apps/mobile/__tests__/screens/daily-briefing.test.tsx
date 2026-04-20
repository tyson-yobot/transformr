import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/Button', () => ({ Button: ({ label }: { label: string }) => {
  const { Text } = require('react-native');
  return <Text>{label}</Text>;
}}));
jest.mock('@components/ui/ProgressRing', () => ({ ProgressRing: () => null }));
jest.mock('@components/ui/ProgressBar', () => ({ ProgressBar: () => null }));
jest.mock('@components/ui/MonoText', () => ({ MonoText: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/PurpleRadialBackground', () => ({ PurpleRadialBackground: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@hooks/useDailyBriefing', () => ({
  useDailyBriefing: () => ({
    greeting: 'Good morning',
    userName: 'Test',
    countdown: null,
    gamePlan: [],
    readinessScore: 80,
    todayDate: '2026-04-19',
    motivationMessage: 'Keep going!',
  }),
}));
jest.mock('@stores/settingsStore', () => ({
  useSettingsStore: jest.fn((selector: (s: { updateSetting: jest.Mock }) => unknown) => {
    const state = { updateSetting: jest.fn() };
    return selector ? selector(state) : state;
  }),
}));

import DailyBriefingScreen from '../../app/daily-briefing';

describe('DailyBriefing screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<DailyBriefingScreen />)).not.toThrow();
  });

  it('renders greeting', () => {
    const { getByText } = render(<DailyBriefingScreen />);
    expect(getByText('Good morning')).toBeTruthy();
  });

  it('renders motivation message', () => {
    const { getByText } = render(<DailyBriefingScreen />);
    expect(getByText('Keep going!')).toBeTruthy();
  });
});
