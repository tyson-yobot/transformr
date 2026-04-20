import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-image', () => ({ Image: require('react-native').Image }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: require('react-native').View }));

import { OnboardingBackground } from '../../../components/ui/OnboardingBackground';

describe('OnboardingBackground', () => {
  it('renders children', () => {
    const { getByText } = render(
      <OnboardingBackground imageUrl="https://example.com/photo.jpg">
        <Text>Welcome</Text>
      </OnboardingBackground>,
    );
    expect(getByText('Welcome')).toBeTruthy();
  });

  it('renders without crashing when no blurHash', () => {
    expect(() =>
      render(
        <OnboardingBackground imageUrl="https://example.com/photo.jpg">
          <Text>Content</Text>
        </OnboardingBackground>,
      ),
    ).not.toThrow();
  });
});
