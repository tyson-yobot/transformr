import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

import { Disclaimer } from '../../../components/ui/Disclaimer';

describe('Disclaimer', () => {
  it('renders supplement disclaimer', () => {
    const { getByText } = render(<Disclaimer type="supplement" />);
    expect(getByText(/supplement/i)).toBeTruthy();
  });

  it('renders all types without crashing', () => {
    const types = ['supplement', 'lab', 'nutrition', 'workout', 'general', 'sleep'] as const;
    for (const type of types) {
      expect(() => render(<Disclaimer type={type} />)).not.toThrow();
    }
  });

  it('renders compact mode without crashing', () => {
    expect(() => render(<Disclaimer type="general" compact />)).not.toThrow();
  });
});
