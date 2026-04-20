import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { Badge } from '../../../components/ui/Badge';

describe('Badge', () => {
  it('renders label text', () => {
    const { getByText } = render(<Badge label="Active" />);
    expect(getByText('Active')).toBeTruthy();
  });

  it('renders all variants without crashing', () => {
    for (const variant of ['default', 'success', 'warning', 'danger', 'info'] as const) {
      expect(() => render(<Badge label="Test" variant={variant} />)).not.toThrow();
    }
  });

  it('dot mode renders without label', () => {
    const { queryByText } = render(<Badge dot />);
    expect(queryByText('Test')).toBeNull();
  });

  it('renders sm and md sizes', () => {
    expect(() => render(<Badge label="S" size="sm" />)).not.toThrow();
    expect(() => render(<Badge label="M" size="md" />)).not.toThrow();
  });
});
