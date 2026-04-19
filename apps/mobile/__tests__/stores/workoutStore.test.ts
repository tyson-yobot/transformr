import { act } from '@testing-library/react-native';
import { useWorkoutStore } from '../../stores/workoutStore';

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
  ['select', 'eq', 'gte', 'lte', 'order', 'insert', 'update', 'single', 'in', 'limit', 'ilike', 'or'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  useWorkoutStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has no active session', () => {
    expect(useWorkoutStore.getState().activeSession).toBeNull();
  });

  it('has empty templates', () => {
    expect(useWorkoutStore.getState().templates).toHaveLength(0);
  });

  it('has null pendingExerciseId', () => {
    expect(useWorkoutStore.getState().pendingExerciseId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearError / reset / setPendingExerciseId
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useWorkoutStore.setState({ error: 'Oops' });
    useWorkoutStore.getState().clearError();
    expect(useWorkoutStore.getState().error).toBeNull();
  });
});

describe('reset', () => {
  it('resets all state', () => {
    useWorkoutStore.setState({ templates: [{ id: '1' } as never], error: 'err' });
    useWorkoutStore.getState().reset();
    expect(useWorkoutStore.getState().templates).toHaveLength(0);
    expect(useWorkoutStore.getState().error).toBeNull();
  });
});

describe('setPendingExerciseId', () => {
  it('sets pending exercise id', () => {
    useWorkoutStore.getState().setPendingExerciseId('ex-1');
    expect(useWorkoutStore.getState().pendingExerciseId).toBe('ex-1');
  });

  it('clears with null', () => {
    useWorkoutStore.setState({ pendingExerciseId: 'ex-1' });
    useWorkoutStore.getState().setPendingExerciseId(null);
    expect(useWorkoutStore.getState().pendingExerciseId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchTemplates
// ---------------------------------------------------------------------------

describe('fetchTemplates', () => {
  it('fetches workout templates', async () => {
    const templates = [{ id: 't1', user_id: 'user-123', name: 'Push Day' }];
    mockFrom.mockReturnValue(makeChain({ data: templates, error: null }));

    await act(async () => {
      await useWorkoutStore.getState().fetchTemplates();
    });

    expect(useWorkoutStore.getState().templates).toHaveLength(1);
    expect(useWorkoutStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useWorkoutStore.getState().fetchTemplates();
    });

    expect(useWorkoutStore.getState().error).toBe('Not authenticated');
  });

  it('sets error when query fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }));

    await act(async () => {
      await useWorkoutStore.getState().fetchTemplates();
    });

    expect(useWorkoutStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// fetchExercises
// ---------------------------------------------------------------------------

describe('fetchExercises', () => {
  it('fetches exercises', async () => {
    const exercises = [
      { id: 'e1', name: 'Bench Press', category: 'chest' },
      { id: 'e2', name: 'Squat', category: 'legs' },
    ];
    mockFrom.mockReturnValue(makeChain({ data: exercises, error: null }));

    await act(async () => {
      await useWorkoutStore.getState().fetchExercises();
    });

    expect(useWorkoutStore.getState().exercises).toHaveLength(2);
    expect(useWorkoutStore.getState().isLoading).toBe(false);
  });

  it('applies category filter', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [{ id: 'e1', name: 'Bench Press' }], error: null }));

    await act(async () => {
      await useWorkoutStore.getState().fetchExercises({ category: 'chest' as never });
    });

    expect(useWorkoutStore.getState().exercises).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// startWorkout
// ---------------------------------------------------------------------------

describe('startWorkout', () => {
  it('creates a new workout session', async () => {
    const session = { id: 'session-1', user_id: 'user-123', started_at: new Date().toISOString() };
    mockFrom.mockReturnValue(makeChain({ data: session, error: null }));

    await act(async () => {
      await useWorkoutStore.getState().startWorkout(null);
    });

    expect(useWorkoutStore.getState().activeSession?.id).toBe('session-1');
    expect(useWorkoutStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useWorkoutStore.getState().startWorkout(null);
    });

    expect(useWorkoutStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// logSet
// ---------------------------------------------------------------------------

describe('logSet', () => {
  it('logs a set for an exercise in the active session', async () => {
    const session = { id: 'session-1', user_id: 'user-123' };
    useWorkoutStore.setState({ activeSession: session as never });
    const newSet = { id: 'set-1', session_id: 'session-1', exercise_id: 'e1', weight: 135, reps: 10 };
    mockFrom.mockReturnValue(makeChain({ data: newSet, error: null }));

    await act(async () => {
      await useWorkoutStore.getState().logSet('e1', { weight: 135, reps: 10 });
    });

    expect(useWorkoutStore.getState().error).toBeNull();
    expect(useWorkoutStore.getState().isLoading).toBe(false);
  });

  it('sets error when no active session', async () => {
    await act(async () => {
      await useWorkoutStore.getState().logSet('e1', { weight: 135, reps: 10 });
    });

    expect(useWorkoutStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// completeWorkout
// ---------------------------------------------------------------------------

describe('completeWorkout', () => {
  it('completes the active session', async () => {
    const session = { id: 'session-1', user_id: 'user-123' };
    useWorkoutStore.setState({ activeSession: session as never });
    const completed = { ...session, completed_at: new Date().toISOString(), duration_minutes: 60 };
    mockFrom.mockReturnValue(makeChain({ data: completed, error: null }));

    await act(async () => {
      await useWorkoutStore.getState().completeWorkout();
    });

    expect(useWorkoutStore.getState().activeSession).toBeNull();
    expect(useWorkoutStore.getState().isLoading).toBe(false);
  });

  it('sets error when no active session', async () => {
    await act(async () => {
      await useWorkoutStore.getState().completeWorkout();
    });

    expect(useWorkoutStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// getGhostData
// ---------------------------------------------------------------------------

describe('getGhostData', () => {
  it('returns ghost set data from previous sessions', async () => {
    const ghostData = [
      { id: 's1', exercise_id: 'e1', weight: 135, reps: 10, set_number: 1, started_at: '2026-04-17T00:00:00Z' },
    ];
    mockFrom.mockReturnValue(makeChain({ data: ghostData, error: null }));

    const result = await useWorkoutStore.getState().getGhostData('e1');

    expect(Array.isArray(result)).toBe(true);
  });
});
