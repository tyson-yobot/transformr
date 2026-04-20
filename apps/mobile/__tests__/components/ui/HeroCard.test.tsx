import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-image', () => ({ Image: require('react-native').Image }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: require('react-native').View }));

import { HeroCard } from '../../../components/ui/HeroCard';

describe('HeroCard', () => {
  it('renders children', () => {
    const { getByText } = render(<HeroCard><Text>Hero Content</Text></HeroCard>);
    expect(getByText('Hero Content')).toBeTruthy();
  });

  it('renders without heroImage without crashing', () => {
    expect(() => render(<HeroCard><Text>X</Text></HeroCard>)).not.toThrow();
  });

  it('renders with heroImage without crashing', () => {
    expect(() =>
      render(<HeroCard heroImage="https://example.com/img.jpg"><Text>X</Text></HeroCard>),
    ).not.toThrow();
  });
});
