import { act } from '@testing-library/react-native';
import { useChallengeStore } from '../../stores/challengeStore';

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

// ---------------------------------------------------------------------------
// Chain helper
// ---------------------------------------------------------------------------

function makeChain(result: { data: unknown; error: null | { message: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'or', 'order', 'insert', 'update', 'single', 'maybeSingle', 'limit'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  useChallengeStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has empty challengeDefinitions', () => {
    expect(useChallengeStore.getState().challengeDefinitions).toHaveLength(0);
  });

  it('has null activeEnrollment', () => {
    expect(useChallengeStore.getState().activeEnrollment).toBeNull();
  });

  it('has empty enrollments', () => {
    expect(useChallengeStore.getState().enrollments).toHaveLength(0);
  });

  it('has null todayLog', () => {
    expect(useChallengeStore.getState().todayLog).toBeNull();
  });

  it('is not loading', () => {
    expect(useChallengeStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearError / reset
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useChallengeStore.setState({ error: 'Oops' });
    useChallengeStore.getState().clearError();
    expect(useChallengeStore.getState().error).toBeNull();
  });
});

describe('reset', () => {
  it('resets all state', () => {
    useChallengeStore.setState({ enrollments: [{ id: '1' } as never], error: 'err' });
    useChallengeStore.getState().reset();
    expect(useChallengeStore.getState().enrollments).toHaveLength(0);
    expect(useChallengeStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchChallengeDefinitions
// ---------------------------------------------------------------------------

describe('fetchChallengeDefinitions', () => {
  it('fetches and sets challenge definitions', async () => {
    const defs = [{ id: 'def-1', name: '30-Day Fitness', duration_days: 30 }];
    mockFrom.mockReturnValue(makeChain({ data: defs, error: null }));

    await act(async () => {
      await useChallengeStore.getState().fetchChallengeDefinitions();
    });

    expect(useChallengeStore.getState().challengeDefinitions).toHaveLength(1);
    expect(useChallengeStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useChallengeStore.getState().fetchChallengeDefinitions();
    });

    expect(useChallengeStore.getState().error).toBe('Not authenticated');
  });

  it('sets error when query fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }));

    await act(async () => {
      await useChallengeStore.getState().fetchChallengeDefinitions();
    });

    expect(useChallengeStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// fetchEnrollments
// ---------------------------------------------------------------------------

describe('fetchEnrollments', () => {
  it('fetches enrollments for user', async () => {
    const enrollments = [{ id: 'e1', user_id: 'user-123', status: 'completed' }];
    mockFrom.mockReturnValue(makeChain({ data: enrollments, error: null }));

    await act(async () => {
      await useChallengeStore.getState().fetchEnrollments('user-123');
    });

    expect(useChallengeStore.getState().enrollments).toHaveLength(1);
    expect(useChallengeStore.getState().isLoading).toBe(false);
  });

  it('sets error when query fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Query failed' } }));

    await act(async () => {
      await useChallengeStore.getState().fetchEnrollments('user-123');
    });

    expect(useChallengeStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// fetchActiveEnrollment
// ---------------------------------------------------------------------------

describe('fetchActiveEnrollment', () => {
  it('sets active enrollment and fetches today log when enrollment found', async () => {
    const enrollment = { id: 'e1', user_id: 'user-123', status: 'active', challenge_id: 'def-1' };
    const todayLog = { id: 'log-1', enrollment_id: 'e1', tasks_completed: {} };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeChain({ data: enrollment, error: null }); // active enrollment
      return makeChain({ data: todayLog, error: null }); // today's log
    });

    await act(async () => {
      await useChallengeStore.getState().fetchActiveEnrollment('user-123');
    });

    expect(useChallengeStore.getState().activeEnrollment?.id).toBe('e1');
    expect(useChallengeStore.getState().todayLog?.id).toBe('log-1');
    expect(useChallengeStore.getState().isLoading).toBe(false);
  });

  it('sets null when no active enrollment', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await act(async () => {
      await useChallengeStore.getState().fetchActiveEnrollment('user-123');
    });

    expect(useChallengeStore.getState().activeEnrollment).toBeNull();
    expect(useChallengeStore.getState().todayLog).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchDailyLogs
// ---------------------------------------------------------------------------

describe('fetchDailyLogs', () => {
  it('fetches daily logs and sets todayLog', async () => {
    // Use ISO date string matching today
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const logs = [
      { id: 'log-1', enrollment_id: 'e1', date: dateStr, tasks_completed: {} },
      { id: 'log-2', enrollment_id: 'e1', date: '2026-04-10', tasks_completed: {} },
    ];
    mockFrom.mockReturnValue(makeChain({ data: logs, error: null }));

    await act(async () => {
      await useChallengeStore.getState().fetchDailyLogs('e1');
    });

    expect(useChallengeStore.getState().dailyLogs).toHaveLength(2);
    expect(useChallengeStore.getState().todayLog?.id).toBe('log-1');
    expect(useChallengeStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// enrollInChallenge
// ---------------------------------------------------------------------------

describe('enrollInChallenge', () => {
  it('creates enrollment and sets it as active', async () => {
    useChallengeStore.setState({
      challengeDefinitions: [{ id: 'def-1', duration_days: 30 } as never],
    });
    const enrollment = { id: 'e-new', user_id: 'user-123', challenge_id: 'def-1', status: 'active' };
    mockFrom.mockReturnValue(makeChain({ data: enrollment, error: null }));

    await act(async () => {
      await useChallengeStore.getState().enrollInChallenge('user-123', 'def-1');
    });

    expect(useChallengeStore.getState().activeEnrollment?.id).toBe('e-new');
    expect(useChallengeStore.getState().enrollments).toHaveLength(1);
    expect(useChallengeStore.getState().isLoading).toBe(false);
  });

  it('sets error when insert fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Conflict' } }));

    await act(async () => {
      await useChallengeStore.getState().enrollInChallenge('user-123', 'def-1');
    });

    expect(useChallengeStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// logDailyTask
// ---------------------------------------------------------------------------

describe('logDailyTask', () => {
  it('creates a new daily log when no todayLog exists', async () => {
    const newLog = { id: 'log-new', enrollment_id: 'e1', tasks_completed: { task1: true } };
    mockFrom.mockReturnValue(makeChain({ data: newLog, error: null }));

    await act(async () => {
      await useChallengeStore.getState().logDailyTask('e1', 'task1', true);
    });

    expect(useChallengeStore.getState().todayLog?.id).toBe('log-new');
    expect(useChallengeStore.getState().isLoading).toBe(false);
  });

  it('updates existing todayLog', async () => {
    const existingLog = { id: 'log-1', enrollment_id: 'e1', tasks_completed: { task1: false } };
    useChallengeStore.setState({ todayLog: existingLog as never });
    const updatedLog = { id: 'log-1', enrollment_id: 'e1', tasks_completed: { task1: true } };
    mockFrom.mockReturnValue(makeChain({ data: updatedLog, error: null }));

    await act(async () => {
      await useChallengeStore.getState().logDailyTask('e1', 'task1', true);
    });

    expect(useChallengeStore.getState().todayLog?.tasks_completed).toEqual({ task1: true });
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useChallengeStore.getState().logDailyTask('e1', 'task1', true);
    });

    expect(useChallengeStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// completeDailyLog
// ---------------------------------------------------------------------------

describe('completeDailyLog', () => {
  it('marks daily log complete and advances enrollment day', async () => {
    useChallengeStore.setState({
      todayLog: { id: 'log-1' } as never,
      activeEnrollment: { id: 'e1', current_day: 3, longest_streak: 2 } as never,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeChain({ data: { id: 'log-1', all_tasks_completed: true }, error: null });
      return makeChain({ data: { id: 'e1', current_day: 4, longest_streak: 3 }, error: null });
    });

    await act(async () => {
      await useChallengeStore.getState().completeDailyLog('e1');
    });

    expect(useChallengeStore.getState().todayLog?.all_tasks_completed).toBe(true);
    expect(useChallengeStore.getState().isLoading).toBe(false);
  });

  it('sets error when no daily log found', async () => {
    // todayLog is null by default after reset
    await act(async () => {
      await useChallengeStore.getState().completeDailyLog('e1');
    });

    expect(useChallengeStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// abandonChallenge
// ---------------------------------------------------------------------------

describe('abandonChallenge', () => {
  it('sets enrollment status to abandoned and clears active', async () => {
    useChallengeStore.setState({
      activeEnrollment: { id: 'e1' } as never,
      enrollments: [{ id: 'e1', status: 'active' } as never],
    });
    mockFrom.mockReturnValue(makeChain({ data: { id: 'e1', status: 'abandoned' }, error: null }));

    await act(async () => {
      await useChallengeStore.getState().abandonChallenge('e1');
    });

    expect(useChallengeStore.getState().activeEnrollment).toBeNull();
    expect(useChallengeStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getTodayProgress
// ---------------------------------------------------------------------------

describe('getTodayProgress', () => {
  it('returns zeros when no active enrollment', () => {
    const progress = useChallengeStore.getState().getTodayProgress();
    expect(progress).toEqual({ completed: 0, total: 0, percentage: 0 });
  });

  it('returns zeros when no challenge definition found', () => {
    useChallengeStore.setState({
      activeEnrollment: { id: 'e1', challenge_id: 'def-unknown' } as never,
    });
    const progress = useChallengeStore.getState().getTodayProgress();
    expect(progress).toEqual({ completed: 0, total: 0, percentage: 0 });
  });

  it('calculates progress from todayLog tasks', () => {
    useChallengeStore.setState({
      activeEnrollment: { id: 'e1', challenge_id: 'def-1' } as never,
      challengeDefinitions: [
        { id: 'def-1', rules: { tasks: [{ id: 't1' }, { id: 't2' }, { id: 't3' }] } } as never,
      ],
      todayLog: {
        id: 'log-1',
        tasks_completed: { t1: true, t2: false, t3: true, t3_auto: true },
      } as never,
    });

    const progress = useChallengeStore.getState().getTodayProgress();
    expect(progress.completed).toBe(2);
    expect(progress.total).toBe(3);
    expect(progress.percentage).toBe(67);
  });

  it('returns correct progress when no todayLog', () => {
    useChallengeStore.setState({
      activeEnrollment: { id: 'e1', challenge_id: 'def-1' } as never,
      challengeDefinitions: [
        { id: 'def-1', rules: { tasks: [{ id: 't1' }, { id: 't2' }] } } as never,
      ],
      todayLog: null,
    });

    const progress = useChallengeStore.getState().getTodayProgress();
    expect(progress.completed).toBe(0);
    expect(progress.total).toBe(2);
    expect(progress.percentage).toBe(0);
  });
});
