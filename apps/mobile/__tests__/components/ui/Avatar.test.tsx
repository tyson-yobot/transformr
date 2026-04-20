import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { Avatar } from '../../../components/ui/Avatar';

describe('Avatar', () => {
  it('renders initials from first and last name', () => {
    const { getByText } = render(<Avatar name="John Doe" />);
    expect(getByText('JD')).toBeTruthy();
  });

  it('renders first two chars of single name', () => {
    const { getByText } = render(<Avatar name="Alice" />);
    expect(getByText('AL')).toBeTruthy();
  });

  it('renders ? when no name provided', () => {
    const { getByText } = render(<Avatar />);
    expect(getByText('?')).toBeTruthy();
  });

  it('renders all sizes without crashing', () => {
    for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
      expect(() => render(<Avatar name="John" size={size} />)).not.toThrow();
    }
  });

  it('renders online indicator when showOnlineIndicator is true', () => {
    expect(() => render(<Avatar name="John" showOnlineIndicator isOnline />)).not.toThrow();
  });

  it('renders offline indicator when isOnline is false', () => {
    expect(() => render(<Avatar name="John" showOnlineIndicator isOnline={false} />)).not.toThrow();
  });
});
