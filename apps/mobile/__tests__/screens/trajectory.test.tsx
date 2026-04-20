import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: true,
    requiredTier: 'free',
    showUpgradeModal: jest.fn(),
    checkAndPrompt: jest.fn(),
    upgradeMessage: '',
  })),
}));
jest.mock('@components/ui/GatePromptCard', () => ({ GatePromptCard: () => null }));
jest.mock('@components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/GlowCard', () => ({ GlowCard: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/PurpleRadialBackground', () => ({ PurpleRadialBackground: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/Button', () => ({ Button: ({ label }: { label: string }) => {
  const { Text } = require('react-native');
  return <Text>{label}</Text>;
}}));
jest.mock('@components/ui/Badge', () => ({ Badge: ({ label }: { label: string }) => {
  const { Text } = require('react-native');
  return <Text>{label}</Text>;
}}));
jest.mock('@components/ui/Chip', () => ({ Chip: ({ label }: { label: string }) => {
  const { Text } = require('react-native');
  return <Text>{label}</Text>;
}}));
jest.mock('@components/ui/MonoText', () => ({ MonoText: ({ children }: { children: React.ReactNode }) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
}}));
jest.mock('@components/ui/EmptyState', () => ({ EmptyState: () => null }));
jest.mock('@components/charts/TrajectoryChart', () => ({ TrajectoryChart: () => null }));
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector: (s: object) => unknown) => {
    const state = {
      profile: { id: 'u1', name: 'Test', weight_kg: 75, daily_calorie_target: 2000 },
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@utils/formatters', () => ({
  formatNumber: (n: number) => String(n),
  formatCurrency: (n: number) => `$${n}`,
}));
jest.mock('@services/ai/trajectory', () => ({
  generateTrajectory: jest.fn().mockResolvedValue([]),
}));
jest.mock('@services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ data: [], error: null })) })) })),
  },
}));

import TrajectoryScreen from '../../app/trajectory';

describe('Trajectory screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<TrajectoryScreen />)).not.toThrow();
  });

  it('renders domain chips', () => {
    const { getAllByText } = render(<TrajectoryScreen />);
    // Label includes emoji: "⚖️ Weight"
    expect(getAllByText(/Weight/).length).toBeGreaterThan(0);
  });
});
