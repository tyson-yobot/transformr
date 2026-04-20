import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { MonoText } from '../../../components/ui/MonoText';

describe('MonoText', () => {
  it('renders children text', () => {
    const { getByText } = render(<MonoText>42</MonoText>);
    expect(getByText('42')).toBeTruthy();
  });

  it('renders all variants without crashing', () => {
    const variants = ['stat', 'statSmall', 'countdown', 'monoBody', 'monoCaption'] as const;
    for (const variant of variants) {
      expect(() => render(<MonoText variant={variant}>100</MonoText>)).not.toThrow();
    }
  });

  it('accepts custom color prop without crashing', () => {
    expect(() => render(<MonoText color="#FF0000">Value</MonoText>)).not.toThrow();
  });
});
