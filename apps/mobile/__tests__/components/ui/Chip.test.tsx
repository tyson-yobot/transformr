import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { Chip } from '../../../components/ui/Chip';

describe('Chip', () => {
  it('renders label', () => {
    const { getByText } = render(<Chip label="Fitness" />);
    expect(getByText('Fitness')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Chip label="Cardio" onPress={onPress} />);
    fireEvent.press(getByText('Cardio'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Chip label="Cardio" onPress={onPress} disabled />);
    fireEvent.press(getByText('Cardio'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders selected state without crashing', () => {
    expect(() => render(<Chip label="Selected" selected />)).not.toThrow();
  });

  it('renders unselected state without crashing', () => {
    expect(() => render(<Chip label="Unselected" selected={false} />)).not.toThrow();
  });
});
