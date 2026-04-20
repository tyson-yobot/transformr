import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => {
  const { mockTheme } = require('../__helpers__/rnMocks');
  const theme = mockTheme();
  return { ...theme, typography: theme.useTheme().typography, spacing: theme.useTheme().spacing };
});

const mockOfflineState = { isOnline: true, isSyncing: false, pendingCount: 0 };
jest.mock('@stores/offlineSyncStore', () => ({
  useOfflineSyncStore: jest.fn((selector: (s: typeof mockOfflineState) => unknown) =>
    selector(mockOfflineState),
  ),
}));

import { OfflineSyncBanner } from '../../../components/ui/OfflineSyncBanner';

describe('OfflineSyncBanner', () => {
  beforeEach(() => {
    mockOfflineState.isOnline = true;
    mockOfflineState.isSyncing = false;
    mockOfflineState.pendingCount = 0;
  });

  it('returns null when online and not syncing', () => {
    const { queryByText } = render(<OfflineSyncBanner />);
    expect(queryByText(/Offline|Syncing/i)).toBeNull();
  });

  it('shows offline message when not online', () => {
    mockOfflineState.isOnline = false;
    const { getByText } = render(<OfflineSyncBanner />);
    expect(getByText(/Offline/i)).toBeTruthy();
  });

  it('shows syncing message when syncing', () => {
    mockOfflineState.isSyncing = true;
    const { getByText } = render(<OfflineSyncBanner />);
    expect(getByText(/Syncing/i)).toBeTruthy();
  });

  it('shows pending count when there are pending operations', () => {
    mockOfflineState.pendingCount = 3;
    const { getByText } = render(<OfflineSyncBanner />);
    expect(getByText(/3/)).toBeTruthy();
  });
});
