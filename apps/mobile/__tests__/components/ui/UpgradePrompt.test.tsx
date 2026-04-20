import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('expo-router', () => ({ usePathname: () => '/dashboard' }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: false,
    requiredTier: 'pro',
    checkAndPrompt: jest.fn(),
    showUpgradeModal: jest.fn(),
  })),
}));
jest.mock('@stores/subscriptionStore', () => ({
  useSubscriptionStore: jest.fn((selector: (s: { tier: string }) => unknown) =>
    selector({ tier: 'free' }),
  ),
}));
jest.mock('../../services/analytics', () => ({ track: jest.fn() }), { virtual: true });
jest.mock('../../../services/analytics', () => ({ track: jest.fn() }));

import { UpgradePrompt } from '../../../components/ui/UpgradePrompt';

describe('UpgradePrompt', () => {
  it('renders upgrade UI when feature is not available', () => {
    const { getAllByText } = render(<UpgradePrompt feature="ai_insights" />);
    expect(getAllByText(/Pro|Upgrade/i).length).toBeGreaterThan(0);
  });

  it('renders preview content behind the lock', () => {
    const { getByText } = render(
      <UpgradePrompt feature="ai_insights" previewContent={<Text>Preview</Text>} />,
    );
    expect(getByText('Preview')).toBeTruthy();
  });

  it('renders custom lockedMessage', () => {
    const { getByText } = render(
      <UpgradePrompt feature="ai_insights" lockedMessage="Custom gate message" />,
    );
    expect(getByText('Custom gate message')).toBeTruthy();
  });

  it('returns null when feature is available', () => {
    const { useFeatureGate } = require('@hooks/useFeatureGate') as {
      useFeatureGate: jest.Mock;
    };
    useFeatureGate.mockReturnValueOnce({
      isAvailable: true,
      requiredTier: 'pro',
      checkAndPrompt: jest.fn(),
      showUpgradeModal: jest.fn(),
    });
    const { queryByText } = render(<UpgradePrompt feature="ai_insights" />);
    expect(queryByText(/Pro|Upgrade/i)).toBeNull();
  });
});
