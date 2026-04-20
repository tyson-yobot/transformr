import { renderHook } from '@testing-library/react-native';
import { useReadiness } from '../../hooks/useReadiness';
import { calculateReadinessScore, getReadinessEmoji } from '../../services/calculations/readiness';

jest.mock('../../services/calculations/readiness', () => ({
  calculateReadinessScore: jest.fn().mockReturnValue({ score: 75, label: 'good', recommendation: 'Train' }),
  getReadinessEmoji: jest.fn().mockReturnValue('💪'),
}));

const mockCalculateReadinessScore = calculateReadinessScore as jest.MockedFunction<typeof calculateReadinessScore>;
const mockGetReadinessEmoji = getReadinessEmoji as jest.MockedFunction<typeof getReadinessEmoji>;

const baseInput = {
  sleepHours: 8,
  sleepQuality: 4,
  moodScore: 4,
  stressLevel: 2,
  energyLevel: 4,
  sorenessLevel: 2,
  workoutsLast3Days: 2,
  totalVolumeLast3Days: 10000,
  avgVolumePer3Days: 9000,
};

describe('useReadiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateReadinessScore.mockReturnValue({ score: 75, label: 'good', recommendation: 'Train' });
    mockGetReadinessEmoji.mockReturnValue('💪');
  });

  it('returns score, label, and recommendation from calculateReadinessScore', () => {
    const { result } = renderHook(() => useReadiness(baseInput));
    expect(result.current.score).toBe(75);
    expect(result.current.label).toBe('good');
    expect(result.current.recommendation).toBe('Train');
  });

  it('returns emoji from getReadinessEmoji', () => {
    const { result } = renderHook(() => useReadiness(baseInput));
    expect(result.current.emoji).toBe('💪');
  });

  it('calls calculateReadinessScore with the provided input values', () => {
    renderHook(() => useReadiness(baseInput));
    expect(mockCalculateReadinessScore).toHaveBeenCalledWith(expect.objectContaining({
      sleepHours: 8,
      sleepQuality: 4,
      moodScore: 4,
    }));
  });

  it('re-computes when input changes and calls the delegate again', () => {
    const { rerender } = renderHook(
      ({ input }: { input: typeof baseInput }) => useReadiness(input),
      { initialProps: { input: baseInput } },
    );

    expect(mockCalculateReadinessScore).toHaveBeenCalledTimes(1);

    rerender({ input: { ...baseInput, sleepHours: 6 } });

    expect(mockCalculateReadinessScore).toHaveBeenCalledTimes(2);
    expect(mockCalculateReadinessScore).toHaveBeenLastCalledWith(expect.objectContaining({ sleepHours: 6 }));
  });

  it('handles null inputs by still calling the delegate and returning its result', () => {
    const nullInput = {
      sleepHours: null,
      sleepQuality: null,
      moodScore: null,
      stressLevel: null,
      energyLevel: null,
      sorenessLevel: null,
      workoutsLast3Days: 0,
      totalVolumeLast3Days: 0,
      avgVolumePer3Days: 0,
    };

    const { result } = renderHook(() => useReadiness(nullInput));
    expect(mockCalculateReadinessScore).toHaveBeenCalled();
    expect(result.current.score).toBe(75);
  });
});
