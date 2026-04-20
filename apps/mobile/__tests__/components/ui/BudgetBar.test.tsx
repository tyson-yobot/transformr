import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { BudgetBar } from '../../../components/ui/BudgetBar';

describe('BudgetBar', () => {
  it('renders without crashing', () => {
    expect(() => render(<BudgetBar spent={50} budget={100} />)).not.toThrow();
  });

  it('renders compact mode without crashing', () => {
    expect(() => render(<BudgetBar spent={50} budget={100} compact />)).not.toThrow();
  });

  it('renders when spent is zero', () => {
    expect(() => render(<BudgetBar spent={0} budget={100} />)).not.toThrow();
  });

  it('renders when spent exceeds budget', () => {
    expect(() => render(<BudgetBar spent={150} budget={100} />)).not.toThrow();
  });

  it('shows remaining amount in full mode', () => {
    const { getByText } = render(<BudgetBar spent={40} budget={100} />);
    // remaining = 100 - 40 = 60
    expect(getByText(/60/)).toBeTruthy();
  });
});
