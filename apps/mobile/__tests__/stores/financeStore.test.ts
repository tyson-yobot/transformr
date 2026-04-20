import { act } from '@testing-library/react-native';
import { useFinanceStore } from '../../stores/financeStore';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'user-123' } },
  error: null,
});
const mockFrom = jest.fn();
const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

// ---------------------------------------------------------------------------
// Chain helper
// ---------------------------------------------------------------------------

function makeChain(result: { data: unknown; error: null | { message: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'gte', 'lte', 'order', 'insert', 'update', 'single', 'in', 'limit', 'maybeSingle'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  useFinanceStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has empty accounts', () => {
    expect(useFinanceStore.getState().accounts).toHaveLength(0);
  });

  it('has empty transactions', () => {
    expect(useFinanceStore.getState().transactions).toHaveLength(0);
  });

  it('has empty budgets', () => {
    expect(useFinanceStore.getState().budgets).toHaveLength(0);
  });

  it('is not loading', () => {
    expect(useFinanceStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearError / reset
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useFinanceStore.setState({ error: 'Oops' });
    useFinanceStore.getState().clearError();
    expect(useFinanceStore.getState().error).toBeNull();
  });
});

describe('reset', () => {
  it('resets all state', () => {
    useFinanceStore.setState({ accounts: [{ id: '1' } as never], error: 'err' });
    useFinanceStore.getState().reset();
    expect(useFinanceStore.getState().accounts).toHaveLength(0);
    expect(useFinanceStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchAccounts
// ---------------------------------------------------------------------------

describe('fetchAccounts', () => {
  it('fetches accounts from database', async () => {
    const account = { id: 'acc-1', user_id: 'user-123', name: 'Checking', balance: 5000 };
    mockFrom.mockReturnValue(makeChain({ data: [account], error: null }));

    await act(async () => {
      await useFinanceStore.getState().fetchAccounts();
    });

    expect(useFinanceStore.getState().accounts).toHaveLength(1);
    expect(useFinanceStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useFinanceStore.getState().fetchAccounts();
    });

    expect(useFinanceStore.getState().error).toBe('Not authenticated');
  });

  it('sets error when query fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }));

    await act(async () => {
      await useFinanceStore.getState().fetchAccounts();
    });

    expect(useFinanceStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// logTransaction
// ---------------------------------------------------------------------------

describe('logTransaction', () => {
  it('logs a transaction and adds to state', async () => {
    const txn = { id: 'txn-1', user_id: 'user-123', amount: -50, category: 'food' };
    mockFrom.mockReturnValue(makeChain({ data: txn, error: null }));

    await act(async () => {
      await useFinanceStore.getState().logTransaction({
        account_id: 'acc-1',
        amount: -50,
        category: 'food' as never,
        description: 'Grocery run',
        transaction_date: '2026-04-18',
      });
    });

    expect(useFinanceStore.getState().transactions).toHaveLength(1);
    expect(useFinanceStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useFinanceStore.getState().logTransaction({
        account_id: 'acc-1',
        amount: 100,
        transaction_date: '2026-04-18',
      });
    });

    expect(useFinanceStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// fetchBudgets
// ---------------------------------------------------------------------------

describe('fetchBudgets', () => {
  it('fetches budgets from database', async () => {
    const budget = { id: 'bud-1', user_id: 'user-123', category: 'food', limit: 500 };
    mockFrom.mockReturnValue(makeChain({ data: [budget], error: null }));

    await act(async () => {
      await useFinanceStore.getState().fetchBudgets();
    });

    expect(useFinanceStore.getState().budgets).toHaveLength(1);
    expect(useFinanceStore.getState().isLoading).toBe(false);
  });
});
