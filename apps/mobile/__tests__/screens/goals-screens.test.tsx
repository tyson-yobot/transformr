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
  useLocalSearchParams: () => ({ id: 'goal-1' }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
    setOptions: jest.fn(),
    getParent: jest.fn(() => ({ setOptions: jest.fn() })),
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
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
jest.mock('@components/ui/ProgressRing', () => ({ ProgressRing: () => null }));
jest.mock('@components/ui/GatePromptCard', () => ({ GatePromptCard: () => null }));
jest.mock('@components/ui/PurpleRadialBackground', () => ({
  PurpleRadialBackground: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@components/ui/ScreenSkeleton', () => ({
  ListSkeleton: () => null, DashboardSkeleton: () => null, DetailSkeleton: () => null,
}));
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@components/ui/HelpIcon', () => ({ HelpIcon: () => null }));
jest.mock('@components/ui/MonoText', () => ({
  MonoText: ({ children }: { children: React.ReactNode }) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));
jest.mock('@components/ui/Modal', () => ({
  Modal: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
    visible ? children : null,
}));
jest.mock('@components/ui/ScreenHelpButton', () => ({ ScreenHelpButton: () => null }));
jest.mock('@components/ui/ActionToast', () => ({
  ActionToast: () => null,
  useActionToast: jest.fn(() => ({
    toast: { message: '', subtext: '', visible: false },
    show: jest.fn(),
    hide: jest.fn(),
  })),
}));
jest.mock('@components/ui/VoiceMicButton', () => ({ VoiceMicButton: () => null }));
jest.mock('@components/ui/AnimatedNumber', () => ({
  AnimatedNumber: ({ value }: { value: number }) => {
    const { Text } = require('react-native');
    return <Text>{value}</Text>;
  },
}));
jest.mock('@components/ui/Coachmark', () => ({ Coachmark: () => null }));
jest.mock('@components/ui/AmbientBackground', () => ({ AmbientBackground: () => null }));
jest.mock('@components/ui/NoiseOverlay', () => ({ NoiseOverlay: () => null }));
jest.mock('@components/charts/WeightChart', () => ({ WeightChart: () => null }));
jest.mock('@components/charts/SkiaSparkline', () => ({ SkiaSparkline: () => null }));
jest.mock('@components/charts/RevenueChart', () => ({ RevenueChart: () => null }));
jest.mock('@components/charts/MoodChart', () => ({ MoodChart: () => null }));
jest.mock('@components/charts/SleepChart', () => ({ SleepChart: () => null }));
jest.mock('@components/charts/StreakCalendar', () => ({ StreakCalendar: () => null }));
jest.mock('@components/cards/AIInsightCard', () => ({ AIInsightCard: () => null }));
jest.mock('@components/cards/CountdownCard', () => ({ CountdownCard: () => null }));
jest.mock('@components/challenges/ActiveChallengeCard', () => ({ ActiveChallengeCard: () => null }));
jest.mock('@components/challenges/FastingTimer', () => ({ FastingTimer: () => null }));
jest.mock('@components/community/CommunityLeaderboard', () => ({ CommunityLeaderboard: () => null }));
jest.mock('@components/social/ShareButton', () => ({ ShareButton: () => null }));
jest.mock('../../constants/screenHelp', () => ({ SCREEN_HELP: {} }));
jest.mock('../../constants/helpContent', () => ({ HELP: {} }));
jest.mock('../../constants/coachmarkSteps', () => ({
  COACHMARK_KEYS: {},
  COACHMARK_CONTENT: { business: [], goals: [], dashboard: [], habits: [] },
}));

// Services
jest.mock('@services/supabase', () => {
  const chain: Record<string, unknown> = {};
  const resolved = Promise.resolve({ data: [], error: null });
  ['eq', 'neq', 'in', 'contains', 'is', 'limit', 'range', 'single', 'maybeSingle', 'insert', 'update', 'delete'].forEach(
    (m) => { chain[m] = jest.fn(() => chain); }
  );
  chain['order'] = jest.fn(() => chain);
  ['gte', 'lte', 'gt', 'lt', 'not', 'ilike', 'like'].forEach(
    (m) => { chain[m] = jest.fn(() => chain); }
  );
  chain['then'] = (resolve: (v: { data: unknown[]; error: null }) => void) =>
    resolved.then(resolve);
  return {
    supabase: {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: jest.fn(() => ({ select: jest.fn(() => chain), insert: jest.fn(() => chain), upsert: jest.fn(() => chain), delete: jest.fn(() => chain) })),
    },
  };
});
jest.mock('@services/ai/challengeCoach', () => ({
  getChallengeCoaching: jest.fn().mockResolvedValue({ message: '' }),
  generateFailureReflection: jest.fn().mockResolvedValue({ message: '' }),
  generateCompletionMessage: jest.fn().mockResolvedValue({ message: '' }),
}));
jest.mock('@services/ai/compliance', () => ({
  getFullComplianceStatus: jest.fn().mockResolvedValue({ tasks: [] }),
  COMPLIANCE_SYSTEM_PREAMBLE: '',
}));
jest.mock('@services/ai/healthRoi', () => ({
  computeHealthROIReport: jest.fn().mockResolvedValue({ report: [] }),
}));
jest.mock('@services/ai/journaling', () => ({
  getJournalResponse: jest.fn().mockResolvedValue({ response: '' }),
}));
jest.mock('@services/ai/groceryList', () => ({
  generateBudgetGroceryList: jest.fn().mockResolvedValue({ items: [] }),
  mealsToGroceryInput: jest.fn(() => []),
}));
jest.mock('@services/ai/mealPrep', () => ({
  generateBudgetMealPrepPlan: jest.fn().mockResolvedValue({ meals: [] }),
  getWeeklyGroceryBudget: jest.fn().mockResolvedValue(100),
  updateWeeklyGroceryBudget: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@services/stripe', () => ({
  createStakePayment: jest.fn().mockResolvedValue({ clientSecret: '' }),
}));
jest.mock('@services/calculations/challengeVerification', () => ({
  verifyDailyTasks: jest.fn().mockResolvedValue({ verified: false }),
}));
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));
jest.mock('react-native-svg', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
  Svg: ({ children }: { children: React.ReactNode }) => children,
  Circle: () => null, Path: () => null, G: ({ children }: { children: React.ReactNode }) => children,
  Defs: ({ children }: { children: React.ReactNode }) => children,
  LinearGradient: () => null, RadialGradient: () => null,
  Stop: () => null, Ellipse: () => null, Rect: () => null, Text: () => null, Polyline: () => null,
}));
jest.mock('@components/charts/Sparkline', () => ({ Sparkline: () => null }));
jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: jest.fn(() => ({ onUpdate: jest.fn().mockReturnThis(), onEnd: jest.fn().mockReturnThis() })),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  PanGestureHandler: ({ children }: { children: React.ReactNode }) => children,
  State: {},
}));
jest.mock('@components/ui/Slider', () => ({ Slider: () => null }));
jest.mock('expo-camera', () => ({
  CameraView: ({ children }: { children: React.ReactNode }) => children,
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));
jest.mock('@components/challenges/PlankTimer', () => ({ PlankTimer: () => null }));
jest.mock('@components/challenges/ProgressPhotoGuide', () => ({ ProgressPhotoGuide: () => null }));
jest.mock('@services/voice', () => ({
  startVoiceRecognition: jest.fn().mockResolvedValue(undefined),
  stopVoiceRecognition: jest.fn().mockResolvedValue(undefined),
}));

// Hooks
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: true,
    requiredTier: 'free',
    showUpgradeModal: jest.fn(),
    upgradeMessage: '',
  })),
}));
jest.mock('@hooks/useCountdown', () => ({
  useCountdown: jest.fn(() => ({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false })),
}));
jest.mock('@hooks/useScreenEntrance', () => ({
  useScreenEntrance: jest.fn(() => ({ getEntranceStyle: jest.fn(() => ({})) })),
}));
jest.mock('@hooks/useGamificationStyle', () => ({
  useGamificationStyle: jest.fn(() => ({ containerStyle: {}, textStyle: {} })),
}));

// Utils
jest.mock('@utils/haptics', () => ({
  hapticLight: jest.fn(), hapticMedium: jest.fn(), hapticSuccess: jest.fn(),
  hapticWarning: jest.fn(), hapticStreakMilestone: jest.fn(),
}));
jest.mock('@utils/formatters', () => ({
  formatNumber: (n: number) => String(n),
  formatDate: (d: string) => d,
  formatRelativeTime: () => '2h ago',
  formatWeight: (n: number) => `${n} kg`,
  formatCurrency: (n: number) => `$${n}`,
  formatPercentage: (n: number) => `${n}%`,
  formatCountdown: () => '30 days',
  formatDuration: (s: number) => `${s}s`,
  formatMacro: (n: number) => `${n}g`,
  isoToDateInput: (s: string) => s,
  formatTimerDisplay: (s: number) => `${s}s`,
  formatCalories: (n: number) => `${n} kcal`,
}));
jest.mock('@utils/storage', () => ({
  getStorageBool: jest.fn().mockReturnValue(false),
  setStorageBool: jest.fn(),
}));

// Stores
const mockGoalState = {
  goals: [],
  activeGoals: [],
  milestones: [],
  isLoading: false,
  fetchGoals: jest.fn().mockResolvedValue(undefined),
  createGoal: jest.fn().mockResolvedValue(undefined),
  updateGoal: jest.fn().mockResolvedValue(undefined),
  deleteGoal: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/goalStore', () => ({
  useGoalStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockGoalState) : mockGoalState
  ),
}));

const mockBusinessState = {
  businesses: [],
  monthlyRevenue: 0,
  revenueData: [],
  customers: [],
  milestones: [],
  isLoading: false,
  fetchBusinesses: jest.fn().mockResolvedValue(undefined),
  fetchCustomers: jest.fn().mockResolvedValue(undefined),
  fetchRevenue: jest.fn().mockResolvedValue(undefined),
  getMonthlyMetrics: jest.fn(() => []),
};
jest.mock('@stores/businessStore', () => ({
  useBusinessStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockBusinessState) : mockBusinessState
  ),
}));

const mockChallengeState = {
  challenges: [],
  challengeDefinitions: [],
  activeChallenges: [],
  enrollments: [],
  activeEnrollment: null,
  todayLog: null,
  dailyLogs: [],
  isLoading: false,
  enrollInChallenge: jest.fn().mockResolvedValue(undefined),
  logChallengeActivity: jest.fn().mockResolvedValue(undefined),
  fetchChallenges: jest.fn().mockResolvedValue(undefined),
  fetchChallengeDefinitions: jest.fn().mockResolvedValue(undefined),
  fetchEnrollments: jest.fn().mockResolvedValue(undefined),
  fetchActiveEnrollment: jest.fn().mockResolvedValue(undefined),
  getTodayProgress: jest.fn(() => ({ completed: 0, total: 0, tasks: [] })),
};
jest.mock('@stores/challengeStore', () => ({
  useChallengeStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockChallengeState) : mockChallengeState
  ),
}));

const mockFinanceState = {
  accounts: [],
  transactions: [],
  budgets: [],
  netWorth: 0,
  netWorthHistory: [],
  isLoading: false,
  error: null,
  fetchAccounts: jest.fn().mockResolvedValue(undefined),
  fetchBudgets: jest.fn().mockResolvedValue(undefined),
  fetchTransactions: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/financeStore', () => ({
  useFinanceStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockFinanceState) : mockFinanceState
  ),
}));

const mockInsightState = {
  insights: [],
  predictions: [],
  proactiveMessages: [],
  isLoading: false,
  fetchAll: jest.fn().mockResolvedValue(undefined),
  dismissMessage: jest.fn(),
  acknowledgePrediction: jest.fn(),
};
jest.mock('@stores/insightStore', () => ({
  useInsightStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockInsightState) : mockInsightState
  ),
}));

const mockHabitState = {
  habits: [],
  todayCompletions: [],
  allCompletions: [],
  overallStreak: 0,
  isLoading: false,
  fetchHabits: jest.fn().mockResolvedValue(undefined),
  logCompletion: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/habitStore', () => ({
  useHabitStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockHabitState) : mockHabitState
  ),
}));

const mockMoodState = {
  todayMood: null,
  moodHistory: [],
  isLoading: false,
  error: null,
  logMood: jest.fn().mockResolvedValue(undefined),
  fetchMoodHistory: jest.fn().mockResolvedValue(undefined),
  clearError: jest.fn(),
};
jest.mock('@stores/moodStore', () => ({
  useMoodStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockMoodState) : mockMoodState
  ),
}));

const mockSleepState = {
  lastSleep: null,
  sleepHistory: [],
  isLoading: false,
  error: null,
  logSleep: jest.fn().mockResolvedValue(undefined),
  fetchSleepHistory: jest.fn().mockResolvedValue(undefined),
  clearError: jest.fn(),
};
jest.mock('@stores/sleepStore', () => ({
  useSleepStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockSleepState) : mockSleepState
  ),
}));

const mockProfileState = {
  profile: {
    id: 'u1', name: 'Test', display_name: 'Test User',
    daily_calorie_target: 2000, daily_protein_target: 150,
  },
  isLoading: false,
  fetchProfile: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockProfileState) : mockProfileState
  ),
}));

const mockNutritionState = {
  todayCalories: 0, todayProtein: 0, isLoading: false,
  logs: [], todayLogs: [], waterLogs: [], fetchTodayNutrition: jest.fn(),
};
jest.mock('@stores/nutritionStore', () => ({
  useNutritionStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockNutritionState) : mockNutritionState
  ),
}));

const mockWorkoutState = {
  sessions: [], templates: [], activeSession: null, lastSession: null,
  isLoading: false, fetchSessions: jest.fn(), fetchTemplates: jest.fn(),
};
jest.mock('@stores/workoutStore', () => ({
  useWorkoutStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockWorkoutState) : mockWorkoutState
  ),
}));

const mockGamificationState = {
  tone: 'default', level: 1, xp: 0, streak: 0,
  setTone: jest.fn(), addXP: jest.fn(),
};
jest.mock('@stores/gamificationStore', () => ({
  useGamificationStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockGamificationState) : mockGamificationState
  ),
}));

// ── Goal [id] ─────────────────────────────────────────────────────────────────
import GoalDetailScreen from '../../app/(tabs)/goals/[id]';

describe('Goals [id] screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<GoalDetailScreen />)).not.toThrow();
  });
});

// ── Affirmations ──────────────────────────────────────────────────────────────
import AffirmationsScreen from '../../app/(tabs)/goals/affirmations';

describe('Goals Affirmations screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<AffirmationsScreen />)).not.toThrow();
  });
});

// ── Business Index ────────────────────────────────────────────────────────────
import BusinessIndexScreen from '../../app/(tabs)/goals/business/index';

describe('Goals Business Index screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<BusinessIndexScreen />)).not.toThrow();
  });
});

// ── Business Customers ────────────────────────────────────────────────────────
import BusinessCustomersScreen from '../../app/(tabs)/goals/business/customers';

describe('Goals Business Customers screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<BusinessCustomersScreen />)).not.toThrow();
  });
});

// ── Business Milestones ───────────────────────────────────────────────────────
import BusinessMilestonesScreen from '../../app/(tabs)/goals/business/milestones';

describe('Goals Business Milestones screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<BusinessMilestonesScreen />)).not.toThrow();
  });
});

// ── Business Revenue ──────────────────────────────────────────────────────────
import BusinessRevenueScreen from '../../app/(tabs)/goals/business/revenue';

describe('Goals Business Revenue screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<BusinessRevenueScreen />)).not.toThrow();
  });
});

// ── Challenge Active ──────────────────────────────────────────────────────────
import ChallengeActiveScreen from '../../app/(tabs)/goals/challenge-active';

describe('Goals Challenge Active screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ChallengeActiveScreen />)).not.toThrow();
  });
});

// ── Challenge Builder ─────────────────────────────────────────────────────────
import ChallengeBuilderScreen from '../../app/(tabs)/goals/challenge-builder';

describe('Goals Challenge Builder screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ChallengeBuilderScreen />)).not.toThrow();
  });
});

// ── Challenge Detail ──────────────────────────────────────────────────────────
import ChallengeDetailScreen from '../../app/(tabs)/goals/challenge-detail';

describe('Goals Challenge Detail screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ChallengeDetailScreen />)).not.toThrow();
  });
});

// ── Challenges ────────────────────────────────────────────────────────────────
import ChallengesScreen from '../../app/(tabs)/goals/challenges';

describe('Goals Challenges screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ChallengesScreen />)).not.toThrow();
  });
});

// ── Community ─────────────────────────────────────────────────────────────────
import CommunityScreen from '../../app/(tabs)/goals/community';

describe('Goals Community screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<CommunityScreen />)).not.toThrow();
  });
});

// ── Finance Index ─────────────────────────────────────────────────────────────
import FinanceIndexScreen from '../../app/(tabs)/goals/finance/index';

describe('Goals Finance Index screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<FinanceIndexScreen />)).not.toThrow();
  });
});

// ── Finance Budgets ───────────────────────────────────────────────────────────
import FinanceBudgetsScreen from '../../app/(tabs)/goals/finance/budgets';

describe('Goals Finance Budgets screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<FinanceBudgetsScreen />)).not.toThrow();
  });
});

// ── Finance Net Worth ─────────────────────────────────────────────────────────
import FinanceNetWorthScreen from '../../app/(tabs)/goals/finance/net-worth';

describe('Goals Finance Net Worth screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<FinanceNetWorthScreen />)).not.toThrow();
  });
});

// ── Finance Transactions ──────────────────────────────────────────────────────
import FinanceTransactionsScreen from '../../app/(tabs)/goals/finance/transactions';

describe('Goals Finance Transactions screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<FinanceTransactionsScreen />)).not.toThrow();
  });
});

// ── Focus Mode ────────────────────────────────────────────────────────────────
import FocusModeScreen from '../../app/(tabs)/goals/focus-mode';

describe('Goals Focus Mode screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<FocusModeScreen />)).not.toThrow();
  });
});

// ── Habits ────────────────────────────────────────────────────────────────────
import HabitsScreen from '../../app/(tabs)/goals/habits';

describe('Goals Habits screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<HabitsScreen />)).not.toThrow();
  });
});

// ── Health ROI ────────────────────────────────────────────────────────────────
import HealthRoiScreen from '../../app/(tabs)/goals/health-roi';

describe('Goals Health ROI screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<HealthRoiScreen />)).not.toThrow();
  });
});

// ── Insights ──────────────────────────────────────────────────────────────────
import InsightsScreen from '../../app/(tabs)/goals/insights';

describe('Goals Insights screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<InsightsScreen />)).not.toThrow();
  });
});

// ── Journal ───────────────────────────────────────────────────────────────────
import JournalScreen from '../../app/(tabs)/goals/journal';

describe('Goals Journal screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<JournalScreen />)).not.toThrow();
  });
});

// ── Mood ──────────────────────────────────────────────────────────────────────
import MoodScreen from '../../app/(tabs)/goals/mood';

describe('Goals Mood screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<MoodScreen />)).not.toThrow();
  });
});

// ── Retrospective ─────────────────────────────────────────────────────────────
import RetrospectiveScreen from '../../app/(tabs)/goals/retrospective';

describe('Goals Retrospective screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<RetrospectiveScreen />)).not.toThrow();
  });
});

// ── Skills ────────────────────────────────────────────────────────────────────
import SkillsScreen from '../../app/(tabs)/goals/skills';

describe('Goals Skills screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<SkillsScreen />)).not.toThrow();
  });
});

// ── Sleep ─────────────────────────────────────────────────────────────────────
import SleepScreen from '../../app/(tabs)/goals/sleep';

describe('Goals Sleep screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<SleepScreen />)).not.toThrow();
  });
});

// ── Stake Goals ───────────────────────────────────────────────────────────────
import StakeGoalsScreen from '../../app/(tabs)/goals/stake-goals';

describe('Goals Stake Goals screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<StakeGoalsScreen />)).not.toThrow();
  });
});

// ── Vision Board ──────────────────────────────────────────────────────────────
import VisionBoardScreen from '../../app/(tabs)/goals/vision-board';

describe('Goals Vision Board screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<VisionBoardScreen />)).not.toThrow();
  });
});
