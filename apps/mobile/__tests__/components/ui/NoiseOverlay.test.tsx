import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...p }: { children?: React.ReactNode }) => <View {...p}>{children}</View>,
    Svg: ({ children, ...p }: { children?: React.ReactNode }) => <View {...p}>{children}</View>,
    Filter: ({ children, ...p }: { children?: React.ReactNode }) => <View {...p}>{children}</View>,
    FeTurbulence: (p: object) => <View {...p} />,
    FeColorMatrix: (p: object) => <View {...p} />,
    Rect: (p: object) => <View {...p} />,
  };
});

import { NoiseOverlay } from '../../../components/ui/NoiseOverlay';

describe('NoiseOverlay', () => {
  it('renders without crashing on iOS', () => {
    // Platform.OS is 'ios' in the mock
    expect(() => render(<NoiseOverlay />)).not.toThrow();
  });

  it('renders with custom opacity without crashing', () => {
    expect(() => render(<NoiseOverlay opacity={0.05} />)).not.toThrow();
  });
});
