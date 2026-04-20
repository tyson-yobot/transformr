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

import { ActionToast } from '../../../components/ui/ActionToast';

describe('ActionToast', () => {
  it('renders message when visible', () => {
    const { getByText } = render(
      <ActionToast message="Workout saved!" visible onHide={jest.fn()} />,
    );
    expect(getByText('Workout saved!')).toBeTruthy();
  });

  it('returns null when not visible', () => {
    const { queryByText } = render(
      <ActionToast message="Workout saved!" visible={false} onHide={jest.fn()} />,
    );
    expect(queryByText('Workout saved!')).toBeNull();
  });

  it('renders subtext when provided', () => {
    const { getByText } = render(
      <ActionToast message="PR Hit!" subtext="New record" visible onHide={jest.fn()} />,
    );
    expect(getByText('New record')).toBeTruthy();
  });

  it('renders all toast types without crashing', () => {
    for (const type of ['success', 'pr', 'streak', 'info'] as const) {
      expect(() =>
        render(<ActionToast message="Test" visible onHide={jest.fn()} type={type} />),
      ).not.toThrow();
    }
  });
});
