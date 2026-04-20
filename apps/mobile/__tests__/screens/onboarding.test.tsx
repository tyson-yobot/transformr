import React from 'react';
import { render } from '@testing-library/react-native';

// React Native apps expect __DEV__ to be defined globally
(global as typeof globalThis & { __DEV__: boolean }).__DEV__ = true;

// Binary assets
jest.mock('../../assets/images/icon.png', () => 1);
jest.mock('../../assets/images/transformr-icon.png', () => 1);

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
}));
jest.mock('@components/ui/Button', () => ({
  Button: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('@components/ui/Input', () => ({
  Input: ({ label }: { label: string }) => {
    const { Text } = require('react-native');
    return <Text>{label}</Text>;
  },
}));
jest.mock('@components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@components/ui/OnboardingBackground', () => ({
  OnboardingBackground: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@components/ui/ProgressBar', () => ({ ProgressBar: () => null }));
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn(), hapticMedium: jest.fn() }));
jest.mock('@utils/formatters', () => ({
  formatNumber: (n: number) => String(n),
  formatDate: (d: string) => d,
  formatWeight: (n: number) => `${n} kg`,
}));

// Calculation services
jest.mock('@services/calculations/bmr', () => ({
  calculateBMR: jest.fn(() => 1800),
  calculateTDEE: jest.fn(() => 2200),
  calculateCalorieTarget: jest.fn(() => 2000),
  calculateAge: jest.fn(() => 30),
  getActivityLevelLabel: jest.fn(() => 'Moderately Active'),
}));
jest.mock('@services/calculations/macros', () => ({
  calculateMacroTargets: jest.fn(() => ({ protein: 150, carbs: 200, fat: 65 })),
  calculateMacroPercentages: jest.fn(() => ({ protein: 30, carbs: 40, fat: 30 })),
}));

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

const mockGoalState = {
  goals: [],
  activeGoals: [],
  milestones: [],
  isLoading: false,
  createGoal: jest.fn().mockResolvedValue(undefined),
  fetchGoals: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/goalStore', () => ({
  useGoalStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockGoalState) : mockGoalState
  ),
}));

const mockSettingsState = {
  fitnessLevel: 'beginner',
  equipment: [],
  updateSetting: jest.fn(),
  loadFromProfile: jest.fn(),
};
jest.mock('@stores/settingsStore', () => ({
  useSettingsStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockSettingsState) : mockSettingsState
  ),
}));

const mockBusinessState = {
  businesses: [],
  isLoading: false,
  createBusiness: jest.fn().mockResolvedValue(undefined),
  fetchBusinesses: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/businessStore', () => ({
  useBusinessStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockBusinessState) : mockBusinessState
  ),
}));

const mockPartnerState = {
  partner: null,
  partnership: null,
  isLoading: false,
  invitePartner: jest.fn().mockResolvedValue(undefined),
  fetchPartnership: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/partnerStore', () => ({
  usePartnerStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockPartnerState) : mockPartnerState
  ),
}));

// ── Welcome ───────────────────────────────────────────────────────────────────
import WelcomeScreen from '../../app/(auth)/onboarding/welcome';

describe('Onboarding Welcome screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<WelcomeScreen />)).not.toThrow();
  });
});

// ── Profile ───────────────────────────────────────────────────────────────────
import ProfileScreen from '../../app/(auth)/onboarding/profile';

describe('Onboarding Profile screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ProfileScreen />)).not.toThrow();
  });
});

// ── Goals ─────────────────────────────────────────────────────────────────────
import GoalsScreen from '../../app/(auth)/onboarding/goals';

describe('Onboarding Goals screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<GoalsScreen />)).not.toThrow();
  });
});

// ── Fitness ───────────────────────────────────────────────────────────────────
import FitnessScreen from '../../app/(auth)/onboarding/fitness';

describe('Onboarding Fitness screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<FitnessScreen />)).not.toThrow();
  });
});

// ── Nutrition ─────────────────────────────────────────────────────────────────
import NutritionScreen from '../../app/(auth)/onboarding/nutrition';

describe('Onboarding Nutrition screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<NutritionScreen />)).not.toThrow();
  });
});

// ── Notifications ─────────────────────────────────────────────────────────────
import NotificationsScreen from '../../app/(auth)/onboarding/notifications';

describe('Onboarding Notifications screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<NotificationsScreen />)).not.toThrow();
  });
});

// ── Business ──────────────────────────────────────────────────────────────────
import BusinessScreen from '../../app/(auth)/onboarding/business';

describe('Onboarding Business screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<BusinessScreen />)).not.toThrow();
  });
});

// ── Ready ─────────────────────────────────────────────────────────────────────
import ReadyScreen from '../../app/(auth)/onboarding/ready';

describe('Onboarding Ready screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ReadyScreen />)).not.toThrow();
  });
});

// ── Partner ───────────────────────────────────────────────────────────────────
import PartnerScreen from '../../app/(auth)/onboarding/partner';

describe('Onboarding Partner screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<PartnerScreen />)).not.toThrow();
  });
});
