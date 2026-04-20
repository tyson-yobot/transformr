import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import { HelpBubble } from '../../../components/ui/HelpBubble';

describe('HelpBubble', () => {
  it('renders without crashing (starts hidden pending async check)', () => {
    // HelpBubble renders null until async storage check completes
    expect(() =>
      render(<HelpBubble id="tip-workout" message="Swipe to delete" position="below" />),
    ).not.toThrow();
  });

  it('renders without crashing with showOnce=false', () => {
    expect(() =>
      render(
        <HelpBubble
          id="tip-nutrition"
          message="Tap a meal to log macros"
          position="above"
          showOnce={false}
        />,
      ),
    ).not.toThrow();
  });
});
