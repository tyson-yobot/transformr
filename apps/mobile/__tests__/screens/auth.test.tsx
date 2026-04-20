import React from 'react';
import { render } from '@testing-library/react-native';

// React Native apps expect __DEV__ to be defined globally
(global as typeof globalThis & { __DEV__: boolean }).__DEV__ = true;

// Binary assets
jest.mock('../../assets/images/gym-hero.jpg', () => 1);
jest.mock('../../assets/images/icon.png', () => 1);

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-web-browser', () => ({
  warmUpAsync: jest.fn().mockResolvedValue(undefined),
  coolDownAsync: jest.fn().mockResolvedValue(undefined),
  maybeCompleteAuthSession: jest.fn(),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@components/ui/Input', () => ({
  Input: ({ label }: { label: string }) => {
    const { Text } = require('react-native');
    return <Text>{label}</Text>;
  },
}));
jest.mock('@components/ui/Button', () => ({
  Button: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn(), hapticMedium: jest.fn() }));
jest.mock('@utils/validators', () => ({
  isValidEmail: jest.fn(() => true),
  isValidPassword: jest.fn(() => ({ valid: true, errors: [] })),
  isNotEmpty: jest.fn(() => true),
}));

const mockAuthState = {
  session: null,
  loading: false,
  error: null as string | null,
  signIn: jest.fn().mockResolvedValue(undefined),
  signUp: jest.fn().mockResolvedValue(undefined),
  signInWithGoogle: jest.fn().mockResolvedValue(undefined),
  signInWithApple: jest.fn().mockResolvedValue(undefined),
  resetPassword: jest.fn().mockResolvedValue(undefined),
  clearError: jest.fn(),
};

jest.mock('@stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState
  ),
}));

// supabase needed by callback screen
jest.mock('@services/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

// ── Login ─────────────────────────────────────────────────────────────────────
import LoginScreen from '../../app/(auth)/login';

describe('Login screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<LoginScreen />)).not.toThrow();
  });
});

// ── Register ──────────────────────────────────────────────────────────────────
import RegisterScreen from '../../app/(auth)/register';

describe('Register screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<RegisterScreen />)).not.toThrow();
  });
});

// ── Forgot Password ───────────────────────────────────────────────────────────
import ForgotPasswordScreen from '../../app/(auth)/forgot-password';

describe('ForgotPassword screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ForgotPasswordScreen />)).not.toThrow();
  });
});

// ── OAuth Callback ────────────────────────────────────────────────────────────
import OAuthCallbackScreen from '../../app/(auth)/callback';

describe('OAuthCallback screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<OAuthCallbackScreen />)).not.toThrow();
  });
});
