import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
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

import { BottomSheet } from '../../../components/ui/BottomSheet';

describe('BottomSheet', () => {
  it('renders children when visible', () => {
    const { getByText } = render(
      <BottomSheet visible onDismiss={jest.fn()}>
        <Text>Sheet Content</Text>
      </BottomSheet>,
    );
    expect(getByText('Sheet Content')).toBeTruthy();
  });

  it('renders without crashing when not visible', () => {
    expect(() =>
      render(
        <BottomSheet visible={false} onDismiss={jest.fn()}>
          <Text>Hidden</Text>
        </BottomSheet>,
      ),
    ).not.toThrow();
  });

  it('renders without handle when showHandle=false', () => {
    expect(() =>
      render(
        <BottomSheet visible onDismiss={jest.fn()} showHandle={false}>
          <Text>No handle</Text>
        </BottomSheet>,
      ),
    ).not.toThrow();
  });
});
