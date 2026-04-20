import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('@stores/subscriptionStore', () => ({
  useSubscriptionStore: jest.fn((selector: (s: { tier: string }) => unknown) =>
    selector({ tier: 'free' }),
  ),
}));
jest.mock('@hooks/useFeatureGate', () => ({
  upgradeModalEvents: { emit: jest.fn() },
}));

import { HistoryCapBanner } from '../../../components/ui/HistoryCapBanner';

describe('HistoryCapBanner', () => {
  it('renders banner when tier is free', () => {
    const { getByText } = render(<HistoryCapBanner />);
    expect(getByText(/7 days|Upgrade/i)).toBeTruthy();
  });

  it('returns null when tier is pro', () => {
    const { useSubscriptionStore } = require('@stores/subscriptionStore') as {
      useSubscriptionStore: jest.Mock;
    };
    useSubscriptionStore.mockImplementation((selector: (s: { tier: string }) => unknown) =>
      selector({ tier: 'pro' }),
    );
    const { queryByText } = render(<HistoryCapBanner />);
    expect(queryByText(/7 days/i)).toBeNull();
  });
});
