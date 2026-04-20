import { renderHook } from '@testing-library/react-native';
import { useHabits } from '../../hooks/useHabits';
import type { Habit, HabitCompletion } from '../../types/database';

const mockFetchHabits = jest.fn();
let mockUserId: string | null = 'u-1';

jest.mock('../../stores/habitStore', () => ({
  useHabitStore: jest.fn(),
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import { useHabitStore } from '../../stores/habitStore';
import { useAuthStore } from '../../stores/authStore';

const mockedUseHabitStore = useHabitStore as jest.MockedFunction<typeof useHabitStore>;
const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const makeHabit = (overrides: Partial<Habit>): Habit => ({
  id: 'h-1',
  name: 'Test Habit',
  is_active: true,
  ...overrides,
});

const makeCompletion = (overrides: Partial<HabitCompletion>): HabitCompletion => ({
  id: 'c-1',
  habit_id: 'h-1',
  ...overrides,
});

function buildHabitState(habits: Habit[] = [], todayCompletions: HabitCompletion[] = []) {
  return {
    habits,
    todayCompletions,
    allCompletions: [] as HabitCompletion[],
    overallStreak: null as number | null,
    isLoading: false,
    error: null as string | null,
    fetchHabits: mockFetchHabits,
    completeHabit: jest.fn(),
    createHabit: jest.fn(),
    getStreakData: jest.fn(),
    clearError: jest.fn(),
    reset: jest.fn(),
  };
}

function setupMocks(habits: Habit[] = [], todayCompletions: HabitCompletion[] = []) {
  const state = buildHabitState(habits, todayCompletions);
  mockedUseHabitStore.mockImplementation(
    (selector?: (s: ReturnType<typeof buildHabitState>) => unknown) =>
      selector ? selector(state) : state,
  );
  mockedUseAuthStore.mockReturnValue(
    { user: mockUserId ? { id: mockUserId } : null } as ReturnType<typeof useAuthStore>,
  );
}

describe('useHabits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'u-1';
    setupMocks();
  });

  it('calls fetchHabits on mount when user id exists', () => {
    renderHook(() => useHabits());
    expect(mockFetchHabits).toHaveBeenCalledTimes(1);
  });

  it('does NOT call fetchHabits when user is null', () => {
    mockUserId = null;
    setupMocks();
    renderHook(() => useHabits());
    expect(mockFetchHabits).not.toHaveBeenCalled();
  });

  it('todayProgress reflects correct completed/total/percentage', () => {
    const habits = [
      makeHabit({ id: 'h-1', is_active: true }),
      makeHabit({ id: 'h-2', is_active: true }),
    ];
    const completions = [makeCompletion({ id: 'c-1', habit_id: 'h-1' })];
    setupMocks(habits, completions);

    const { result } = renderHook(() => useHabits());
    expect(result.current.todayProgress.total).toBe(2);
    expect(result.current.todayProgress.completed).toBe(1);
    expect(result.current.todayProgress.percentage).toBe(50);
  });

  it('todayProgress is { completed: 0, total: 0, percentage: 0 } when no active habits', () => {
    setupMocks([], []);
    const { result } = renderHook(() => useHabits());
    expect(result.current.todayProgress).toEqual({ completed: 0, total: 0, percentage: 0 });
  });

  it('inactive habits are excluded from todayProgress total', () => {
    const habits = [
      makeHabit({ id: 'h-1', is_active: true }),
      makeHabit({ id: 'h-2', is_active: false }),
    ];
    const completions = [makeCompletion({ id: 'c-1', habit_id: 'h-1' })];
    setupMocks(habits, completions);

    const { result } = renderHook(() => useHabits());
    expect(result.current.todayProgress.total).toBe(1);
    expect(result.current.todayProgress.percentage).toBe(100);
  });

  it('returns store state fields like isLoading and error', () => {
    const { result } = renderHook(() => useHabits());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
