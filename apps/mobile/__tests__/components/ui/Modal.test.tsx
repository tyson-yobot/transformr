import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { Modal } from '../../../components/ui/Modal';

describe('Modal', () => {
  it('renders children when visible', () => {
    const { getByText } = render(
      <Modal visible onDismiss={jest.fn()}>
        <Text>Modal Content</Text>
      </Modal>,
    );
    expect(getByText('Modal Content')).toBeTruthy();
  });

  it('returns null when not visible', () => {
    const { queryByText } = render(
      <Modal visible={false} onDismiss={jest.fn()}>
        <Text>Hidden</Text>
      </Modal>,
    );
    expect(queryByText('Hidden')).toBeNull();
  });

  it('renders title when provided', () => {
    const { getByText } = render(
      <Modal visible onDismiss={jest.fn()} title="Settings">
        <Text>Content</Text>
      </Modal>,
    );
    expect(getByText('Settings')).toBeTruthy();
  });

  it('calls onDismiss when close button pressed', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <Modal visible onDismiss={onDismiss} showCloseButton>
        <Text>Content</Text>
      </Modal>,
    );
    fireEvent.press(getByText('✕'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders without close button when showCloseButton is false', () => {
    const { queryByText } = render(
      <Modal visible onDismiss={jest.fn()} showCloseButton={false}>
        <Text>Content</Text>
      </Modal>,
    );
    expect(queryByText('✕')).toBeNull();
  });
});
