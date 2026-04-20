import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('@shopify/react-native-skia', () => {
  const { View } = require('react-native');
  return {
    Canvas: ({ children, ...p }: { children?: React.ReactNode }) => <View {...p}>{children}</View>,
    Rect: ({ children, ...p }: { children?: React.ReactNode }) => <View {...p}>{children}</View>,
    RadialGradient: (p: object) => <View {...p} />,
    vec: (x: number, y: number) => ({ x, y }),
  };
});

import { PurpleRadialBackground } from '../../../components/ui/PurpleRadialBackground';

describe('PurpleRadialBackground', () => {
  it('renders without crashing', () => {
    expect(() => render(<PurpleRadialBackground />)).not.toThrow();
  });

  it('renders with custom opacity and centerY', () => {
    expect(() => render(<PurpleRadialBackground opacity={0.5} centerY={0.3} />)).not.toThrow();
  });
});
