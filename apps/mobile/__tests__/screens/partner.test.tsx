import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { supabaseUrl: '', supabaseAnonKey: '' } } },
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
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));
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
    upgradeMessage: '',
  })),
}));
jest.mock('@components/ui/GatePromptCard', () => ({ GatePromptCard: () => null }));
jest.mock('@components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/Button', () => ({ Button: ({ label }: { label: string }) => {
  const { Text } = require('react-native');
  return <Text>{label}</Text>;
}}));
jest.mock('@components/ui/Avatar', () => ({ Avatar: () => null }));
jest.mock('@components/ui/EmptyState', () => ({ EmptyState: ({ title }: { title: string }) => {
  const { Text } = require('react-native');
  return <Text>{title}</Text>;
}}));
jest.mock('@components/ui/ProgressRing', () => ({ ProgressRing: () => null }));
jest.mock('@components/ui/Skeleton', () => ({ Skeleton: () => null }));
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@components/partner/NudgeButton', () => ({ NudgeButton: () => null }));
jest.mock('@stores/partnerStore', () => ({
  usePartnerStore: jest.fn((selector: (s: object) => unknown) => {
    const state = {
      partner: null,
      isLoading: false,
      fetchPartner: jest.fn().mockResolvedValue(undefined),
      fetchPartnership: jest.fn().mockResolvedValue(undefined),
      partnerStats: null,
      partnerWorkouts: [],
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector: (s: object) => unknown) => {
    const state = { profile: { id: 'u1', name: 'Test' } };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn() }));

import PartnerDashboardScreen from '../../app/partner/dashboard';

describe('Partner dashboard screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<PartnerDashboardScreen />)).not.toThrow();
  });
});
