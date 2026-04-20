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

import { Card } from '../../../components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Card><Text>Hello Card</Text></Card>,
    );
    expect(getByText('Hello Card')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Card onPress={onPress}><Text>Press me</Text></Card>,
    );
    fireEvent.press(getByText('Press me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders header when provided', () => {
    const { getByText } = render(
      <Card header={<Text>Header</Text>}><Text>Body</Text></Card>,
    );
    expect(getByText('Header')).toBeTruthy();
  });

  it('renders footer when provided', () => {
    const { getByText } = render(
      <Card footer={<Text>Footer</Text>}><Text>Body</Text></Card>,
    );
    expect(getByText('Footer')).toBeTruthy();
  });

  it('renders all variants without crashing', () => {
    const variants = [
      'default', 'elevated', 'ai', 'success', 'fire',
      'gold', 'partner', 'danger', 'flat', 'outlined', 'featured',
    ] as const;
    for (const variant of variants) {
      expect(() => render(<Card variant={variant}><Text>X</Text></Card>)).not.toThrow();
    }
  });
});
