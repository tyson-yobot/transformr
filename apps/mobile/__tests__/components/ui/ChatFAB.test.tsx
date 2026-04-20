import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

import { ChatFAB } from '../../../components/ui/ChatFAB';

describe('ChatFAB', () => {
  it('renders without crashing', () => {
    expect(() => render(<ChatFAB />)).not.toThrow();
  });

  it('calls custom onPress when provided', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ChatFAB onPress={onPress} />);
    fireEvent.press(getByTestId('icon-sparkles'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
