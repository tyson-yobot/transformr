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
jest.mock('expo-camera', () => ({
  CameraView: ({ children }: { children: React.ReactNode }) => children,
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('date-fns', () => ({
  differenceInDays: jest.fn(() => 10),
  format: jest.fn((d: Date) => d.toString()),
  parseISO: jest.fn((s: string) => new Date(s)),
  isToday: jest.fn(() => true),
  startOfWeek: jest.fn((d: Date) => d),
  addDays: jest.fn((d: Date) => d),
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
  ListSkeleton: () => null,
  DashboardSkeleton: () => null,
  DetailSkeleton: () => null,
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
jest.mock('@components/ui/Disclaimer', () => ({ Disclaimer: () => null }));
jest.mock('@components/cards/AIInsightCard', () => ({ AIInsightCard: () => null }));
jest.mock('@components/nutrition/SupplementDaysRemaining', () => ({ SupplementDaysRemaining: () => null }));
jest.mock('@components/nutrition/SupplementChecklist', () => ({ SupplementChecklist: () => null }));
jest.mock('@components/nutrition/FoodSearchBar', () => ({ FoodSearchBar: () => null }));
jest.mock('@components/nutrition/MealCard', () => ({ MealCard: () => null }));
jest.mock('@components/nutrition/MacroSummary', () => ({ MacroSummary: () => null }));
jest.mock('@components/charts/SkiaSparkline', () => ({ SkiaSparkline: () => null }));
jest.mock('../../constants/screenHelp', () => ({ SCREEN_HELP: {} }));

// Services
jest.mock('@services/supabase', () => {
  const chain: Record<string, unknown> = {};
  const resolved = Promise.resolve({ data: [], error: null });
  ['eq', 'neq', 'in', 'contains', 'is', 'limit', 'range', 'single', 'maybeSingle', 'insert', 'update', 'delete'].forEach(
    (m) => { chain[m] = jest.fn(() => chain); }
  );
  chain['order'] = jest.fn(() => chain);
  chain['then'] = (resolve: (v: { data: unknown[]; error: null }) => void) =>
    resolved.then(resolve);
  return {
    supabase: {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: jest.fn(() => ({ select: jest.fn(() => chain), insert: jest.fn(() => chain), upsert: jest.fn(() => chain), delete: jest.fn(() => chain) })),
    },
  };
});
jest.mock('@services/ai/compliance', () => ({
  checkFoodBeforeLogging: jest.fn().mockResolvedValue({ allowed: true, message: '', warnings: [] }),
  checkMealCompliance: jest.fn().mockResolvedValue({ compliant: true }),
  COMPLIANCE_SYSTEM_PREAMBLE: '',
}));
jest.mock('@services/ai/groceryList', () => ({
  generateBudgetGroceryList: jest.fn().mockResolvedValue({ items: [], totalCost: 0 }),
  mealsToGroceryInput: jest.fn(() => []),
}));
jest.mock('@services/ai/mealPrep', () => ({
  generateBudgetMealPrepPlan: jest.fn().mockResolvedValue({ meals: [], totalCost: 0 }),
  getWeeklyGroceryBudget: jest.fn().mockResolvedValue(100),
  updateWeeklyGroceryBudget: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@services/ai/mealCamera', () => ({
  analyzeMealPhoto: jest.fn().mockResolvedValue({ foods: [], totalCalories: 0 }),
  analyzeMenuPhoto: jest.fn().mockResolvedValue({ items: [], recommendations: [] }),
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

// Utils
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn(), hapticMedium: jest.fn(), hapticSuccess: jest.fn() }));
jest.mock('@utils/formatters', () => ({
  formatNumber: (n: number) => String(n),
  formatDate: (d: string) => d,
  formatRelativeTime: () => '2h ago',
  formatWeight: (n: number) => `${n} kg`,
  formatCurrency: (n: number) => `$${n}`,
  formatPercentage: (n: number) => `${n}%`,
  formatMacro: (n: number) => `${n}g`,
  formatCalories: (n: number) => `${n} kcal`,
}));

// Stores
const mockNutritionState = {
  todayCalories: 0,
  todayProtein: 0,
  isLoading: false,
  logs: [],
  todayLogs: [],
  waterLogs: [],
  supplements: [],
  supplementLogs: [],
  savedMeals: [],
  searchResults: [],
  foodNameMap: {},
  fetchTodayNutrition: jest.fn(),
  logFood: jest.fn().mockResolvedValue(undefined),
  logWater: jest.fn().mockResolvedValue(undefined),
  deleteLog: jest.fn().mockResolvedValue(undefined),
  fetchSavedMeals: jest.fn().mockResolvedValue(undefined),
  searchFoods: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/nutritionStore', () => ({
  useNutritionStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockNutritionState) : mockNutritionState
  ),
}));

const mockProfileState = {
  profile: {
    id: 'u1',
    name: 'Test',
    display_name: 'Test User',
    daily_calorie_target: 2000,
    daily_protein_target: 150,
    daily_carb_target: 200,
    daily_fat_target: 65,
    weight_kg: 75,
  },
  isLoading: false,
  fetchProfile: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockProfileState) : mockProfileState
  ),
}));

const mockChallengeState = {
  challenges: [],
  activeChallenges: [],
  challengeDefinitions: [],
  activeEnrollment: null,
  todayLog: null,
  isLoading: false,
  logChallengeActivity: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/challengeStore', () => ({
  useChallengeStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockChallengeState) : mockChallengeState
  ),
}));

const mockSupplementsState = {
  supplements: [],
  todayLogs: [],
  budget: 0,
  recommendations: [],
  interactionWarnings: [],
  aiRecommendations: [],
  budgetFit: true,
  budgetNotes: '',
  isLoadingSupplements: false,
  isLoadingRecommendations: false,
  fetchAll: jest.fn().mockResolvedValue(undefined),
  fetchRecommendations: jest.fn().mockResolvedValue(undefined),
  logTaken: jest.fn().mockResolvedValue(undefined),
  addSupplement: jest.fn().mockResolvedValue(undefined),
  updateSupplement: jest.fn().mockResolvedValue(undefined),
  deleteSupplement: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/supplementsStore', () => ({
  useSupplementsStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockSupplementsState) : mockSupplementsState
  ),
}));

// ── Add Food ──────────────────────────────────────────────────────────────────
import AddFoodScreen from '../../app/(tabs)/nutrition/add-food';

describe('Nutrition Add Food screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<AddFoodScreen />)).not.toThrow();
  });
});

// ── Analytics ─────────────────────────────────────────────────────────────────
import AnalyticsScreen from '../../app/(tabs)/nutrition/analytics';

describe('Nutrition Analytics screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<AnalyticsScreen />)).not.toThrow();
  });
});

// ── Barcode Scanner ───────────────────────────────────────────────────────────
import BarcodeScannerScreen from '../../app/(tabs)/nutrition/barcode-scanner';

describe('Nutrition Barcode Scanner screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<BarcodeScannerScreen />)).not.toThrow();
  });
});

// ── Grocery List ──────────────────────────────────────────────────────────────
import GroceryListScreen from '../../app/(tabs)/nutrition/grocery-list';

describe('Nutrition Grocery List screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<GroceryListScreen />)).not.toThrow();
  });
});

// ── Meal Camera ───────────────────────────────────────────────────────────────
import MealCameraScreen from '../../app/(tabs)/nutrition/meal-camera';

describe('Nutrition Meal Camera screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<MealCameraScreen />)).not.toThrow();
  });
});

// ── Meal Plans ────────────────────────────────────────────────────────────────
import MealPlansScreen from '../../app/(tabs)/nutrition/meal-plans';

describe('Nutrition Meal Plans screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<MealPlansScreen />)).not.toThrow();
  });
});

// ── Meal Prep ─────────────────────────────────────────────────────────────────
import MealPrepScreen from '../../app/(tabs)/nutrition/meal-prep';

describe('Nutrition Meal Prep screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<MealPrepScreen />)).not.toThrow();
  });
});

// ── Menu Scanner ──────────────────────────────────────────────────────────────
import MenuScannerScreen from '../../app/(tabs)/nutrition/menu-scanner';

describe('Nutrition Menu Scanner screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<MenuScannerScreen />)).not.toThrow();
  });
});

// ── Saved Meals ───────────────────────────────────────────────────────────────
import SavedMealsScreen from '../../app/(tabs)/nutrition/saved-meals';

describe('Nutrition Saved Meals screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<SavedMealsScreen />)).not.toThrow();
  });
});

// ── Supplements ───────────────────────────────────────────────────────────────
import SupplementsScreen from '../../app/(tabs)/nutrition/supplements';

describe('Nutrition Supplements screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<SupplementsScreen />)).not.toThrow();
  });
});
