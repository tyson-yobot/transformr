import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: false,
    requiredTier: 'pro',
    upgradeMessage: 'Upgrade to Pro to unlock this feature',
    showUpgradeModal: jest.fn(),
  })),
}));

import { GatePromptCard } from '../../../components/ui/GatePromptCard';

describe('GatePromptCard', () => {
  it('renders without crashing', () => {
    expect(() => render(<GatePromptCard featureKey="ai_insights" />)).not.toThrow();
  });

  it('renders upgrade message', () => {
    const { getByText } = render(<GatePromptCard featureKey="ai_insights" />);
    expect(getByText(/Upgrade to Pro/i)).toBeTruthy();
  });

  it('renders lock icon', () => {
    const { getByText } = render(<GatePromptCard featureKey="ai_insights" />);
    expect(getByText('🔒')).toBeTruthy();
  });

  it('renders custom height without crashing', () => {
    expect(() => render(<GatePromptCard featureKey="ai_insights" height={200} />)).not.toThrow();
  });
});
