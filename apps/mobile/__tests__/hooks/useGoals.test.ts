import { renderHook } from '@testing-library/react-native';
import { useGoals } from '../../hooks/useGoals';
import type { Goal } from '../../types/database';

// mock* prefix variables are permitted inside jest.mock factories
const mockFetchGoals = jest.fn();
let mockUserId: string | null = 'u-1';

jest.mock('../../stores/goalStore', () => ({
  useGoalStore: jest.fn(),
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import { useGoalStore } from '../../stores/goalStore';
import { useAuthStore } from '../../stores/authStore';

const mockedUseGoalStore = useGoalStore as jest.MockedFunction<typeof useGoalStore>;
const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

const makeGoal = (overrides: Partial<Goal> & { status: GoalStatus; category: Goal['category'] }): Goal =>
  ({
    id: 'g-1',
    user_id: 'u-1',
    title: 'Test Goal',
    description: null,
    category: 'fitness',
    goal_type: null,
    target_value: null,
    current_value: null,
    unit: null,
    start_date: null,
    target_date: null,
    completed_date: null,
    priority: 0,
    color: null,
    icon: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Goal);

const BASE_GOALS: Goal[] = [
  makeGoal({ id: 'g-1', status: 'active', category: 'fitness' }),
  makeGoal({ id: 'g-2', status: 'active', category: 'fitness' }),
  makeGoal({ id: 'g-3', status: 'completed', category: 'business' }),
  makeGoal({ id: 'g-4', status: 'active', category: 'business' }),
];

function buildGoalState(goals: Goal[] = BASE_GOALS) {
  return {
    goals,
    milestones: [] as never[],
    isLoading: false,
    error: null,
    fetchGoals: mockFetchGoals,
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    updateGoalProgress: jest.fn(),
    clearError: jest.fn(),
    reset: jest.fn(),
  };
}

function setupMocks(goals: Goal[] = BASE_GOALS) {
  const state = buildGoalState(goals);
  mockedUseGoalStore.mockImplementation(
    (selector?: (s: ReturnType<typeof buildGoalState>) => unknown) =>
      selector ? selector(state) : state,
  );
  mockedUseAuthStore.mockReturnValue(
    { user: mockUserId ? { id: mockUserId } : null } as ReturnType<typeof useAuthStore>,
  );
}

describe('useGoals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'u-1';
    setupMocks();
  });

  it('calls fetchGoals on mount when user id exists', () => {
    renderHook(() => useGoals());
    expect(mockFetchGoals).toHaveBeenCalledTimes(1);
  });

  it('does NOT call fetchGoals when user is null', () => {
    mockUserId = null;
    setupMocks();
    renderHook(() => useGoals());
    expect(mockFetchGoals).not.toHaveBeenCalled();
  });

  it('activeGoals contains only goals with status "active"', () => {
    const { result } = renderHook(() => useGoals());
    expect(result.current.activeGoals).toHaveLength(3);
    for (const goal of result.current.activeGoals) {
      expect(goal.status).toBe('active');
    }
  });

  it('goalsByCategory groups active goals by their category', () => {
    const { result } = renderHook(() => useGoals());
    expect(result.current.goalsByCategory['fitness']).toHaveLength(2);
    expect(result.current.goalsByCategory['business']).toHaveLength(1);
    expect(result.current.goalsByCategory['business']?.every((g) => g.status === 'active')).toBe(true);
  });

  it('returns store properties including isLoading and error', () => {
    const { result } = renderHook(() => useGoals());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('goals without a category fall back to "personal" in goalsByCategory', () => {
    const goalWithNoCategory = makeGoal({ id: 'g-5', status: 'active', category: undefined });
    setupMocks([...BASE_GOALS, goalWithNoCategory]);

    const { result } = renderHook(() => useGoals());
    expect(result.current.goalsByCategory['personal']).toBeDefined();
    expect(result.current.goalsByCategory['personal']).toHaveLength(1);
  });
});
