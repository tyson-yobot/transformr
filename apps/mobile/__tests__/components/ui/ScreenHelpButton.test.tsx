import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@utils/storage', () => ({
  getStorageBool: jest.fn().mockReturnValue(false),
  setStorageBool: jest.fn(),
}));

import { ScreenHelpButton } from '../../../components/ui/ScreenHelpButton';

const mockContent = {
  title: 'Dashboard Help',
  body: 'This is your dashboard overview.',
  steps: [],
};

describe('ScreenHelpButton', () => {
  it('renders without crashing', () => {
    expect(() => render(<ScreenHelpButton content={mockContent} />)).not.toThrow();
  });

  it('renders the info icon', () => {
    const { getByTestId } = render(<ScreenHelpButton content={mockContent} />);
    expect(getByTestId('icon-information-circle-outline')).toBeTruthy();
  });
});
