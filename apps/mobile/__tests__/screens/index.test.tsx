import React from 'react';
import { render } from '@testing-library/react-native';

// Mock binary assets before module loading
jest.mock('../../assets/images/transformr-icon.png', () => 1);
jest.mock('../../assets/images/gym-hero.jpg', () => 1);

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@stores/authStore', () => ({
  useAuthStore: jest.fn((selector: (s: object) => unknown) => {
    const state = { session: null, loading: false };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector: (s: object) => unknown) => {
    const state = {
      profile: null,
      fetchProfile: jest.fn().mockResolvedValue(undefined),
      getState: jest.fn(() => ({ profile: null, loadFromProfile: jest.fn() })),
    };
    return selector ? selector(state) : state;
  }),
  // Static getState used directly
}));
jest.mock('@stores/settingsStore', () => ({
  useSettingsStore: jest.fn((selector: (s: object) => unknown) => {
    const state = { loadFromProfile: jest.fn(), updateSetting: jest.fn(), lastBriefingDate: null };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/gamificationStore', () => ({
  useGamificationStore: jest.fn((selector: (s: object) => unknown) => {
    const state = { setTone: jest.fn() };
    return selector ? selector(state) : state;
  }),
}));

import IndexScreen from '../../app/index';

describe('Index (splash) screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<IndexScreen />)).not.toThrow();
  });
});
