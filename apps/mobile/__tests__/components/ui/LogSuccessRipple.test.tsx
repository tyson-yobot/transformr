import React, { createRef } from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('@/constants/haptics', () => ({ triggerHaptic: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

import { LogSuccessRipple, LogSuccessRippleHandle } from '../../../components/ui/LogSuccessRipple';

describe('LogSuccessRipple', () => {
  it('renders children', () => {
    const { getByText } = render(
      <LogSuccessRipple>
        <Text>Log</Text>
      </LogSuccessRipple>,
    );
    expect(getByText('Log')).toBeTruthy();
  });

  it('renders without crashing with no children', () => {
    expect(() => render(<LogSuccessRipple />)).not.toThrow();
  });

  it('trigger() can be called via ref without crashing', () => {
    const ref = createRef<LogSuccessRippleHandle>();
    render(
      <LogSuccessRipple ref={ref}>
        <Text>X</Text>
      </LogSuccessRipple>,
    );
    expect(() => ref.current?.trigger()).not.toThrow();
  });
});
