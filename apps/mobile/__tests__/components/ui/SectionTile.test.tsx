import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

import { SectionTile } from '../../../components/ui/SectionTile';

describe('SectionTile', () => {
  const baseProps = {
    icon: 'fitness-outline' as const,
    label: 'Workouts',
    onPress: jest.fn(),
  };

  it('renders label', () => {
    const { getByText } = render(<SectionTile {...baseProps} />);
    expect(getByText('Workouts')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<SectionTile {...baseProps} onPress={onPress} />);
    fireEvent.press(getByText('Workouts'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders selected state without crashing', () => {
    expect(() => render(<SectionTile {...baseProps} isSelected />)).not.toThrow();
  });

  it('renders all sizes without crashing', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      expect(() => render(<SectionTile {...baseProps} size={size} />)).not.toThrow();
    }
  });
});
