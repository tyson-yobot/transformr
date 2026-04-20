import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => children,
  Rect: () => null, RoundedRect: () => null, BlurMask: () => null,
  RadialGradient: () => null, vec: jest.fn().mockReturnValue({ x: 0, y: 0 }),
  Fill: () => null, Path: () => null, LinearGradient: () => null,
  useFont: jest.fn().mockReturnValue(null),
}));
jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'upload-1' }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(), navigate: jest.fn(),
    setOptions: jest.fn(), getParent: jest.fn(() => ({ setOptions: jest.fn() })),
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  MediaTypeOptions: { Images: 'Images', All: 'All' },
}));
jest.mock('expo-file-system', () => ({
  documentDirectory: '/documents/',
  downloadAsync: jest.fn().mockResolvedValue({ uri: '' }),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

// UI Components
jest.mock('@components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/Button', () => ({
  Button: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('@components/ui/Badge', () => ({ Badge: () => null }));
jest.mock('@components/ui/Avatar', () => ({ Avatar: () => null }));
jest.mock('@components/ui/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('@components/ui/Skeleton', () => ({ Skeleton: () => null }));
jest.mock('@components/ui/ProgressBar', () => ({ ProgressBar: () => null }));
jest.mock('@components/ui/GatePromptCard', () => ({ GatePromptCard: () => null }));
jest.mock('@components/ui/PurpleRadialBackground', () => ({
  PurpleRadialBackground: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@components/ui/ScreenSkeleton', () => ({
  ListSkeleton: () => null, DashboardSkeleton: () => null, DetailSkeleton: () => null,
}));
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@components/ui/Disclaimer', () => ({ Disclaimer: () => null }));
jest.mock('@components/partner/NudgeButton', () => ({ NudgeButton: () => null }));

// Hooks
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: true,
    requiredTier: 'free',
    showUpgradeModal: jest.fn(),
    upgradeMessage: '',
  })),
}));

// Utils
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn(), hapticMedium: jest.fn() }));
jest.mock('@utils/formatters', () => ({
  formatNumber: (n: number) => String(n),
  formatDate: (d: string) => d,
  formatRelativeTime: () => '2h ago',
  formatCurrency: (n: number) => `$${n}`,
}));

// Stores
const mockPartnerState = {
  partner: null,
  partnerProfile: null,
  partnership: null,
  partnerStats: null,
  partnerWorkouts: [],
  isLoading: false,
  fetchPartnership: jest.fn().mockResolvedValue(undefined),
  sendNudge: jest.fn().mockResolvedValue(undefined),
  fetchPartnerChallenges: jest.fn().mockResolvedValue(undefined),
  partnerChallenges: [],
};
jest.mock('@stores/partnerStore', () => ({
  usePartnerStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockPartnerState) : mockPartnerState
  ),
}));

const mockProfileState = {
  profile: { id: 'u1', name: 'Test', display_name: 'Test User' },
  isLoading: false,
  fetchProfile: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockProfileState) : mockProfileState
  ),
}));

const mockLabsState = {
  uploads: [],
  isLoading: false,
  fetchUploads: jest.fn().mockResolvedValue(undefined),
  fetchUploadList: jest.fn().mockResolvedValue(undefined),
  uploadLab: jest.fn().mockResolvedValue(undefined),
  deleteUpload: jest.fn().mockResolvedValue(undefined),
  getUploadById: jest.fn().mockReturnValue(null),
};
jest.mock('@stores/labsStore', () => ({
  useLabsStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockLabsState) : mockLabsState
  ),
}));

const mockAuthState = {
  session: { user: { id: 'u1' } },
  loading: false,
  signIn: jest.fn().mockResolvedValue(undefined),
  signOut: jest.fn().mockResolvedValue(undefined),
};
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { supabaseUrl: '', supabaseAnonKey: '' } } },
}));
jest.mock('@services/supabase', () => {
  const chain: Record<string, unknown> = {};
  const resolved = Promise.resolve({ data: [], error: null });
  ['eq', 'neq', 'in', 'order', 'limit', 'single'].forEach(
    (m) => { chain[m] = jest.fn(() => chain); }
  );
  chain['then'] = (resolve: (v: { data: unknown[]; error: null }) => void) =>
    resolved.then(resolve);
  return {
    supabase: {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: jest.fn(() => ({ select: jest.fn(() => chain) })),
    },
  };
});
jest.mock('@stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState
  ),
}));

// ── Partner Challenges ────────────────────────────────────────────────────────
import PartnerChallengesScreen from '../../app/partner/challenges';

describe('Partner Challenges screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<PartnerChallengesScreen />)).not.toThrow();
  });
});

// ── Partner Live Workout ──────────────────────────────────────────────────────
import PartnerLiveWorkoutScreen from '../../app/partner/live-workout';

describe('Partner Live Workout screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<PartnerLiveWorkoutScreen />)).not.toThrow();
  });
});

// ── Partner Nudge ─────────────────────────────────────────────────────────────
import PartnerNudgeScreen from '../../app/partner/nudge';

describe('Partner Nudge screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<PartnerNudgeScreen />)).not.toThrow();
  });
});

// ── Labs Detail ───────────────────────────────────────────────────────────────
import LabsDetailScreen from '../../app/labs/detail';

describe('Labs Detail screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<LabsDetailScreen />)).not.toThrow();
  });
});

// ── Labs Upload ───────────────────────────────────────────────────────────────
import LabsUploadScreen from '../../app/labs/upload';

describe('Labs Upload screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<LabsUploadScreen />)).not.toThrow();
  });
});
