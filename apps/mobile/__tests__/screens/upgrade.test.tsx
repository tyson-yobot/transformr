import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('../../services/stripe', () => ({
  createSubscription: jest.fn().mockResolvedValue({ success: false }),
  restorePurchase: jest.fn().mockResolvedValue({ success: false }),
}));
jest.mock('../../hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: true,
    requiredTier: 'free',
    showUpgradeModal: jest.fn(),
    checkAndPrompt: jest.fn(),
    upgradeMessage: '',
  })),
  upgradeModalEvents: { emit: jest.fn(), setListener: jest.fn() },
}));

import UpgradeScreen from '../../app/upgrade';

describe('Upgrade screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<UpgradeScreen />)).not.toThrow();
  });

  it('renders tier options', () => {
    const { getByText } = render(<UpgradeScreen />);
    expect(getByText('Pro')).toBeTruthy();
    expect(getByText('Elite')).toBeTruthy();
  });

  it('renders pricing text', () => {
    const { getAllByText } = render(<UpgradeScreen />);
    // Price is inside a Text with nested /mo child, so match substring with regex
    expect(getAllByText(/\$9\.99/).length).toBeGreaterThan(0);
  });
});
