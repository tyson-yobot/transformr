import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

import { DashboardSkeleton } from '../../../components/ui/ScreenSkeleton';

describe('DashboardSkeleton', () => {
  it('renders without crashing', () => {
    expect(() => render(<DashboardSkeleton />)).not.toThrow();
  });
});
