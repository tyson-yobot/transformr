import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => (() => void) | void) => { const cleanup = cb(); return () => cleanup?.(); },
}));

import { AmbientBackground } from '../../../components/ui/AmbientBackground';

describe('AmbientBackground', () => {
  it('renders without crashing', () => {
    expect(() => render(<AmbientBackground />)).not.toThrow();
  });
});
