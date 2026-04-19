import { renderHook } from '@testing-library/react-native';
import { useStreaks } from '../../hooks/useStreaks';
import {
  calculateStreak,
  getStreakHeatmapData,
  isStreakAtRisk,
  getNextStreakMilestone,
} from '../../services/calculations/streaks';

jest.mock('../../services/calculations/streaks', () => ({
  calculateStreak: jest.fn().mockReturnValue({ currentStreak: 5, longestStreak: 10, totalDays: 30 }),
  getStreakHeatmapData: jest.fn().mockReturnValue([]),
  isStreakAtRisk: jest.fn().mockReturnValue(false),
  getNextStreakMilestone: jest.fn().mockReturnValue(7),
}));

const mockCalculateStreak = calculateStreak as jest.MockedFunction<typeof calculateStreak>;
const mockGetStreakHeatmapData = getStreakHeatmapData as jest.MockedFunction<typeof getStreakHeatmapData>;
const mockIsStreakAtRisk = isStreakAtRisk as jest.MockedFunction<typeof isStreakAtRisk>;
const mockGetNextStreakMilestone = getNextStreakMilestone as jest.MockedFunction<typeof getNextStreakMilestone>;

describe('useStreaks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateStreak.mockReturnValue({ currentStreak: 5, longestStreak: 10, totalDays: 30 });
    mockGetStreakHeatmapData.mockReturnValue([]);
    mockIsStreakAtRisk.mockReturnValue(false);
    mockGetNextStreakMilestone.mockReturnValue(7);
  });

  it('returns spread streakData fields from calculateStreak', () => {
    const { result } = renderHook(() => useStreaks({ completionDates: ['2026-04-17'] }));
    expect(result.current.currentStreak).toBe(5);
    expect(result.current.longestStreak).toBe(10);
    expect(result.current.totalDays).toBe(30);
  });

  it('returns heatmapData from getStreakHeatmapData', () => {
    mockGetStreakHeatmapData.mockReturnValue([{ date: '2026-04-17', count: 1 }]);
    const { result } = renderHook(() => useStreaks({ completionDates: ['2026-04-17'] }));
    expect(result.current.heatmapData).toEqual([{ date: '2026-04-17', count: 1 }]);
  });

  it('returns atRisk false when completionDates is empty (short-circuit, no isStreakAtRisk call)', () => {
    const { result } = renderHook(() => useStreaks({ completionDates: [] }));
    expect(result.current.atRisk).toBe(false);
    expect(mockIsStreakAtRisk).not.toHaveBeenCalled();
  });

  it('calls isStreakAtRisk with the latest date when completionDates is non-empty', () => {
    mockIsStreakAtRisk.mockReturnValue(true);
    const { result } = renderHook(() =>
      useStreaks({ completionDates: ['2026-04-15', '2026-04-17', '2026-04-16'] }),
    );
    expect(mockIsStreakAtRisk).toHaveBeenCalledWith('2026-04-17');
    expect(result.current.atRisk).toBe(true);
  });

  it('returns nextMilestone from getNextStreakMilestone', () => {
    const { result } = renderHook(() => useStreaks({ completionDates: ['2026-04-17'] }));
    expect(result.current.nextMilestone).toBe(7);
  });

  it('computes daysToMilestone as nextMilestone minus currentStreak', () => {
    // currentStreak=5, nextMilestone=7 → daysToMilestone=2
    const { result } = renderHook(() => useStreaks({ completionDates: ['2026-04-17'] }));
    expect(result.current.daysToMilestone).toBe(2);
  });

  it('reflects updated daysToMilestone when mock values change', () => {
    mockCalculateStreak.mockReturnValue({ currentStreak: 9, longestStreak: 10, totalDays: 30 });
    mockGetNextStreakMilestone.mockReturnValue(10);
    const { result } = renderHook(() => useStreaks({ completionDates: ['2026-04-17'] }));
    expect(result.current.daysToMilestone).toBe(1);
  });
});
