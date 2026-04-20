import { act } from '@testing-library/react-native';
import { useAuthStore } from '../../stores/authStore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
  __esModule: true,
}));

const mockOpenAuthSession = jest.fn().mockResolvedValue({ type: 'dismissed' });
const mockWarmUp = jest.fn().mockResolvedValue(undefined);
const mockCoolDown = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: (...args: unknown[]) => mockOpenAuthSession(...args),
  warmUpAsync: (...args: unknown[]) => mockWarmUp(...args),
  coolDownAsync: (...args: unknown[]) => mockCoolDown(...args),
  maybeCompleteAuthSession: jest.fn().mockReturnValue({ type: 'success' }),
}));

const mockCreateURL = jest.fn().mockReturnValue('exp://localhost/--/');

jest.mock('expo-linking', () => ({
  createURL: (...args: unknown[]) => mockCreateURL(...args),
  openURL: jest.fn().mockResolvedValue(undefined),
  useURL: jest.fn().mockReturnValue(null),
}));

const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignInWithOAuth = jest.fn();
const mockSignOut = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockOnAuthStateChange = jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
const mockExchangeCodeForSession = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockSetSession = jest.fn().mockResolvedValue({ data: {}, error: null });

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      setSession: (...args: unknown[]) => mockSetSession(...args),
    },
  },
}));


beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  // Reset to a known clean state (loading:false so tests don't hang on persist rehydration)
  useAuthStore.setState({
    session: null,
    user: null,
    loading: false,
    error: null,
    rateLimitSeconds: 0,
  });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has null session', () => {
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('has null user', () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('has null error', () => {
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('has rateLimitSeconds 0', () => {
    expect(useAuthStore.getState().rateLimitSeconds).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// clearError / setSession / tickRateLimit
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useAuthStore.setState({ error: 'Oops' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});

describe('setSession', () => {
  it('sets session and user', () => {
    const session = { user: { id: 'u1' }, access_token: 'tok' } as never;
    useAuthStore.getState().setSession(session);
    expect(useAuthStore.getState().session).toBe(session);
    expect(useAuthStore.getState().user?.id).toBe('u1');
  });

  it('clears session and user when null passed', () => {
    useAuthStore.setState({ session: { user: { id: 'u1' } } as never, user: { id: 'u1' } as never });
    useAuthStore.getState().setSession(null);
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('tickRateLimit', () => {
  it('decrements rateLimitSeconds', () => {
    useAuthStore.setState({ rateLimitSeconds: 5 });
    useAuthStore.getState().tickRateLimit();
    expect(useAuthStore.getState().rateLimitSeconds).toBe(4);
  });

  it('does not go below 0', () => {
    useAuthStore.setState({ rateLimitSeconds: 0 });
    useAuthStore.getState().tickRateLimit();
    expect(useAuthStore.getState().rateLimitSeconds).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// signIn
// ---------------------------------------------------------------------------

describe('signIn', () => {
  it('signs in successfully and sets session and user', async () => {
    const session = { access_token: 'tok', user: { id: 'u1', email: 'a@b.com' } };
    mockSignInWithPassword.mockResolvedValueOnce({ data: { session, user: session.user }, error: null });

    await act(async () => {
      await useAuthStore.getState().signIn('a@b.com', 'password');
    });

    expect(useAuthStore.getState().session).toBe(session);
    expect(useAuthStore.getState().user).toBe(session.user);
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('sets user-friendly error for invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' },
    });

    await act(async () => {
      await useAuthStore.getState().signIn('a@b.com', 'wrong');
    });

    expect(useAuthStore.getState().error).toMatch(/Incorrect email or password/);
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('sets user-friendly error for unconfirmed email', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Email not confirmed' },
    });

    await act(async () => {
      await useAuthStore.getState().signIn('a@b.com', 'pass');
    });

    expect(useAuthStore.getState().error).toMatch(/confirm your email/);
  });

  it('sets user-friendly error for too many attempts', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Too many requests', status: 429 },
    });

    await act(async () => {
      await useAuthStore.getState().signIn('a@b.com', 'pass');
    });

    expect(useAuthStore.getState().error).toMatch(/Too many attempts/);
  });

  it('sets network error message for network failures', async () => {
    mockSignInWithPassword.mockRejectedValueOnce(new Error('network fetch failed'));

    await act(async () => {
      await useAuthStore.getState().signIn('a@b.com', 'pass');
    });

    expect(useAuthStore.getState().error).toMatch(/Unable to connect/);
  });
});

// ---------------------------------------------------------------------------
// signUp
// ---------------------------------------------------------------------------

describe('signUp', () => {
  it('signs up successfully', async () => {
    const session = { access_token: 'tok', user: { id: 'u-new' } };
    mockSignUp.mockResolvedValueOnce({ data: { session, user: session.user }, error: null });

    await act(async () => {
      await useAuthStore.getState().signUp('new@b.com', 'pass123', 'Alice');
    });

    expect(useAuthStore.getState().session).toBe(session);
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('does nothing when rate limit is active', async () => {
    useAuthStore.setState({ rateLimitSeconds: 30 });

    await act(async () => {
      await useAuthStore.getState().signUp('a@b.com', 'pass', 'Bob');
    });

    expect(mockSignUp).not.toHaveBeenCalled();
    expect(useAuthStore.getState().error).toMatch(/wait 30s/);
  });

  it('sets error for already registered email', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'User already registered' },
    });

    await act(async () => {
      await useAuthStore.getState().signUp('existing@b.com', 'pass', 'Bob');
    });

    expect(useAuthStore.getState().error).toMatch(/already exists/);
  });

  it('sets error for weak password', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Password should be at least 6 characters' },
    });

    await act(async () => {
      await useAuthStore.getState().signUp('a@b.com', 'abc', 'Bob');
    });

    expect(useAuthStore.getState().error).toMatch(/8 characters/);
  });

  it('sets error and starts rate limit countdown on 429', async () => {
    jest.useFakeTimers();
    mockSignUp.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'After 60 seconds', status: 429 },
    });

    await act(async () => {
      await useAuthStore.getState().signUp('a@b.com', 'pass', 'Bob');
    });

    expect(useAuthStore.getState().rateLimitSeconds).toBe(60);

    // Advance time to check countdown
    act(() => { jest.advanceTimersByTime(5000); });
    expect(useAuthStore.getState().rateLimitSeconds).toBe(55);

    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

describe('signOut', () => {
  it('signs out and clears session', async () => {
    useAuthStore.setState({ session: { access_token: 'tok' } as never, user: { id: 'u1' } as never });
    mockSignOut.mockResolvedValueOnce({ error: null });

    await act(async () => {
      await useAuthStore.getState().signOut();
    });

    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('sets error when signOut fails', async () => {
    mockSignOut.mockResolvedValueOnce({ error: { message: 'Sign out failed' } });

    await act(async () => {
      await useAuthStore.getState().signOut();
    });

    expect(useAuthStore.getState().error).toBeTruthy();
    expect(useAuthStore.getState().loading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resetPassword
// ---------------------------------------------------------------------------

describe('resetPassword', () => {
  it('sends password reset email', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

    await act(async () => {
      await useAuthStore.getState().resetPassword('a@b.com');
    });

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('a@b.com', expect.objectContaining({ redirectTo: expect.any(String) }));
    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('sets error when reset fails', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: { message: 'Email not found' } });

    await act(async () => {
      await useAuthStore.getState().resetPassword('bad@b.com');
    });

    expect(useAuthStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// signInWithGoogle
// ---------------------------------------------------------------------------

describe('signInWithGoogle', () => {
  it('completes Google sign-in via auth code', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ data: { url: 'https://oauth.example.com' }, error: null });
    mockOpenAuthSession.mockResolvedValueOnce({
      type: 'success',
      url: 'https://localhost/auth/callback?code=abc123',
    });
    mockExchangeCodeForSession.mockResolvedValueOnce({ data: {}, error: null });

    await act(async () => {
      await useAuthStore.getState().signInWithGoogle();
    });

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('abc123');
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('handles cancel gracefully', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ data: { url: 'https://oauth.example.com' }, error: null });
    mockOpenAuthSession.mockResolvedValueOnce({ type: 'cancel' });

    await act(async () => {
      await useAuthStore.getState().signInWithGoogle();
    });

    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('sets error when OAuth fails', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ data: {}, error: { message: 'OAuth failed' } });

    await act(async () => {
      await useAuthStore.getState().signInWithGoogle();
    });

    expect(useAuthStore.getState().error).toBeTruthy();
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('sets error when no URL returned', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ data: { url: null }, error: null });

    await act(async () => {
      await useAuthStore.getState().signInWithGoogle();
    });

    expect(useAuthStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// signInWithApple
// ---------------------------------------------------------------------------

describe('signInWithApple', () => {
  it('completes Apple sign-in via auth code', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ data: { url: 'https://oauth.apple.com' }, error: null });
    mockOpenAuthSession.mockResolvedValueOnce({
      type: 'success',
      url: 'https://localhost/auth/callback?code=appleCode',
    });
    mockExchangeCodeForSession.mockResolvedValueOnce({ data: {}, error: null });

    await act(async () => {
      await useAuthStore.getState().signInWithApple();
    });

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('appleCode');
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('handles cancel gracefully', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ data: { url: 'https://oauth.apple.com' }, error: null });
    mockOpenAuthSession.mockResolvedValueOnce({ type: 'cancel' });

    await act(async () => {
      await useAuthStore.getState().signInWithApple();
    });

    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// listenToAuthChanges
// ---------------------------------------------------------------------------

describe('listenToAuthChanges', () => {
  it('returns a subscription object', () => {
    const subscription = useAuthStore.getState().listenToAuthChanges();
    expect(subscription).toBeDefined();
    expect(typeof subscription.unsubscribe).toBe('function');
  });

  it('updates session on auth state change event', () => {
    // Capture the callback passed to onAuthStateChange
    let capturedCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementationOnce((cb: (event: string, session: unknown) => void) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    useAuthStore.getState().listenToAuthChanges();

    const newSession = { user: { id: 'u-new' } };
    act(() => {
      capturedCallback?.('SIGNED_IN', newSession);
    });

    expect(useAuthStore.getState().session).toBe(newSession);
    expect(useAuthStore.getState().user?.id).toBe('u-new');
  });
});
