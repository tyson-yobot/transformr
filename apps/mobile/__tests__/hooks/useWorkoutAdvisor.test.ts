import { renderHook, act } from '@testing-library/react-native';
import { useWorkoutAdvisor } from '../../hooks/useWorkoutAdvisor';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetNextSetRecommendation = jest.fn();

jest.mock('../../services/ai/workoutAdvisor', () => ({
  getNextSetRecommendation: (...args: unknown[]) => mockGetNextSetRecommendation(...args),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWorkoutAdvisor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns initial state with null recommendation', () => {
    const { result } = renderHook(() => useWorkoutAdvisor('ex-1', 'Bench Press'));
    expect(result.current.recommendation).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does nothing when completedSets is empty', async () => {
    const { result } = renderHook(() => useWorkoutAdvisor('ex-1', 'Bench Press'));
    await act(async () => {
      await result.current.getRecommendation([], 'strength');
    });
    expect(mockGetNextSetRecommendation).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches recommendation and stores result', async () => {
    const rec = { weight: 135, reps: 8, rpe: 7, rationale: 'Good progress' };
    mockGetNextSetRecommendation.mockResolvedValueOnce(rec);

    const { result } = renderHook(() => useWorkoutAdvisor('ex-1', 'Bench Press'));
    await act(async () => {
      await result.current.getRecommendation(
        [{ weight: 130, reps: 8, rpe: 7 }],
        'strength',
      );
    });

    expect(result.current.recommendation).toEqual(rec);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('passes exerciseId and exerciseName to the service', async () => {
    mockGetNextSetRecommendation.mockResolvedValueOnce({ weight: 100, reps: 10 });

    const { result } = renderHook(() => useWorkoutAdvisor('ex-99', 'Squat'));
    await act(async () => {
      await result.current.getRecommendation(
        [{ weight: 95, reps: 10, rpe: 8 }],
        'hypertrophy',
      );
    });

    expect(mockGetNextSetRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({ exerciseId: 'ex-99', exerciseName: 'Squat', userGoal: 'hypertrophy' }),
    );
  });

  it('sets error when service throws', async () => {
    mockGetNextSetRecommendation.mockRejectedValueOnce(new Error('AI error'));

    const { result } = renderHook(() => useWorkoutAdvisor('ex-1', 'Bench Press'));
    await act(async () => {
      await result.current.getRecommendation([{ weight: 100, reps: 8, rpe: 7 }], 'strength');
    });

    expect(result.current.error).toBe('Failed to get recommendation. Pull to refresh.');
    expect(result.current.isLoading).toBe(false);
  });

  it('clearRecommendation resets recommendation to null', async () => {
    const rec = { weight: 135, reps: 8 };
    mockGetNextSetRecommendation.mockResolvedValueOnce(rec);

    const { result } = renderHook(() => useWorkoutAdvisor('ex-1', 'Bench Press'));
    await act(async () => {
      await result.current.getRecommendation([{ weight: 130, reps: 8, rpe: 6 }], 'strength');
    });
    expect(result.current.recommendation).toEqual(rec);

    act(() => {
      result.current.clearRecommendation();
    });
    expect(result.current.recommendation).toBeNull();
  });
});
