import { act } from '@testing-library/react-native';
import { useBusinessStore } from '../../stores/businessStore';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'user-123' } },
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

function makeChain(result: { data: unknown; error: null | { message: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'gte', 'lte', 'order', 'insert', 'update', 'single', 'in', 'limit'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  useBusinessStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has empty businesses', () => {
    expect(useBusinessStore.getState().businesses).toHaveLength(0);
  });

  it('has empty revenue data', () => {
    expect(useBusinessStore.getState().revenueData).toHaveLength(0);
  });

  it('is not loading', () => {
    expect(useBusinessStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearError / reset
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useBusinessStore.setState({ error: 'Oops' });
    useBusinessStore.getState().clearError();
    expect(useBusinessStore.getState().error).toBeNull();
  });
});

describe('reset', () => {
  it('resets all state', () => {
    useBusinessStore.setState({ businesses: [{ id: '1' } as never], error: 'err' });
    useBusinessStore.getState().reset();
    expect(useBusinessStore.getState().businesses).toHaveLength(0);
    expect(useBusinessStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchBusinesses
// ---------------------------------------------------------------------------

describe('fetchBusinesses', () => {
  it('fetches businesses and revenue/expense data', async () => {
    const biz = { id: 'biz-1', user_id: 'user-123', name: 'My Business' };
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeChain({ data: [biz], error: null }); // businesses
      if (callCount === 2) return makeChain({ data: [{ id: 'rev-1', amount: 1000 }], error: null }); // revenue
      return makeChain({ data: [{ id: 'exp-1', amount: 200 }], error: null }); // expenses
    });

    await act(async () => {
      await useBusinessStore.getState().fetchBusinesses();
    });

    expect(useBusinessStore.getState().businesses).toHaveLength(1);
    expect(useBusinessStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useBusinessStore.getState().fetchBusinesses();
    });

    expect(useBusinessStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// createBusiness
// ---------------------------------------------------------------------------

describe('createBusiness', () => {
  it('creates a new business and adds to state', async () => {
    const newBiz = { id: 'biz-new', user_id: 'user-123', name: 'Side Hustle', type: 'consulting' };
    mockFrom.mockReturnValue(makeChain({ data: newBiz, error: null }));

    await act(async () => {
      await useBusinessStore.getState().createBusiness({ name: 'Side Hustle', type: 'consulting' });
    });

    expect(useBusinessStore.getState().businesses).toHaveLength(1);
    expect(useBusinessStore.getState().businesses[0]?.name).toBe('Side Hustle');
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useBusinessStore.getState().createBusiness({ name: 'Test', type: 'product' });
    });

    expect(useBusinessStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// logRevenue
// ---------------------------------------------------------------------------

describe('logRevenue', () => {
  it('logs revenue entry and adds to state', async () => {
    const biz = { id: 'biz-1', user_id: 'user-123', name: 'My Business' };
    const revEntry = { id: 'rev-1', business_id: 'biz-1', amount: 5000 };
    useBusinessStore.setState({ businesses: [biz as never] });
    mockFrom.mockReturnValue(makeChain({ data: revEntry, error: null }));

    await act(async () => {
      await useBusinessStore.getState().logRevenue({
        business_id: 'biz-1',
        amount: 5000,
        transaction_date: '2026-04-18',
        description: 'Q1 revenue',
      });
    });

    expect(useBusinessStore.getState().revenueData).toHaveLength(1);
    expect(useBusinessStore.getState().revenueData[0]?.amount).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// getMonthlyMetrics
// ---------------------------------------------------------------------------

describe('getMonthlyMetrics', () => {
  it('returns empty array when no revenue data', () => {
    const metrics = useBusinessStore.getState().getMonthlyMetrics();
    expect(Array.isArray(metrics)).toBe(true);
  });
});
