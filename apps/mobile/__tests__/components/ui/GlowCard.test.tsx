import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('@shopify/react-native-skia', () => {
  const { View } = require('react-native');
  return {
    Canvas: ({ children, ...p }: { children?: React.ReactNode }) => <View {...p}>{children}</View>,
    RoundedRect: ({ children, ...p }: { children?: React.ReactNode }) => <View {...p}>{children}</View>,
    BlurMask: (p: object) => <View {...p} />,
  };
});

import { GlowCard } from '../../../components/ui/GlowCard';

describe('GlowCard', () => {
  it('renders children', () => {
    const { getByText } = render(<GlowCard><Text>Content</Text></GlowCard>);
    expect(getByText('Content')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <GlowCard onPress={onPress}><Text>Tap me</Text></GlowCard>,
    );
    fireEvent.press(getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders all intensity levels without crashing', () => {
    for (const intensity of ['subtle', 'medium', 'intense'] as const) {
      expect(() =>
        render(<GlowCard intensity={intensity}><Text>X</Text></GlowCard>),
      ).not.toThrow();
    }
  });

  it('renders animated version without crashing', () => {
    expect(() =>
      render(<GlowCard animated><Text>Animated</Text></GlowCard>),
    ).not.toThrow();
  });
});
