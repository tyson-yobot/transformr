import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: jest.fn(() => ({
      onStart: jest.fn(() => ({ onUpdate: jest.fn(() => ({ onEnd: jest.fn() })) })),
    })),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

import { Slider } from '../../../components/ui/Slider';

describe('Slider', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<Slider value={50} onValueChange={jest.fn()} />),
    ).not.toThrow();
  });

  it('renders label when provided', () => {
    const { getByText } = render(
      <Slider value={50} onValueChange={jest.fn()} label="Volume" />,
    );
    expect(getByText('Volume')).toBeTruthy();
  });

  it('renders with custom min/max without crashing', () => {
    expect(() =>
      render(<Slider value={5} onValueChange={jest.fn()} min={0} max={10} />),
    ).not.toThrow();
  });

  it('renders with showValue=false without crashing', () => {
    expect(() =>
      render(<Slider value={50} onValueChange={jest.fn()} showValue={false} />),
    ).not.toThrow();
  });
});
