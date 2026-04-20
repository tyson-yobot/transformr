import { renderHook, act } from '@testing-library/react-native';
import { useChallenges } from '../../hooks/useChallenges';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchChallengeDefinitions = jest.fn();
const mockFetchEnrollments = jest.fn();
const mockFetchActiveEnrollment = jest.fn();
const mockEnrollInChallenge = jest.fn();

const mockChallengeState = {
  challengeDefinitions: [] as { id: string; duration_days: number }[],
  activeEnrollment: null as { id: string; challenge_id: string; current_day: number; status: string; longest_streak?: number; restart_count?: number } | null,
  enrollments: [] as { id: string; status: string }[],
  dailyLogs: [],
  todayLog: null as { id: string; tasks_completed: Record<string, boolean> } | null,
  isLoading: false,
  error: null,
  fetchChallengeDefinitions: mockFetchChallengeDefinitions,
  fetchEnrollments: mockFetchEnrollments,
  fetchActiveEnrollment: mockFetchActiveEnrollment,
  enrollInChallenge: mockEnrollInChallenge,
  logDailyTask: jest.fn(),
  completeDailyLog: jest.fn(),
  abandonChallenge: jest.fn(),
  restartChallenge: jest.fn(),
  createCustomChallenge: jest.fn(),
  getTodayProgress: jest.fn(),
  clearError: jest.fn(),
  reset: jest.fn(),
};

jest.mock('../../stores/challengeStore', () => ({
  useChallengeStore: jest.fn((selector?: (s: typeof mockChallengeState) => unknown) =>
    selector ? selector(mockChallengeState) : mockChallengeState,
  ),
}));

const mockAuthState = { user: { id: 'u-1' } };
jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (s: typeof mockAuthState) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState,
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useChallenges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChallengeState.challengeDefinitions = [];
    mockChallengeState.activeEnrollment = null;
    mockChallengeState.enrollments = [];
    mockChallengeState.todayLog = null;
  });

  it('calls fetchChallengeDefinitions on mount', () => {
    renderHook(() => useChallenges());
    expect(mockFetchChallengeDefinitions).toHaveBeenCalledTimes(1);
  });

  it('calls fetchEnrollments and fetchActiveEnrollment when user exists', () => {
    renderHook(() => useChallenges());
    expect(mockFetchEnrollments).toHaveBeenCalledWith('u-1');
    expect(mockFetchActiveEnrollment).toHaveBeenCalledWith('u-1');
  });

  it('todayProgress is zeros when no todayLog', () => {
    const { result } = renderHook(() => useChallenges());
    expect(result.current.todayProgress).toEqual({ completed: 0, total: 0, percentage: 0 });
  });

  it('todayProgress computed from todayLog tasks', () => {
    mockChallengeState.todayLog = {
      id: 'log-1',
      tasks_completed: { t1: true, t2: false, t3: true },
    };
    const { result } = renderHook(() => useChallenges());
    expect(result.current.todayProgress.completed).toBe(2);
    expect(result.current.todayProgress.total).toBe(3);
    expect(result.current.todayProgress.percentage).toBe(67);
  });

  it('challengeProgress is null when no activeEnrollment', () => {
    const { result } = renderHook(() => useChallenges());
    expect(result.current.challengeProgress).toBeNull();
  });

  it('challengeProgress computed from activeEnrollment and definition', () => {
    mockChallengeState.activeEnrollment = { id: 'e1', challenge_id: 'def-1', current_day: 10, status: 'active' };
    mockChallengeState.challengeDefinitions = [{ id: 'def-1', duration_days: 30 }];
    const { result } = renderHook(() => useChallenges());
    expect(result.current.challengeProgress?.currentDay).toBe(10);
    expect(result.current.challengeProgress?.totalDays).toBe(30);
    expect(result.current.challengeProgress?.daysRemaining).toBe(20);
  });

  it('activeChallenge is null when no activeEnrollment', () => {
    const { result } = renderHook(() => useChallenges());
    expect(result.current.activeChallenge).toBeNull();
  });

  it('activeChallenge resolved from challengeDefinitions', () => {
    mockChallengeState.activeEnrollment = { id: 'e1', challenge_id: 'def-1', current_day: 5, status: 'active' };
    mockChallengeState.challengeDefinitions = [{ id: 'def-1', duration_days: 30 }];
    const { result } = renderHook(() => useChallenges());
    expect(result.current.activeChallenge?.id).toBe('def-1');
  });

  it('completedChallenges filters enrollments by status', () => {
    mockChallengeState.enrollments = [
      { id: 'e1', status: 'completed' },
      { id: 'e2', status: 'active' },
      { id: 'e3', status: 'completed' },
    ];
    const { result } = renderHook(() => useChallenges());
    expect(result.current.completedChallenges).toHaveLength(2);
  });

  it('enrollInChallenge calls store with user id', async () => {
    const { result } = renderHook(() => useChallenges());
    await act(async () => {
      await result.current.enrollInChallenge('def-1', {});
    });
    expect(mockEnrollInChallenge).toHaveBeenCalledWith('u-1', 'def-1', {});
  });
});
