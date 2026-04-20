import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: false,
    requiredTier: 'pro',
    showUpgradeModal: jest.fn(),
    checkAndPrompt: jest.fn(),
  })),
}));

import { FeatureLockOverlay } from '../../../components/ui/FeatureLockOverlay';

describe('FeatureLockOverlay', () => {
  const mockGoBack = jest.fn();

  it('renders title and description', () => {
    const { getByText } = render(
      <FeatureLockOverlay
        featureKey="ai_form_check_video"
        title="AI Form Check"
        description="Get instant AI feedback on your form."
        onGoBack={mockGoBack}
      />,
    );
    expect(getByText('AI Form Check')).toBeTruthy();
    expect(getByText(/AI feedback/i)).toBeTruthy();
  });

  it('calls onGoBack when back button pressed', () => {
    const onGoBack = jest.fn();
    const { getByText } = render(
      <FeatureLockOverlay
        featureKey="ai_form_check_video"
        title="AI Form Check"
        description="Description"
        onGoBack={onGoBack}
      />,
    );
    fireEvent.press(getByText(/Go Back|back/i));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });
});
