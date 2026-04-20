import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...p }: { children?: React.ReactNode }) => <View {...p}>{children}</View>,
    Svg: ({ children, ...p }: { children?: React.ReactNode }) => <View {...p}>{children}</View>,
    Circle: (p: object) => <View {...p} />,
  };
});

import { ProgressRing } from '../../../components/ui/ProgressRing';

describe('ProgressRing', () => {
  it('renders without crashing', () => {
    expect(() => render(<ProgressRing progress={0.5} />)).not.toThrow();
  });

  it('renders with 0 progress', () => {
    expect(() => render(<ProgressRing progress={0} />)).not.toThrow();
  });

  it('renders with 1 progress (full)', () => {
    expect(() => render(<ProgressRing progress={1} />)).not.toThrow();
  });

  it('renders children content', () => {
    const { getByText } = render(
      <ProgressRing progress={0.75}>
        <Text>75%</Text>
      </ProgressRing>,
    );
    expect(getByText('75%')).toBeTruthy();
  });

  it('renders with custom size and strokeWidth', () => {
    expect(() => render(<ProgressRing progress={0.5} size={80} strokeWidth={6} />)).not.toThrow();
  });

  it('clamps values outside 0-1 without crashing', () => {
    expect(() => render(<ProgressRing progress={1.5} />)).not.toThrow();
    expect(() => render(<ProgressRing progress={-0.5} />)).not.toThrow();
  });
});
