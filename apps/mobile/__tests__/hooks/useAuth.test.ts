import { renderHook, act } from '@testing-library/react-native';

const mockUnsubscribe = jest.fn();
const mockGetSession = jest.fn().mockResolvedValue({ data: { session: null } });
const mockOnAuthStateChange = jest.fn().mockReturnValue({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
});

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockResetPassword = jest.fn();
const mockSetSession = jest.fn();

jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (s: unknown) => unknown) => {
    const mockState = {
      session: null,
      user: null,
      loading: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      resetPassword: mockResetPassword,
      setSession: mockSetSession,
    };
    return selector ? selector(mockState) : mockState;
  }),
}));

const mockRouterReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: mockRouterReplace })),
  useSegments: jest.fn(() => ['(tabs)', 'dashboard']),
}));

import { useAuth } from '../../hooks/useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('returns session, user, loading, signIn, signUp, signOut, resetPassword', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.resetPassword).toBe('function');
  });

  it('calls getSession on mount', async () => {
    const { unmount } = renderHook(() => useAuth());
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockGetSession).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('sets up onAuthStateChange listener on mount', () => {
    const { unmount } = renderHook(() => useAuth());
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('calls setSession when getSession resolves', async () => {
    const fakeSession = { access_token: 'tok', user: { id: 'u-1' } };
    mockGetSession.mockResolvedValueOnce({ data: { session: fakeSession } });

    const { unmount } = renderHook(() => useAuth());
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockSetSession).toHaveBeenCalledWith(fakeSession);
    unmount();
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useAuth());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
