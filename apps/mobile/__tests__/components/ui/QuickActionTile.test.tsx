import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

import { QuickActionTile } from '../../../components/ui/QuickActionTile';

describe('QuickActionTile', () => {
  const baseProps = {
    icon: 'barbell-outline' as const,
    label: 'Log Workout',
    accentColor: '#A855F7',
    dimColor: 'rgba(168,85,247,0.1)',
    onPress: jest.fn(),
  };

  it('renders label', () => {
    const { getByText } = render(<QuickActionTile {...baseProps} />);
    expect(getByText('Log Workout')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<QuickActionTile {...baseProps} onPress={onPress} />);
    fireEvent.press(getByText('Log Workout'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without crashing with different icons', () => {
    expect(() =>
      render(<QuickActionTile {...baseProps} icon="nutrition-outline" label="Log Meal" />),
    ).not.toThrow();
  });
});
