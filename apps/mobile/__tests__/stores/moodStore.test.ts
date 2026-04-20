import { act } from '@testing-library/react-native';
import { useMoodStore } from '../../stores/moodStore';

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

// MMKV mock covers addToSyncQueue (storage.ts)
jest.mock('../../utils/storage', () => ({
  addToSyncQueue: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Chain helper
// ---------------------------------------------------------------------------

function makeChain(result: { data: unknown; error: null | { message: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'gte', 'lte', 'order', 'insert', 'update', 'single', 'maybeSingle'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

const RESET_STATE = {
  todayMood: null,
  moodHistory: [],
  isLoading: false,
  error: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  useMoodStore.setState(RESET_STATE);
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has null todayMood', () => {
    expect(useMoodStore.getState().todayMood).toBeNull();
  });

  it('has empty moodHistory', () => {
    expect(useMoodStore.getState().moodHistory).toHaveLength(0);
  });

  it('is not loading', () => {
    expect(useMoodStore.getState().isLoading).toBe(false);
  });

  it('has null error', () => {
    expect(useMoodStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearError
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears an existing error', () => {
    useMoodStore.setState({ error: 'Some error' });
    useMoodStore.getState().clearError();
    expect(useMoodStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe('reset', () => {
  it('resets all state to defaults', () => {
    useMoodStore.setState({ moodHistory: [{ id: '1' } as never], isLoading: true, error: 'err' });
    useMoodStore.getState().reset();
    const state = useMoodStore.getState();
    expect(state.moodHistory).toHaveLength(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.todayMood).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// logMood — insert path
// ---------------------------------------------------------------------------

describe('logMood (insert)', () => {
  const mockEntry = {
    id: 'mood-1',
    user_id: 'user-123',
    mood: 8,
    energy: 7,
    stress: 3,
    logged_at: new Date().toISOString(),
  };

  it('inserts a new mood entry and updates todayMood', async () => {
    mockFrom.mockReturnValue(makeChain({ data: mockEntry, error: null }));

    await act(async () => {
      await useMoodStore.getState().logMood({ mood: 8, energy: 7, stress: 3 });
    });

    expect(useMoodStore.getState().todayMood).toEqual(mockEntry);
    expect(useMoodStore.getState().isLoading).toBe(false);
    expect(useMoodStore.getState().error).toBeNull();
  });

  it('prepends new entry to moodHistory', async () => {
    const existing = { id: 'old-1', user_id: 'user-123', mood: 5, energy: 5, stress: 5, logged_at: '2026-01-01T00:00:00Z' };
    useMoodStore.setState({ moodHistory: [existing as never] });
    mockFrom.mockReturnValue(makeChain({ data: mockEntry, error: null }));

    await act(async () => {
      await useMoodStore.getState().logMood({ mood: 8, energy: 7, stress: 3 });
    });

    expect(useMoodStore.getState().moodHistory[0]).toEqual(mockEntry);
    expect(useMoodStore.getState().moodHistory).toHaveLength(2);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useMoodStore.getState().logMood({ mood: 8, energy: 7, stress: 3 });
    });

    expect(useMoodStore.getState().error).toBe('Not authenticated');
    expect(useMoodStore.getState().isLoading).toBe(false);
  });

  it('sets error when Supabase insert fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }));

    await act(async () => {
      await useMoodStore.getState().logMood({ mood: 8, energy: 7, stress: 3 });
    });

    expect(useMoodStore.getState().error).toBeTruthy();
    expect(useMoodStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// logMood — update path
// ---------------------------------------------------------------------------

describe('logMood (update)', () => {
  const existingMood = {
    id: 'mood-existing',
    user_id: 'user-123',
    mood: 5,
    energy: 5,
    stress: 5,
    logged_at: new Date().toISOString(),
  };

  it('updates existing todayMood entry', async () => {
    const updatedEntry = { ...existingMood, mood: 9, energy: 8, stress: 2 };
    useMoodStore.setState({ todayMood: existingMood as never, moodHistory: [existingMood as never] });
    mockFrom.mockReturnValue(makeChain({ data: updatedEntry, error: null }));

    await act(async () => {
      await useMoodStore.getState().logMood({ mood: 9, energy: 8, stress: 2 });
    });

    expect(useMoodStore.getState().todayMood?.mood).toBe(9);
    // moodHistory should have the updated entry
    expect(useMoodStore.getState().moodHistory[0]?.mood).toBe(9);
  });
});

// ---------------------------------------------------------------------------
// fetchMoodHistory
// ---------------------------------------------------------------------------

describe('fetchMoodHistory', () => {
  const dateRange = { start: '2026-04-01T00:00:00Z', end: '2026-04-30T23:59:59Z' };

  it('loads mood history and updates state', async () => {
    const entries = [
      { id: '1', mood: 8, energy: 7, stress: 3, logged_at: new Date().toISOString() },
      { id: '2', mood: 6, energy: 5, stress: 5, logged_at: '2026-04-17T10:00:00Z' },
    ];
    mockFrom.mockReturnValue(makeChain({ data: entries, error: null }));

    await act(async () => {
      await useMoodStore.getState().fetchMoodHistory(dateRange);
    });

    expect(useMoodStore.getState().moodHistory).toHaveLength(2);
    expect(useMoodStore.getState().isLoading).toBe(false);
    // Today's entry should be set as todayMood
    expect(useMoodStore.getState().todayMood?.id).toBe('1');
  });

  it('sets todayMood to null when no today entries', async () => {
    const oldEntry = { id: '1', mood: 7, energy: 6, stress: 4, logged_at: '2026-01-01T00:00:00Z' };
    mockFrom.mockReturnValue(makeChain({ data: [oldEntry], error: null }));

    await act(async () => {
      await useMoodStore.getState().fetchMoodHistory(dateRange);
    });

    expect(useMoodStore.getState().todayMood).toBeNull();
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useMoodStore.getState().fetchMoodHistory(dateRange);
    });

    expect(useMoodStore.getState().error).toBe('Not authenticated');
  });

  it('sets error when Supabase query fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Query failed' } }));

    await act(async () => {
      await useMoodStore.getState().fetchMoodHistory(dateRange);
    });

    expect(useMoodStore.getState().error).toBeTruthy();
    expect(useMoodStore.getState().isLoading).toBe(false);
  });
});
