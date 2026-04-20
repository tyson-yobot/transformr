import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());

import { ProgressBar } from '../../../components/ui/ProgressBar';

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    expect(() => render(<ProgressBar progress={0.5} />)).not.toThrow();
  });

  it('renders label when provided', () => {
    const { getByText } = render(<ProgressBar progress={0.5} label="Calories" />);
    expect(getByText('Calories')).toBeTruthy();
  });

  it('shows percentage when showPercentage is true', () => {
    const { getByText } = render(<ProgressBar progress={0.75} showPercentage />);
    expect(getByText('75%')).toBeTruthy();
  });

  it('clamps progress values outside 0-1 without crashing', () => {
    expect(() => render(<ProgressBar progress={1.5} />)).not.toThrow();
    expect(() => render(<ProgressBar progress={-0.5} />)).not.toThrow();
  });

  it('renders label and percentage together', () => {
    const { getByText } = render(
      <ProgressBar progress={0.8} label="Protein" showPercentage />,
    );
    expect(getByText('Protein')).toBeTruthy();
    expect(getByText('80%')).toBeTruthy();
  });

  it('shows 100% when progress is 1', () => {
    const { getByText } = render(<ProgressBar progress={1} showPercentage />);
    expect(getByText('100%')).toBeTruthy();
  });
});
