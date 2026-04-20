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
jest.mock('@/constants/haptics', () => ({ triggerHaptic: jest.fn() }));

import { StatTile } from '../../../components/ui/StatTile';

describe('StatTile', () => {
  it('renders label', () => {
    const { getByText } = render(<StatTile label="Steps" value={1000} />);
    expect(getByText('Steps')).toBeTruthy();
  });

  it('renders unit when provided', () => {
    const { getByText } = render(<StatTile label="Weight" value={75} unit="kg" />);
    expect(getByText('kg')).toBeTruthy();
  });

  it('does not render unit when not provided', () => {
    const { queryByText } = render(<StatTile label="Streak" value={7} />);
    expect(queryByText('kg')).toBeNull();
  });

  it('renders with showFlame prop without crashing', () => {
    expect(() => render(<StatTile label="Streak" value={7} showFlame />)).not.toThrow();
  });

  it('renders without crashing for zero value', () => {
    expect(() => render(<StatTile label="PRs" value={0} />)).not.toThrow();
  });
});
