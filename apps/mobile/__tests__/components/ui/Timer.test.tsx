import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({ sound: { unloadAsync: jest.fn() } }),
    },
  },
}));
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...p }: { children?: React.ReactNode }) => <View {...p}>{children}</View>,
    Svg: ({ children, ...p }: { children?: React.ReactNode }) => <View {...p}>{children}</View>,
    Circle: (p: object) => <View {...p} />,
  };
});

import { Timer } from '../../../components/ui/Timer';

describe('Timer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    expect(() => render(<Timer durationSeconds={60} />)).not.toThrow();
  });

  it('renders title when provided', () => {
    const { getByText } = render(<Timer durationSeconds={90} title="Rest" />);
    expect(getByText('Rest')).toBeTruthy();
  });

  it('shows Start button initially', () => {
    const { getByText } = render(<Timer durationSeconds={60} />);
    expect(getByText('Start')).toBeTruthy();
  });

  it('shows Pause button after Start is pressed', () => {
    const { getByText } = render(<Timer durationSeconds={60} />);
    fireEvent.press(getByText('Start'));
    expect(getByText('Pause')).toBeTruthy();
  });

  it('shows Resume and Reset after Pause is pressed', () => {
    const { getByText } = render(<Timer durationSeconds={60} />);
    fireEvent.press(getByText('Start'));
    fireEvent.press(getByText('Pause'));
    expect(getByText('Resume')).toBeTruthy();
    expect(getByText('Reset')).toBeTruthy();
  });
});
