import { renderHook, act } from '@testing-library/react-native';

const mockLogSet = jest.fn().mockResolvedValue(undefined);
const mockStartWorkout = jest.fn();
const mockCompleteWorkout = jest.fn();
const mockFetchTemplates = jest.fn();
const mockFetchExercises = jest.fn();
const mockSetPendingExerciseId = jest.fn();
const mockGetGhostData = jest.fn();
const mockClearError = jest.fn();
const mockReset = jest.fn();

jest.mock('../../stores/workoutStore', () => ({
  useWorkoutStore: jest.fn((selector?: (s: unknown) => unknown) => {
    const mockState = {
      logSet: mockLogSet,
      activeSession: null,
      templates: [],
      isLoading: false,
      error: null,
      startWorkout: mockStartWorkout,
      completeWorkout: mockCompleteWorkout,
      fetchTemplates: mockFetchTemplates,
      fetchExercises: mockFetchExercises,
      exercises: [],
      pendingExerciseId: null,
      setPendingExerciseId: mockSetPendingExerciseId,
      getGhostData: mockGetGhostData,
      clearError: mockClearError,
      reset: mockReset,
    };
    return selector ? selector(mockState) : mockState;
  }),
}));

const mockGetUser = jest.fn().mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });

function makeChain(result: unknown) {
  const chain: Record<string, jest.Mock> = {};
  ['select', 'eq', 'order', 'limit'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation((resolve: (v: unknown) => unknown) =>
    Promise.resolve(result).then(resolve),
  );
  return chain;
}

const mockFrom = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const mockDetectPRs = jest.fn().mockReturnValue([]);
jest.mock('../../services/calculations/prDetection', () => ({
  detectPRs: (...args: unknown[]) => mockDetectPRs(...args),
}));

const mockHapticPR = jest.fn().mockResolvedValue(undefined);
jest.mock('../../utils/haptics', () => ({
  hapticPR: (...args: unknown[]) => mockHapticPR(...args),
}));

import { useWorkout } from '../../hooks/useWorkout';

describe('useWorkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    mockDetectPRs.mockReturnValue([]);
    mockLogSet.mockResolvedValue(undefined);
    mockHapticPR.mockResolvedValue(undefined);
    mockFrom.mockReturnValue(makeChain({ data: [] }));
  });

  it('returns all store properties plus logSetWithPRDetection', () => {
    const { result } = renderHook(() => useWorkout());
    expect(typeof result.current.logSet).toBe('function');
    expect(typeof result.current.logSetWithPRDetection).toBe('function');
    expect(result.current.activeSession).toBeNull();
    expect(result.current.templates).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.exercises).toEqual([]);
  });

  it('logSetWithPRDetection calls logSet with correct args', async () => {
    const { result } = renderHook(() => useWorkout());
    const setData = { weight: 100, reps: 5 };

    await act(async () => {
      await result.current.logSetWithPRDetection('ex-1', setData);
    });

    expect(mockLogSet).toHaveBeenCalledWith('ex-1', setData);
  });

  it('logSetWithPRDetection returns isPR false when no PRs detected', async () => {
    mockDetectPRs.mockReturnValue([]);
    const { result } = renderHook(() => useWorkout());

    let outcome: { prs: unknown[]; isPR: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.logSetWithPRDetection('ex-1', { weight: 80, reps: 8 });
    });

    expect(outcome?.isPR).toBe(false);
    expect(outcome?.prs).toEqual([]);
    expect(mockHapticPR).not.toHaveBeenCalled();
  });

  it('logSetWithPRDetection calls hapticPR and returns isPR true when PRs detected', async () => {
    const fakePR = { type: 'weight', value: 100 };
    mockDetectPRs.mockReturnValue([fakePR]);
    const { result } = renderHook(() => useWorkout());

    let outcome: { prs: unknown[]; isPR: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.logSetWithPRDetection('ex-1', { weight: 100, reps: 5 });
    });

    expect(mockHapticPR).toHaveBeenCalledTimes(1);
    expect(outcome?.isPR).toBe(true);
    expect(outcome?.prs).toEqual([fakePR]);
  });

  it('logSetWithPRDetection fetches PRs from supabase when user exists', async () => {
    const { result } = renderHook(() => useWorkout());

    await act(async () => {
      await result.current.logSetWithPRDetection('ex-1', { weight: 75, reps: 10 });
    });

    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('personal_records');
  });
});
