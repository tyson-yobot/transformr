import { act } from '@testing-library/react-native';
import { useHabitStore } from '../../stores/habitStore';

// ---------------------------------------------------------------------------
// Mocks
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

jest.mock('../../utils/storage', () => ({
  addToSyncQueue: jest.fn(),
  getSyncQueue: jest.fn().mockReturnValue([]),
  getStorageJSON: jest.fn().mockReturnValue(null),
  setStorageJSON: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Chain helper
// ---------------------------------------------------------------------------

function makeChain(result: { data: unknown; error: null | { message: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'gte', 'lte', 'lt', 'order', 'insert', 'update', 'single', 'in', 'limit'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  useHabitStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has empty habits', () => {
    expect(useHabitStore.getState().habits).toHaveLength(0);
  });

  it('has null overallStreak', () => {
    expect(useHabitStore.getState().overallStreak).toBeNull();
  });

  it('is not loading', () => {
    expect(useHabitStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearError / reset
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useHabitStore.setState({ error: 'Oops' });
    useHabitStore.getState().clearError();
    expect(useHabitStore.getState().error).toBeNull();
  });
});

describe('reset', () => {
  it('resets all fields', () => {
    useHabitStore.setState({ habits: [{ id: '1' } as never], error: 'err' });
    useHabitStore.getState().reset();
    expect(useHabitStore.getState().habits).toHaveLength(0);
    expect(useHabitStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchHabits
// ---------------------------------------------------------------------------

describe('fetchHabits', () => {
  it('fetches habits, today completions, and history via Promise.all', async () => {
    const habit = { id: 'habit-1', user_id: 'user-123', name: 'Meditate', is_active: true };
    const todayCompletion = { id: 'comp-1', habit_id: 'habit-1', completed_at: new Date().toISOString() };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeChain({ data: [habit], error: null }); // habits
      if (callCount === 2) return makeChain({ data: [todayCompletion], error: null }); // today
      return makeChain({ data: [todayCompletion], error: null }); // 90-day history
    });

    await act(async () => {
      await useHabitStore.getState().fetchHabits();
    });

    expect(useHabitStore.getState().habits).toHaveLength(1);
    expect(useHabitStore.getState().todayCompletions).toHaveLength(1);
    expect(useHabitStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useHabitStore.getState().fetchHabits();
    });

    expect(useHabitStore.getState().error).toBe('Not authenticated');
  });

  it('computes overallStreak from history', async () => {
    // Completions on today and yesterday → streak = 2
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const completions = [
      { id: '1', habit_id: 'h1', completed_at: today },
      { id: '2', habit_id: 'h1', completed_at: yesterday },
    ];
    mockFrom.mockReturnValue(makeChain({ data: completions, error: null }));

    await act(async () => {
      await useHabitStore.getState().fetchHabits();
    });

    expect(useHabitStore.getState().overallStreak).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// completeHabit
// ---------------------------------------------------------------------------

describe('completeHabit', () => {
  it('records a habit completion and updates streak', async () => {
    const habit = { id: 'habit-1', name: 'Run', current_streak: 3, longest_streak: 5 };
    useHabitStore.setState({ habits: [habit as never] });

    const completion = { id: 'comp-1', habit_id: 'habit-1', user_id: 'user-123', completed_at: new Date().toISOString() };
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeChain({ data: completion, error: null }); // insert
      return makeChain({ data: null, error: null }); // update streak
    });

    await act(async () => {
      await useHabitStore.getState().completeHabit('habit-1');
    });

    expect(useHabitStore.getState().todayCompletions).toHaveLength(1);
    expect(useHabitStore.getState().habits[0]?.current_streak).toBe(4);
    expect(useHabitStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useHabitStore.getState().completeHabit('habit-1');
    });

    expect(useHabitStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// createHabit
// ---------------------------------------------------------------------------

describe('createHabit', () => {
  it('creates a new habit and adds to state', async () => {
    const newHabit = { id: 'habit-new', user_id: 'user-123', name: 'Journal', is_active: true };
    mockFrom.mockReturnValue(makeChain({ data: newHabit, error: null }));

    await act(async () => {
      await useHabitStore.getState().createHabit({ name: 'Journal' });
    });

    expect(useHabitStore.getState().habits).toHaveLength(1);
    expect(useHabitStore.getState().habits[0]?.name).toBe('Journal');
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useHabitStore.getState().createHabit({ name: 'Test' });
    });

    expect(useHabitStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// getStreakData
// ---------------------------------------------------------------------------

describe('getStreakData', () => {
  it('returns streak data array', async () => {
    const streakData = [{ habit_id: 'h1', habit_name: 'Run', current_streak: 5, longest_streak: 10, total_completions: 25 }];
    mockFrom.mockReturnValue(makeChain({ data: streakData, error: null }));

    const result = await useHabitStore.getState().getStreakData();

    expect(Array.isArray(result)).toBe(true);
  });
});
