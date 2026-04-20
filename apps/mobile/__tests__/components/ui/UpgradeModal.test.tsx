import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));
jest.mock('@hooks/useFeatureGate', () => ({
  upgradeModalEvents: {
    setListener: jest.fn(),
    emit: jest.fn(),
  },
  useFeatureGate: jest.fn(() => ({
    isAvailable: false,
    requiredTier: 'pro',
    showUpgradeModal: jest.fn(),
  })),
}));
jest.mock('@stores/subscriptionStore', () => ({
  useSubscriptionStore: jest.fn((selector: (s: { tier: string }) => unknown) =>
    selector({ tier: 'free' }),
  ),
}));
jest.mock('../../../services/stripe', () => ({
  createSubscription: jest.fn().mockResolvedValue({ success: false }),
}));

import { UpgradeModal } from '../../../components/ui/UpgradeModal';

describe('UpgradeModal', () => {
  it('renders without crashing (initially closed — no event emitted)', () => {
    // UpgradeModal listens to upgradeModalEvents and opens on emit.
    // Without an emit it renders nothing initially.
    expect(() => render(<UpgradeModal />)).not.toThrow();
  });
});
