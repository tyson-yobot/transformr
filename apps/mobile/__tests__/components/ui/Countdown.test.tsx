import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { Countdown } from '../../../components/ui/Countdown';

describe('Countdown', () => {
  it('renders without crashing for a future date', () => {
    const future = new Date(Date.now() + 86400000); // +1 day
    expect(() => render(<Countdown targetDate={future} />)).not.toThrow();
  });

  it('renders title when provided', () => {
    const future = new Date(Date.now() + 86400000);
    const { getByText } = render(<Countdown targetDate={future} title="Race Day" />);
    expect(getByText('Race Day')).toBeTruthy();
  });

  it('renders emoji when provided', () => {
    const future = new Date(Date.now() + 86400000);
    const { getByText } = render(<Countdown targetDate={future} emoji="🏃" />);
    expect(getByText('🏃')).toBeTruthy();
  });

  it('renders completed state without crashing', () => {
    const past = new Date(Date.now() - 1000); // already passed
    expect(() => render(<Countdown targetDate={past} />)).not.toThrow();
  });
});
