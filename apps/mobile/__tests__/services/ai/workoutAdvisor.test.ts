// ---------------------------------------------------------------------------
// Mocks — before import
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn();
const mockInvoke = jest.fn();

jest.mock('../../../services/supabase', () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}));

jest.mock('../../../services/ai/context', () => ({
  buildUserAIContext: jest.fn().mockResolvedValue(null),
}));

import { getNextSetRecommendation } from '../../../services/ai/workoutAdvisor';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const mockRecommendation = {
  recommendedWeight: 225,
  recommendedReps: 5,
  recommendedRpe: 8,
  rationale: 'Based on your recent sets, 225 lbs for 5 reps is optimal.',
};

const params = {
  exerciseId: 'squat',
  exerciseName: 'Back Squat',
  completedSets: [{ weight: 205, reps: 5, rpe: 7 }],
  userGoal: 'strength' as const,
};

describe('getNextSetRecommendation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    mockInvoke.mockResolvedValue({ data: mockRecommendation, error: null });
  });

  it('calls ai-workout-advisor edge function with correct params', async () => {
    await getNextSetRecommendation(params);
    expect(mockInvoke).toHaveBeenCalledWith('ai-workout-advisor', expect.objectContaining({
      body: expect.objectContaining({
        userId: 'u-1',
        exerciseId: 'squat',
        exerciseName: 'Back Squat',
        userGoal: 'strength',
      }),
    }));
  });

  it('returns recommendation from edge function', async () => {
    const result = await getNextSetRecommendation(params);
    expect(result.recommendedWeight).toBe(225);
    expect(result.recommendedReps).toBe(5);
    expect(result.recommendedRpe).toBe(8);
    expect(typeof result.rationale).toBe('string');
  });

  it('throws when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(getNextSetRecommendation(params)).rejects.toThrow('authenticated');
  });

  it('throws when edge function returns error', async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'Function error' } });
    await expect(getNextSetRecommendation(params)).rejects.toBeTruthy();
  });

  it('throws when response contains error field', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { error: 'AI service unavailable' },
      error: null,
    });
    await expect(getNextSetRecommendation(params)).rejects.toThrow('AI service unavailable');
  });

  it('includes completedSets in the request body', async () => {
    await getNextSetRecommendation(params);
    const body = mockInvoke.mock.calls[0][1].body;
    expect(body.completedSets).toEqual([{ weight: 205, reps: 5, rpe: 7 }]);
  });
});
