import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@utils/haptics', () => ({
  hapticLight: jest.fn().mockResolvedValue(undefined),
  hapticMedium: jest.fn().mockResolvedValue(undefined),
  hapticWarning: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@services/voice', () => ({
  startRecording: jest.fn().mockResolvedValue(undefined),
  stopRecording: jest.fn().mockResolvedValue(null),
  isRecording: jest.fn().mockReturnValue(false),
  transcribeAudio: jest.fn().mockResolvedValue(''),
  parseVoiceCommandAI: jest.fn().mockResolvedValue({ type: 'unknown' }),
}));

import { VoiceMicButton } from '../../../components/ui/VoiceMicButton';

describe('VoiceMicButton', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <VoiceMicButton
          context={{ screen: 'workout', sessionId: 'sess-1' }}
          onCommand={jest.fn()}
        />,
      ),
    ).not.toThrow();
  });

  it('renders disabled state without crashing', () => {
    expect(() =>
      render(
        <VoiceMicButton
          context={{ screen: 'workout', sessionId: 'sess-1' }}
          onCommand={jest.fn()}
          disabled
        />,
      ),
    ).not.toThrow();
  });
});
