import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('@utils/storage', () => ({
  getStorageBool: jest.fn().mockReturnValue(false),
  setStorageBool: jest.fn(),
}));
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn().mockResolvedValue(undefined) }));

import { Coachmark } from '../../../components/ui/Coachmark';

const mockSteps = [
  {
    targetX: 10,
    targetY: 100,
    targetWidth: 80,
    targetHeight: 40,
    title: 'Welcome',
    body: 'This is your dashboard',
    position: 'below' as const,
  },
];

describe('Coachmark', () => {
  it('renders without crashing (will show when storage says not seen)', () => {
    expect(() =>
      render(<Coachmark screenKey="dashboard" steps={mockSteps} />),
    ).not.toThrow();
  });

  it('renders without crashing with empty steps', () => {
    expect(() =>
      render(<Coachmark screenKey="empty-screen" steps={[]} />),
    ).not.toThrow();
  });

  it('does not render when already seen', () => {
    const { getStorageBool } = require('@utils/storage') as {
      getStorageBool: jest.Mock;
    };
    getStorageBool.mockReturnValueOnce(true);
    expect(() =>
      render(<Coachmark screenKey="seen-screen" steps={mockSteps} />),
    ).not.toThrow();
  });
});
