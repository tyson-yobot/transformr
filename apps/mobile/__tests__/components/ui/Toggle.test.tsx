import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { Toggle } from '../../../components/ui/Toggle';

describe('Toggle', () => {
  it('renders without crashing', () => {
    expect(() => render(<Toggle value={false} onValueChange={jest.fn()} />)).not.toThrow();
  });

  it('renders label when provided', () => {
    const { getByText } = render(
      <Toggle value={false} onValueChange={jest.fn()} label="Notifications" />,
    );
    expect(getByText('Notifications')).toBeTruthy();
  });

  it('calls onValueChange with toggled value when pressed', () => {
    const onValueChange = jest.fn();
    const { UNSAFE_getByProps } = render(<Toggle value={false} onValueChange={onValueChange} />);
    const pressable = UNSAFE_getByProps({ accessibilityRole: 'switch' });
    fireEvent.press(pressable);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('does not call onValueChange when disabled', () => {
    const onValueChange = jest.fn();
    const { UNSAFE_getByProps } = render(
      <Toggle value={false} onValueChange={onValueChange} disabled />,
    );
    const pressable = UNSAFE_getByProps({ accessibilityRole: 'switch' });
    fireEvent.press(pressable);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('renders in on state without crashing', () => {
    expect(() => render(<Toggle value={true} onValueChange={jest.fn()} />)).not.toThrow();
  });
});
