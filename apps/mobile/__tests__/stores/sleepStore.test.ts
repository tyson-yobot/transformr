import { act } from '@testing-library/react-native';
import { useSleepStore } from '../../stores/sleepStore';

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
  ['select', 'eq', 'gte', 'lte', 'order', 'insert', 'update', 'single'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  useSleepStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has null lastSleep', () => {
    expect(useSleepStore.getState().lastSleep).toBeNull();
  });

  it('has empty sleepHistory', () => {
    expect(useSleepStore.getState().sleepHistory).toHaveLength(0);
  });

  it('is not loading', () => {
    expect(useSleepStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearError / reset
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useSleepStore.setState({ error: 'Oops' });
    useSleepStore.getState().clearError();
    expect(useSleepStore.getState().error).toBeNull();
  });
});

describe('reset', () => {
  it('resets all state', () => {
    useSleepStore.setState({ sleepHistory: [{ id: '1' } as never], error: 'err' });
    useSleepStore.getState().reset();
    expect(useSleepStore.getState().sleepHistory).toHaveLength(0);
    expect(useSleepStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// logSleep
// ---------------------------------------------------------------------------

describe('logSleep', () => {
  const mockLog = { id: 'sleep-1', user_id: 'user-123', hours: 7.5, quality: 4 };

  it('logs a new sleep entry', async () => {
    mockFrom.mockReturnValue(makeChain({ data: mockLog, error: null }));

    await act(async () => {
      await useSleepStore.getState().logSleep({ hours: 7.5, quality: 4, bedtime: '22:00', wakeTime: '05:30' });
    });

    expect(useSleepStore.getState().lastSleep).toEqual(mockLog);
    expect(useSleepStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useSleepStore.getState().logSleep({ hours: 7, quality: 3, bedtime: '23:00', wakeTime: '06:00' });
    });

    expect(useSleepStore.getState().error).toBe('Not authenticated');
  });

  it('sets error when insert fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Insert failed' } }));

    await act(async () => {
      await useSleepStore.getState().logSleep({ hours: 7, quality: 3, bedtime: '23:00', wakeTime: '06:00' });
    });

    expect(useSleepStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// fetchSleepHistory
// ---------------------------------------------------------------------------

describe('fetchSleepHistory', () => {
  const dateRange = { start: '2026-04-01', end: '2026-04-30' };

  it('fetches sleep history', async () => {
    const entries = [
      { id: '1', hours: 8, quality: 5 },
      { id: '2', hours: 6, quality: 3 },
    ];
    mockFrom.mockReturnValue(makeChain({ data: entries, error: null }));

    await act(async () => {
      await useSleepStore.getState().fetchSleepHistory(dateRange);
    });

    expect(useSleepStore.getState().sleepHistory).toHaveLength(2);
    expect(useSleepStore.getState().isLoading).toBe(false);
  });

  it('sets error when query fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Query failed' } }));

    await act(async () => {
      await useSleepStore.getState().fetchSleepHistory(dateRange);
    });

    expect(useSleepStore.getState().error).toBeTruthy();
  });
});
