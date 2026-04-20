import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => children,
  Rect: () => null,
  RoundedRect: () => null,
  BlurMask: () => null,
  RadialGradient: () => null,
  vec: jest.fn().mockReturnValue({ x: 0, y: 0 }),
  Fill: () => null,
  Path: () => null,
  LinearGradient: () => null,
  useFont: jest.fn().mockReturnValue(null),
}));
jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue(undefined),
  warmUpAsync: jest.fn().mockResolvedValue(undefined),
  coolDownAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn(), setOptions: jest.fn() }),
}));
jest.mock('@components/ui/ScreenHelpButton', () => ({ ScreenHelpButton: () => null }));
jest.mock('../../constants/screenHelp', () => ({ SCREEN_HELP: {} }));
jest.mock('expo-linking', () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
  openSettings: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@components/ui/Button', () => ({
  Button: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('@components/ui/Badge', () => ({ Badge: () => null }));
jest.mock('@components/ui/Avatar', () => ({ Avatar: () => null }));
jest.mock('@components/ui/Input', () => ({
  Input: ({ label }: { label: string }) => {
    const { Text } = require('react-native');
    return <Text>{label}</Text>;
  },
}));
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
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: true,
    requiredTier: 'free',
    showUpgradeModal: jest.fn(),
    upgradeMessage: '',
  })),
}));
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn(), hapticMedium: jest.fn() }));
jest.mock('@utils/formatters', () => ({
  formatNumber: (n: number) => String(n),
  formatDate: (d: string) => d,
  formatRelativeTime: () => '2h ago',
  formatWeight: (n: number) => `${n} kg`,
  formatPercentage: (n: number) => `${n}%`,
  formatCurrency: (n: number) => `$${n}`,
  isoToDateInput: (s: string) => s,
}));

// Services
jest.mock('@services/supabase', () => {
  const chain: Record<string, unknown> = {};
  const resolved = Promise.resolve({ data: [], error: null });
  ['eq', 'neq', 'in', 'contains', 'is', 'limit', 'range', 'single', 'maybeSingle'].forEach(
    (m) => { chain[m] = jest.fn(() => chain); }
  );
  chain['order'] = jest.fn(() => chain);
  chain['then'] = (resolve: (v: { data: unknown[]; error: null }) => void) =>
    resolved.then(resolve);
  return {
    supabase: {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: jest.fn(() => ({ select: jest.fn(() => chain) })),
    },
  };
});
jest.mock('@services/nfc', () => ({
  initNfc: jest.fn().mockResolvedValue(true),
  readNfcTag: jest.fn().mockResolvedValue(null),
  writeNfcTag: jest.fn().mockResolvedValue(true),
  fetchUserNfcTriggers: jest.fn().mockResolvedValue([]),
  executeNfcAction: jest.fn(),
  cleanupNfc: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@services/watch', () => ({
  isWatchReachable: jest.fn().mockResolvedValue(false),
  sendWorkoutDataToWatch: jest.fn(),
  sendMacroDataToWatch: jest.fn(),
  sendStreakToWatch: jest.fn(),
  sendReadinessToWatch: jest.fn(),
  listenForWatchMessages: jest.fn(() => jest.fn()),
  handleWatchMessage: jest.fn(),
}));

// Stores
const mockProfileState = {
  profile: { id: 'u1', name: 'Test', display_name: 'Test User', weight_kg: 75, height_cm: 175 },
  isLoading: false,
  updateProfile: jest.fn().mockResolvedValue(undefined),
  fetchProfile: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockProfileState) : mockProfileState
  ),
}));

const mockPartnerState = {
  partner: null,
  partnerProfile: null,
  partnership: null,
  isLoading: false,
  fetchPartnership: jest.fn().mockResolvedValue(undefined),
  invitePartner: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/partnerStore', () => ({
  usePartnerStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockPartnerState) : mockPartnerState
  ),
}));

const mockDashboardState = {
  widgets: [],
  layout: [],
  isLoading: false,
  updateLayout: jest.fn().mockResolvedValue(undefined),
  fetchDashboard: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/dashboardStore', () => ({
  useDashboardStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockDashboardState) : mockDashboardState
  ),
}));

// ── About ─────────────────────────────────────────────────────────────────────
import AboutScreen from '../../app/(tabs)/profile/about';

describe('Profile About screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<AboutScreen />)).not.toThrow();
  });
});

// ── Achievements ──────────────────────────────────────────────────────────────
import AchievementsScreen from '../../app/(tabs)/profile/achievements';

describe('Profile Achievements screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<AchievementsScreen />)).not.toThrow();
  });
});

// ── Dashboard Builder ─────────────────────────────────────────────────────────
import DashboardBuilderScreen from '../../app/(tabs)/profile/dashboard-builder';

describe('Profile Dashboard Builder screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<DashboardBuilderScreen />)).not.toThrow();
  });
});

// ── Data Export ───────────────────────────────────────────────────────────────
import DataExportScreen from '../../app/(tabs)/profile/data-export';

describe('Profile Data Export screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<DataExportScreen />)).not.toThrow();
  });
});

// ── Edit Profile ──────────────────────────────────────────────────────────────
import EditProfileScreen from '../../app/(tabs)/profile/edit-profile';

describe('Profile Edit Profile screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<EditProfileScreen />)).not.toThrow();
  });
});

// ── Integrations ──────────────────────────────────────────────────────────────
import IntegrationsScreen from '../../app/(tabs)/profile/integrations';

describe('Profile Integrations screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<IntegrationsScreen />)).not.toThrow();
  });
});

// ── NFC Setup ─────────────────────────────────────────────────────────────────
import NfcSetupScreen from '../../app/(tabs)/profile/nfc-setup';

describe('Profile NFC Setup screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<NfcSetupScreen />)).not.toThrow();
  });
});

// ── Notifications Settings ────────────────────────────────────────────────────
import NotificationsSettingsScreen from '../../app/(tabs)/profile/notifications-settings';

describe('Profile Notifications Settings screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<NotificationsSettingsScreen />)).not.toThrow();
  });
});

// ── Partner ───────────────────────────────────────────────────────────────────
import ProfilePartnerScreen from '../../app/(tabs)/profile/partner';

describe('Profile Partner screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ProfilePartnerScreen />)).not.toThrow();
  });
});

// ── Wearables ─────────────────────────────────────────────────────────────────
import WearablesScreen from '../../app/(tabs)/profile/wearables';

describe('Profile Wearables screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<WearablesScreen />)).not.toThrow();
  });
});
