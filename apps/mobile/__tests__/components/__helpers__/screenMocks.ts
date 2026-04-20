/**
 * Common mock setup for screen-level smoke tests.
 * Import via jest.mock() factories in each screen test file.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Re-export component mocks for screen tests to use
export { mockReactNative, mockReanimated, mockTheme } from './rnMocks';

// ─── Expo / Router ───────────────────────────────────────────────────────────

export function mockExpoRouter() {
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      navigate: jest.fn(),
      dismissAll: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    usePathname: () => '/test',
    useSegments: () => [],
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    Stack: { Screen: () => null },
    Tabs: { Screen: () => null },
    Link: ({ children }: any) => children,
    Redirect: () => null,
    useFocusEffect: (cb: () => (() => void) | void) => {
      const cleanup = cb();
      return () => cleanup?.();
    },
  };
}

// ─── Safe Area ───────────────────────────────────────────────────────────────

export function mockSafeAreaContext() {
  return {
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
  };
}

// ─── Expo Status Bar ─────────────────────────────────────────────────────────

export function mockExpoStatusBar() {
  return { StatusBar: () => null };
}

// ─── @react-navigation/native ─────────────────────────────────────────────────

export function mockReactNavigation() {
  return {
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: (cb: () => (() => void) | void) => { cb(); },
  };
}

// ─── Vector Icons ────────────────────────────────────────────────────────────

export function mockVectorIcons() {
  return {
    Ionicons: ({ name }: { name: string }) => {
      const React = jest.requireActual<typeof import('react')>('react');
      const { Text } = jest.requireMock<{ Text: any }>('react-native');
      return React.createElement(Text, { testID: `icon-${name}` }, name);
    },
  };
}

// ─── Expo Haptics ────────────────────────────────────────────────────────────

export function mockExpoHaptics() {
  return {
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
  };
}

// ─── Common stores ───────────────────────────────────────────────────────────

export const mockAuthState = {
  user: { id: 'user-1', email: 'test@example.com' },
  session: { access_token: 'tok', expires_at: 9999999999 },
  isLoading: false,
  signOut: jest.fn(),
};
export function mockAuthStore() {
  return {
    useAuthStore: jest.fn((selector?: any) =>
      selector ? selector(mockAuthState) : mockAuthState,
    ),
  };
}

export const mockProfileState = {
  profile: {
    id: 'user-1',
    name: 'Test User',
    avatar_url: null,
    daily_calorie_target: 2000,
    daily_protein_target: 150,
    daily_carb_target: 200,
    daily_fat_target: 65,
    age: 30,
    height_cm: 175,
    weight_kg: 75,
    sex: 'male',
    activity_level: 'moderately_active',
    fitness_goal: 'muscle_gain',
  },
  isLoading: false,
};
export function mockProfileStore() {
  return {
    useProfileStore: jest.fn((selector?: any) =>
      selector ? selector(mockProfileState) : mockProfileState,
    ),
  };
}

export const mockSubscriptionState = { tier: 'free' };
export function mockSubscriptionStore() {
  return {
    useSubscriptionStore: jest.fn((selector?: any) =>
      selector ? selector(mockSubscriptionState) : mockSubscriptionState,
    ),
  };
}

export function mockSettingsStore() {
  return {
    useSettingsStore: jest.fn((selector?: any) => {
      const state = { notifications_enabled: true, units: 'metric', theme_mode: 'dark' };
      return selector ? selector(state) : state;
    }),
  };
}

// ─── Common hooks ────────────────────────────────────────────────────────────

export function mockFeatureGate() {
  return {
    useFeatureGate: jest.fn(() => ({
      isAvailable: true,
      requiredTier: 'free',
      showUpgradeModal: jest.fn(),
      checkAndPrompt: jest.fn(),
      upgradeMessage: '',
    })),
    upgradeModalEvents: { emit: jest.fn(), setListener: jest.fn() },
  };
}

// ─── Async Storage ───────────────────────────────────────────────────────────

export function mockAsyncStorage() {
  return {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    multiGet: jest.fn().mockResolvedValue([]),
    multiSet: jest.fn().mockResolvedValue(undefined),
  };
}

// ─── Supabase ────────────────────────────────────────────────────────────────

export function mockSupabase() {
  const makeChain = (result = { data: [], error: null }) => {
    const chain: any = {};
    const methods = ['select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'order', 'limit',
      'single', 'maybeSingle', 'insert', 'update', 'upsert', 'delete', 'filter',
      'in', 'is', 'not', 'range', 'match'];
    methods.forEach((m) => { chain[m] = jest.fn(() => chain); });
    chain.then = (resolve: any) => Promise.resolve(resolve(result));
    return chain;
  };
  return {
    supabase: {
      from: jest.fn(() => makeChain()),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      },
      storage: { from: jest.fn(() => ({ upload: jest.fn(), getPublicUrl: jest.fn(() => ({ data: { publicUrl: '' } })) })) },
      functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
    },
  };
}

// ─── Utils ───────────────────────────────────────────────────────────────────

export function mockHaptics() {
  return { hapticLight: jest.fn(), hapticMedium: jest.fn(), hapticWarning: jest.fn() };
}

export function mockStorage() {
  return { getStorageBool: jest.fn().mockReturnValue(false), setStorageBool: jest.fn() };
}

export function mockAnalytics() {
  return { track: jest.fn() };
}
