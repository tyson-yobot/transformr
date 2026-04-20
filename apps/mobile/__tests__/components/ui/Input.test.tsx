import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { Input } from '../../../components/ui/Input';

describe('Input', () => {
  it('renders without crashing', () => {
    expect(() => render(<Input />)).not.toThrow();
  });

  it('renders label when provided', () => {
    const { getByText } = render(<Input label="Email" />);
    expect(getByText('Email')).toBeTruthy();
  });

  it('renders error message when error prop provided', () => {
    const { getByText } = render(<Input error="Invalid email" />);
    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('renders Show/Hide toggle for secureTextEntry', () => {
    const { getByText } = render(<Input secureTextEntry />);
    expect(getByText('Show')).toBeTruthy();
  });

  it('toggles Show/Hide when pressed', () => {
    const { getByText } = render(<Input secureTextEntry />);
    fireEvent.press(getByText('Show'));
    expect(getByText('Hide')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { UNSAFE_getByProps } = render(<Input onChangeText={onChangeText} />);
    const input = UNSAFE_getByProps({ editable: undefined }) ?? UNSAFE_getByProps({});
    fireEvent.changeText(input, 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('renders with multiline without crashing', () => {
    expect(() => render(<Input multiline />)).not.toThrow();
  });

  it('renders label and error together', () => {
    const { getByText: gt } = render(<Input label="Name" error="Required" />);
    expect(gt('Name')).toBeTruthy();
    expect(gt('Required')).toBeTruthy();
  });
});
