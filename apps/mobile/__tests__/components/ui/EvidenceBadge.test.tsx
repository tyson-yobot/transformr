import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

import { EvidenceBadge } from '../../../components/ui/EvidenceBadge';

describe('EvidenceBadge', () => {
  it('renders all evidence levels without crashing', () => {
    const levels = ['strong', 'moderate', 'emerging', 'anecdotal'] as const;
    for (const level of levels) {
      expect(() => render(<EvidenceBadge level={level} />)).not.toThrow();
    }
  });

  it('renders level label text', () => {
    const { getByText } = render(<EvidenceBadge level="strong" />);
    expect(getByText(/strong/i)).toBeTruthy();
  });

  it('renders compact mode without crashing', () => {
    expect(() => render(<EvidenceBadge level="moderate" compact />)).not.toThrow();
  });

  it('shows sources when tapped and sources provided', () => {
    const sources = [
      { title: 'Effect of creatine', year: 2021, type: 'meta_analysis' as const },
    ];
    const { getByText } = render(<EvidenceBadge level="strong" sources={sources} />);
    fireEvent.press(getByText(/strong/i));
    expect(getByText(/Effect of creatine/)).toBeTruthy();
  });

  it('does not show sources section when no sources provided', () => {
    const { queryByText } = render(<EvidenceBadge level="emerging" />);
    expect(queryByText(/Meta-analysis/)).toBeNull();
  });
});
