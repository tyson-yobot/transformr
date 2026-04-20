import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { AnimatedNumber } from '../../../components/ui/AnimatedNumber';

describe('AnimatedNumber', () => {
  it('renders with a numeric value without crashing', () => {
    expect(() => render(<AnimatedNumber value={42} />)).not.toThrow();
  });

  it('renders value 0 without crashing', () => {
    expect(() => render(<AnimatedNumber value={0} />)).not.toThrow();
  });

  it('renders with formatFn without crashing', () => {
    expect(() =>
      render(<AnimatedNumber value={1500} formatFn={(n) => `${n} cal`} />),
    ).not.toThrow();
  });

  it('renders with overshoot prop without crashing', () => {
    expect(() => render(<AnimatedNumber value={10} overshoot />)).not.toThrow();
  });
});
