import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-linear-gradient', () => ({ LinearGradient: require('react-native').View }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

// Components used internally by EmptyState (Button)
jest.mock('@components/ui/Button', () => ({
  Button: ({ title, onPress }: { title: string; onPress: () => void }) => {
    const { Pressable, Text } = require('react-native');
    return <Pressable onPress={onPress}><Text>{title}</Text></Pressable>;
  },
}));

import { EmptyState } from '../../../components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    const { getByText } = render(
      <EmptyState title="No data yet" subtitle="Start tracking to see results" />,
    );
    expect(getByText('No data yet')).toBeTruthy();
    expect(getByText('Start tracking to see results')).toBeTruthy();
  });

  it('renders action button when actionLabel and onAction provided', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Empty"
        subtitle="Nothing here"
        actionLabel="Get Started"
        onAction={onAction}
      />,
    );
    expect(getByText('Get Started')).toBeTruthy();
  });

  it('calls onAction when button pressed', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Empty"
        subtitle="Nothing here"
        actionLabel="Go"
        onAction={onAction}
      />,
    );
    fireEvent.press(getByText('Go'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders emoji icon when icon prop provided', () => {
    const { getByText } = render(
      <EmptyState icon="🎯" title="T" subtitle="S" />,
    );
    expect(getByText('🎯')).toBeTruthy();
  });

  it('renders without crashing with no optional props', () => {
    expect(() => render(<EmptyState title="T" subtitle="S" />)).not.toThrow();
  });
});
