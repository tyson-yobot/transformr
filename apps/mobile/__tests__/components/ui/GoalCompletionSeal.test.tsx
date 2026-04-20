import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('@/constants/haptics', () => ({ triggerHaptic: jest.fn() }));

import { GoalCompletionSeal } from '../../../components/ui/GoalCompletionSeal';

describe('GoalCompletionSeal', () => {
  it('renders children when not complete', () => {
    const { getByText } = render(
      <GoalCompletionSeal goalKey="calories" isComplete={false} accentColor="#A855F7">
        <Text>Ring</Text>
      </GoalCompletionSeal>,
    );
    expect(getByText('Ring')).toBeTruthy();
  });

  it('renders children when complete', () => {
    const { getByText } = render(
      <GoalCompletionSeal goalKey="steps" isComplete={true} accentColor="#22C55E">
        <Text>Done</Text>
      </GoalCompletionSeal>,
    );
    expect(getByText('Done')).toBeTruthy();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <GoalCompletionSeal goalKey="protein" isComplete={false} accentColor="#A855F7">
          <Text>X</Text>
        </GoalCompletionSeal>,
      ),
    ).not.toThrow();
  });
});
