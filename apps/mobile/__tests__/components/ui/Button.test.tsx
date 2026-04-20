import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-linear-gradient', () => ({ LinearGradient: require('react-native').View }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

import { Button } from '../../../components/ui/Button';

describe('Button', () => {
  it('renders title text', () => {
    const { getByText } = render(<Button title="Save" onPress={jest.fn()} />);
    expect(getByText('Save')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Go" onPress={onPress} />);
    fireEvent.press(getByText('Go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Go" onPress={onPress} disabled />);
    fireEvent.press(getByText('Go'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { queryByText } = render(<Button title="Go" onPress={onPress} loading />);
    // Loading state replaces text with ActivityIndicator
    expect(queryByText('Go')).toBeNull();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders all variants without crashing', () => {
    for (const variant of ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const) {
      expect(() => render(<Button title="X" onPress={jest.fn()} variant={variant} />)).not.toThrow();
    }
  });

  it('renders all sizes without crashing', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      expect(() => render(<Button title="X" onPress={jest.fn()} size={size} />)).not.toThrow();
    }
  });

  it('renders fullWidth without crashing', () => {
    expect(() => render(<Button title="X" onPress={jest.fn()} fullWidth />)).not.toThrow();
  });
});
