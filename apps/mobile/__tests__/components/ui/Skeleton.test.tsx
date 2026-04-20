import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { Skeleton } from '../../../components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders text variant without crashing', () => {
    expect(() => render(<Skeleton variant="text" />)).not.toThrow();
  });

  it('renders circle variant without crashing', () => {
    expect(() => render(<Skeleton variant="circle" />)).not.toThrow();
  });

  it('renders card variant without crashing', () => {
    expect(() => render(<Skeleton variant="card" />)).not.toThrow();
  });

  it('renders with custom width and height without crashing', () => {
    expect(() => render(<Skeleton width={200} height={40} />)).not.toThrow();
  });

  it('renders with custom borderRadius without crashing', () => {
    expect(() => render(<Skeleton borderRadius={20} />)).not.toThrow();
  });
});
