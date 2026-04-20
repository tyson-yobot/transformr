import { act } from '@testing-library/react-native';
import { useGoalStore } from '../../stores/goalStore';

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
  ['select', 'eq', 'in', 'order', 'insert', 'update', 'upsert', 'single', 'maybeSingle'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  useGoalStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has empty goals', () => {
    expect(useGoalStore.getState().goals).toHaveLength(0);
  });

  it('has empty milestones', () => {
    expect(useGoalStore.getState().milestones).toHaveLength(0);
  });

  it('is not loading', () => {
    expect(useGoalStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearError / reset
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useGoalStore.setState({ error: 'Oops' });
    useGoalStore.getState().clearError();
    expect(useGoalStore.getState().error).toBeNull();
  });
});

describe('reset', () => {
  it('resets all fields', () => {
    useGoalStore.setState({ goals: [{ id: '1' } as never], isLoading: true, error: 'err' });
    useGoalStore.getState().reset();
    expect(useGoalStore.getState().goals).toHaveLength(0);
    expect(useGoalStore.getState().isLoading).toBe(false);
    expect(useGoalStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchGoals
// ---------------------------------------------------------------------------

describe('fetchGoals', () => {
  it('fetches goals and milestones', async () => {
    const mockGoal = { id: 'goal-1', user_id: 'user-123', title: 'Lose weight', status: 'active' };
    const mockMilestone = { id: 'ms-1', goal_id: 'goal-1', title: 'Milestone 1' };

    // First call: goals table, second call: milestones table
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeChain({ data: [mockGoal], error: null });
      return makeChain({ data: [mockMilestone], error: null });
    });

    await act(async () => {
      await useGoalStore.getState().fetchGoals();
    });

    expect(useGoalStore.getState().goals).toHaveLength(1);
    expect(useGoalStore.getState().milestones).toHaveLength(1);
    expect(useGoalStore.getState().isLoading).toBe(false);
  });

  it('fetches goals with no milestones (empty goal ids)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));

    await act(async () => {
      await useGoalStore.getState().fetchGoals();
    });

    expect(useGoalStore.getState().goals).toHaveLength(0);
    expect(useGoalStore.getState().milestones).toHaveLength(0);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useGoalStore.getState().fetchGoals();
    });

    expect(useGoalStore.getState().error).toBe('Not authenticated');
  });

  it('sets error when query fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }));

    await act(async () => {
      await useGoalStore.getState().fetchGoals();
    });

    expect(useGoalStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// createGoal
// ---------------------------------------------------------------------------

describe('createGoal', () => {
  it('inserts a new goal and adds to state', async () => {
    const newGoal = { id: 'goal-new', user_id: 'user-123', title: 'Run 5k', status: 'active' };
    mockFrom.mockReturnValue(makeChain({ data: newGoal, error: null }));

    await act(async () => {
      await useGoalStore.getState().createGoal({ title: 'Run 5k' });
    });

    expect(useGoalStore.getState().goals).toHaveLength(1);
    expect(useGoalStore.getState().goals[0]?.title).toBe('Run 5k');
    expect(useGoalStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useGoalStore.getState().createGoal({ title: 'Test' });
    });

    expect(useGoalStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// updateGoal
// ---------------------------------------------------------------------------

describe('updateGoal', () => {
  it('updates a goal in state', async () => {
    const existingGoal = { id: 'goal-1', user_id: 'user-123', title: 'Old title', status: 'active' };
    const updatedGoal = { ...existingGoal, title: 'New title' };
    useGoalStore.setState({ goals: [existingGoal as never] });
    mockFrom.mockReturnValue(makeChain({ data: updatedGoal, error: null }));

    await act(async () => {
      await useGoalStore.getState().updateGoal('goal-1', { title: 'New title' });
    });

    expect(useGoalStore.getState().goals[0]?.title).toBe('New title');
  });

  it('sets error when query fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update failed' } }));

    await act(async () => {
      await useGoalStore.getState().updateGoal('goal-1', { title: 'X' });
    });

    expect(useGoalStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// updateGoalProgress
// ---------------------------------------------------------------------------

describe('updateGoalProgress', () => {
  it('updates goal progress', async () => {
    const goal = { id: 'goal-1', user_id: 'user-123', title: 'Run 5k', current_value: 0 };
    const updated = { ...goal, current_value: 2.5 };
    useGoalStore.setState({ goals: [goal as never] });
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }));

    await act(async () => {
      await useGoalStore.getState().updateGoalProgress('goal-1', 2.5);
    });

    expect(useGoalStore.getState().goals[0]?.current_value).toBe(2.5);
  });
});
