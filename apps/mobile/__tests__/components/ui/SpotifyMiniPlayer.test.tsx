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
jest.mock('@services/spotify', () => ({
  getCurrentTrack: jest.fn().mockResolvedValue(null),
  pausePlayback: jest.fn().mockResolvedValue(undefined),
  resumePlayback: jest.fn().mockResolvedValue(undefined),
  skipNext: jest.fn().mockResolvedValue(undefined),
  skipPrevious: jest.fn().mockResolvedValue(undefined),
}));

import { SpotifyMiniPlayer } from '../../../components/ui/SpotifyMiniPlayer';

describe('SpotifyMiniPlayer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing when no track is playing', () => {
    expect(() => render(<SpotifyMiniPlayer userId="user-123" />)).not.toThrow();
  });

  it('renders without crashing when track data is available', async () => {
    const { getCurrentTrack } = require('@services/spotify') as {
      getCurrentTrack: jest.Mock;
    };
    getCurrentTrack.mockResolvedValueOnce({
      id: 'track-1',
      name: 'Eye of the Tiger',
      artists: ['Survivor'],
      albumArt: null,
      isPlaying: true,
      durationMs: 245000,
      progressMs: 10000,
    });
    expect(() => render(<SpotifyMiniPlayer userId="user-123" />)).not.toThrow();
  });
});
