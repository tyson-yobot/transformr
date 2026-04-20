import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@components/ui/ScreenSkeleton', () => ({ ListSkeleton: () => null }));
jest.mock('@components/ui/PurpleRadialBackground', () => ({ PurpleRadialBackground: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/Disclaimer', () => ({ Disclaimer: () => null }));
jest.mock('@stores/labsStore', () => ({
  useLabsStore: jest.fn((selector: (s: object) => unknown) => {
    const state = {
      uploads: [],
      isLoading: false,
      fetchUploads: jest.fn().mockResolvedValue(undefined),
      fetchUploadList: jest.fn().mockResolvedValue(undefined),
      uploadLab: jest.fn().mockResolvedValue(undefined),
      deleteUpload: jest.fn().mockResolvedValue(undefined),
      getUploadById: jest.fn().mockReturnValue(null),
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@utils/haptics', () => ({
  hapticLight: jest.fn(),
  hapticMedium: jest.fn(),
}));

// ── Labs index ───────────────────────────────────────────────────────────────
import LabsIndexScreen from '../../app/labs/index';

describe('Labs index screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<LabsIndexScreen />)).not.toThrow();
  });
});
