import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

import ErrorBoundary from '../../app/error';

describe('ErrorBoundary screen', () => {
  it('renders error message', () => {
    const error = new Error('Something broke');
    const { getByText } = render(<ErrorBoundary error={error} retry={jest.fn()} />);
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Something broke')).toBeTruthy();
  });

  it('renders with non-Error object', () => {
    const { getByText } = render(
      <ErrorBoundary error="plain string error" retry={jest.fn()} />,
    );
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('renders Get Help button', () => {
    const { getByText } = render(
      <ErrorBoundary error={new Error('oops')} retry={jest.fn()} />,
    );
    expect(getByText('Get Help')).toBeTruthy();
  });
});
