import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
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
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { supabaseUrl: '', supabaseAnonKey: '' } } },
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/Badge', () => ({ Badge: () => null }));
jest.mock('@components/ui/MonoText', () => ({ MonoText: ({ children }: { children: React.ReactNode }) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
}}));
jest.mock('@components/ui/AnimatedNumber', () => ({ AnimatedNumber: ({ value }: { value: number }) => {
  const { Text } = require('react-native');
  return <Text>{value}</Text>;
}}));
jest.mock('@components/ui/ScreenSkeleton', () => ({ DashboardSkeleton: () => null }));
jest.mock('@components/ui/QuickActionTile', () => ({ QuickActionTile: () => null }));
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@components/ui/HelpIcon', () => ({ HelpIcon: () => null }));
jest.mock('@components/ui/LogSuccessRipple', () => ({ LogSuccessRipple: () => null }));
jest.mock('@components/ui/Coachmark', () => ({ Coachmark: () => null }));
jest.mock('@components/ui/PurpleRadialBackground', () => ({ PurpleRadialBackground: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/AmbientBackground', () => ({ AmbientBackground: () => null }));
jest.mock('@components/ui/NoiseOverlay', () => ({ NoiseOverlay: () => null }));
jest.mock('@components/cards/AIInsightCard', () => ({ AIInsightCard: () => null }));
jest.mock('@components/cards/WeatherCard', () => ({ WeatherCard: () => null }));
jest.mock('@components/cards/PredictionAlert', () => ({ PredictionAlert: () => null }));
jest.mock('@components/cards/CountdownCard', () => ({ CountdownCard: () => null }));
jest.mock('@components/cards/QuickStatsRow', () => ({ QuickStatsRow: () => null }));
jest.mock('@components/charts/WeightChart', () => ({ WeightChart: () => null }));
jest.mock('@components/charts/SkiaSparkline', () => ({ SkiaSparkline: () => null }));
jest.mock('@components/challenges/ActiveChallengeCard', () => ({ ActiveChallengeCard: () => null }));
jest.mock('react-native-svg', () => ({
  Svg: ({ children }: { children: React.ReactNode }) => children,
  Circle: () => null,
  Path: () => null,
  G: ({ children }: { children: React.ReactNode }) => children,
  Defs: ({ children }: { children: React.ReactNode }) => children,
  LinearGradient: () => null,
  Stop: () => null,
}));
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = {
      profile: { id: 'u1', name: 'Test', display_name: 'Test User', daily_calorie_target: 2000, daily_protein_target: 150, daily_carb_target: 200, daily_fat_target: 65 },
      isLoading: false,
      fetchProfile: jest.fn().mockResolvedValue(undefined),
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/workoutStore', () => ({
  useWorkoutStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = { sessions: [], templates: [], lastSession: null, activeSession: null, isLoading: false, fetchSessions: jest.fn(), fetchTemplates: jest.fn() };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/nutritionStore', () => ({
  useNutritionStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = { todayCalories: 0, todayProtein: 0, isLoading: false, logs: [], todayLogs: [], waterLogs: [], fetchTodayNutrition: jest.fn() };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/habitStore', () => ({
  useHabitStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = { habits: [], todayCompletions: [], overallStreak: 0, isLoading: false, fetchHabits: jest.fn() };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/goalStore', () => ({
  useGoalStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = { goals: [], activeGoals: [], milestones: [], isLoading: false, fetchGoals: jest.fn() };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/partnerStore', () => ({
  usePartnerStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = { partner: null, partnerProfile: null, partnership: null, isLoading: false, fetchPartnership: jest.fn() };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/businessStore', () => ({
  useBusinessStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = { monthlyRevenue: 0, businesses: [], revenueData: [], isLoading: false, fetchBusinesses: jest.fn() };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/challengeStore', () => ({
  useChallengeStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = {
      challenges: [],
      challengeDefinitions: [],
      activeChallenges: [],
      activeEnrollment: null,
      todayLog: null,
      isLoading: false,
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@stores/insightStore', () => ({
  useInsightStore: jest.fn((selector?: (s: object) => unknown) => {
    const state = { insights: [], predictions: [], proactiveMessages: [], isLoading: false, fetchAll: jest.fn(), dismissMessage: jest.fn(), acknowledgePrediction: jest.fn() };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@hooks/useCountdown', () => ({
  useCountdown: jest.fn(() => ({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false })),
}));
jest.mock('@hooks/useScreenEntrance', () => ({
  useScreenEntrance: jest.fn(() => ({ getEntranceStyle: jest.fn(() => ({})) })),
}));
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: true,
    requiredTier: 'free',
    showUpgradeModal: jest.fn(),
    upgradeMessage: '',
  })),
}));
jest.mock('@utils/formatters', () => ({
  formatNumber: (n: number) => String(n),
  formatCurrency: (n: number) => `$${n}`,
  formatRelativeTime: () => '2h ago',
}));
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn() }));
jest.mock('@utils/greetings', () => ({ getTodayGreeting: () => ({ text: 'Good morning', emoji: '☀️' }) }));
jest.mock('@utils/storage', () => ({
  getStorageBool: jest.fn().mockReturnValue(false),
  setStorageBool: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../constants/screenHelp', () => ({ SCREEN_HELP: {} }));
jest.mock('../../constants/helpContent', () => ({ HELP: {} }));
jest.mock('../../constants/coachmarkSteps', () => ({ COACHMARK_KEYS: {}, COACHMARK_CONTENT: {} }));
jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: [], error: null })) })) })),
  },
}));

import DashboardScreen from '../../app/(tabs)/dashboard';

describe('Dashboard tab screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<DashboardScreen />)).not.toThrow();
  });
});
