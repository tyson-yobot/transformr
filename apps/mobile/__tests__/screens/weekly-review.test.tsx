import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/GlowCard', () => ({ GlowCard: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/PurpleRadialBackground', () => ({ PurpleRadialBackground: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/EmptyState', () => ({ EmptyState: ({ title }: { title: string }) => {
  const { Text } = require('react-native');
  return <Text>{title}</Text>;
}}));
jest.mock('@components/ui/Skeleton', () => ({ Skeleton: () => null }));
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@components/social/ShareButton', () => ({ ShareButton: () => null }));
jest.mock('@utils/formatters', () => ({
  formatNumber: (n: number) => String(n),
  formatCurrency: (n: number) => `$${n}`,
  formatPercentage: (n: number) => `${n}%`,
  getGradeColor: () => '#22C55E',
}));
jest.mock('@services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
  },
}));

import WeeklyReviewScreen from '../../app/weekly-review';

describe('WeeklyReview screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<WeeklyReviewScreen />)).not.toThrow();
  });

  it('renders some content', () => {
    const { getByText } = render(<WeeklyReviewScreen />);
    // Shows either header or empty state
    expect(getByText(/Weekly Review|Could not load/i)).toBeTruthy();
  });
});
