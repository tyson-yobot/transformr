import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: true,
    requiredTier: 'free',
    showUpgradeModal: jest.fn(),
    upgradeMessage: '',
  })),
}));
jest.mock('@components/ui/GatePromptCard', () => ({ GatePromptCard: () => null }));
jest.mock('@components/ui/ProgressRing', () => ({ ProgressRing: () => null }));
const mockGCProfileState = {
  profile: { id: 'u1', name: 'Test User', weight_kg: 75 },
};
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockGCProfileState) : mockGCProfileState
  ),
}));
const mockGCGoalState = {
  goals: [] as never[],
  milestones: [] as never[],
  activeGoals: [] as never[],
  isLoading: false,
};
jest.mock('@stores/goalStore', () => ({
  useGoalStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockGCGoalState) : mockGCGoalState
  ),
}));
jest.mock('@utils/formatters', () => ({
  formatNumber: (n: number) => String(n),
  formatPercentage: (n: number) => `${n}%`,
  formatCountdown: () => '30 days',
  formatWeight: (n: number) => `${n} kg`,
}));
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn() }));
jest.mock('@services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({ order: jest.fn(() => ({ limit: jest.fn(() => Promise.resolve({ data: [], error: null })) })) })),
      })),
    })),
  },
}));

import GoalCinemaScreen from '../../app/goal-cinema';

describe('GoalCinema screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<GoalCinemaScreen />)).not.toThrow();
  });
});
