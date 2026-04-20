import { act } from '@testing-library/react-native';
import { useSubscriptionStore } from '../../stores/subscriptionStore';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'user-123', email: 'test@example.com' } },
  error: null,
});
const mockFrom = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// ---------------------------------------------------------------------------
// Chain helper
// ---------------------------------------------------------------------------

function makeChain(result: { data: unknown; error: null | { message: string; code?: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'single', 'update'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

const TODAY = new Date().toISOString().slice(0, 10);

beforeEach(() => {
  jest.clearAllMocks();
  useSubscriptionStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('defaults to free tier', () => {
    expect(useSubscriptionStore.getState().tier).toBe('free');
  });

  it('is not loading', () => {
    expect(useSubscriptionStore.getState().isLoading).toBe(false);
  });

  it('has null error', () => {
    expect(useSubscriptionStore.getState().error).toBeNull();
  });

  it('has zero usage counts', () => {
    const { usage } = useSubscriptionStore.getState();
    expect(usage.aiMealCameraScans).toBe(0);
    expect(usage.aiChatMessages).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// loadSubscription
// ---------------------------------------------------------------------------

describe('loadSubscription', () => {
  it('loads pro tier from database', async () => {
    const profileData = {
      subscription_tier: 'pro',
      subscription_expires_at: '2027-01-01',
      stripe_customer_id: 'cus_123',
      stripe_subscription_id: 'sub_123',
    };
    mockFrom.mockReturnValue(makeChain({ data: profileData, error: null }));

    await act(async () => {
      await useSubscriptionStore.getState().loadSubscription();
    });

    expect(useSubscriptionStore.getState().tier).toBe('pro');
    expect(useSubscriptionStore.getState().expiresAt).toBe('2027-01-01');
    expect(useSubscriptionStore.getState().isLoading).toBe(false);
  });

  it('defaults to free tier when subscription_tier is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { subscription_tier: null }, error: null }));

    await act(async () => {
      await useSubscriptionStore.getState().loadSubscription();
    });

    expect(useSubscriptionStore.getState().tier).toBe('free');
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useSubscriptionStore.getState().loadSubscription();
    });

    expect(useSubscriptionStore.getState().error).toBe('Not authenticated');
    expect(useSubscriptionStore.getState().isLoading).toBe(false);
  });

  it('sets error when Supabase query fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }));

    await act(async () => {
      await useSubscriptionStore.getState().loadSubscription();
    });

    expect(useSubscriptionStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// refreshSubscription
// ---------------------------------------------------------------------------

describe('refreshSubscription', () => {
  it('delegates to loadSubscription', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { subscription_tier: 'elite' }, error: null }));

    await act(async () => {
      await useSubscriptionStore.getState().refreshSubscription();
    });

    expect(useSubscriptionStore.getState().tier).toBe('elite');
  });
});

// ---------------------------------------------------------------------------
// incrementUsage
// ---------------------------------------------------------------------------

describe('incrementUsage', () => {
  it('increments aiChatMessages', () => {
    useSubscriptionStore.getState().incrementUsage('aiChatMessages');
    expect(useSubscriptionStore.getState().usage.aiChatMessages).toBe(1);
  });

  it('increments aiMealCameraScans', () => {
    useSubscriptionStore.getState().incrementUsage('aiMealCameraScans');
    expect(useSubscriptionStore.getState().usage.aiMealCameraScans).toBe(1);
  });

  it('accumulates multiple increments', () => {
    useSubscriptionStore.getState().incrementUsage('aiChatMessages');
    useSubscriptionStore.getState().incrementUsage('aiChatMessages');
    useSubscriptionStore.getState().incrementUsage('aiChatMessages');
    expect(useSubscriptionStore.getState().usage.aiChatMessages).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// resetUsageIfNewMonth
// ---------------------------------------------------------------------------

describe('resetUsageIfNewMonth', () => {
  it('does not reset usage when lastResetDate is same month', () => {
    useSubscriptionStore.setState({
      usage: { aiMealCameraScans: 5, aiChatMessages: 10, lastResetDate: TODAY },
    });
    useSubscriptionStore.getState().resetUsageIfNewMonth();
    expect(useSubscriptionStore.getState().usage.aiChatMessages).toBe(10);
  });

  it('resets usage when lastResetDate is a different month', () => {
    useSubscriptionStore.setState({
      usage: { aiMealCameraScans: 5, aiChatMessages: 10, lastResetDate: '2020-01-01' },
    });
    useSubscriptionStore.getState().resetUsageIfNewMonth();
    expect(useSubscriptionStore.getState().usage.aiChatMessages).toBe(0);
    expect(useSubscriptionStore.getState().usage.aiMealCameraScans).toBe(0);
    expect(useSubscriptionStore.getState().usage.lastResetDate).toBe(TODAY);
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe('reset', () => {
  it('resets all state to defaults', () => {
    useSubscriptionStore.setState({ tier: 'pro', isLoading: true, error: 'err' });
    useSubscriptionStore.getState().reset();
    const state = useSubscriptionStore.getState();
    expect(state.tier).toBe('free');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});
