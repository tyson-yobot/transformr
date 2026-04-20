import { format, subDays } from 'date-fns';
import {
  calculateStreak,
  getStreakHeatmapData,
  isStreakAtRisk,
  getNextStreakMilestone,
} from '../../../services/calculations/streaks';

// Helper to get date strings relative to today
function daysAgo(n: number): string {
  return format(subDays(new Date(), n), 'yyyy-MM-dd');
}

describe('calculateStreak', () => {
  it('returns zeros for empty array', () => {
    const result = calculateStreak([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.isActiveToday).toBe(false);
    expect(result.streakStartDate).toBeNull();
  });

  it('returns streak of 1 for today only', () => {
    const result = calculateStreak([daysAgo(0)]);
    expect(result.currentStreak).toBe(1);
    expect(result.isActiveToday).toBe(true);
  });

  it('returns streak of 1 for yesterday only', () => {
    const result = calculateStreak([daysAgo(1)]);
    expect(result.currentStreak).toBe(1);
    expect(result.isActiveToday).toBe(false);
  });

  it('calculates consecutive streak from today', () => {
    const dates = [daysAgo(0), daysAgo(1), daysAgo(2), daysAgo(3)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(4);
    expect(result.isActiveToday).toBe(true);
  });

  it('resets current streak when gap exists', () => {
    // Today and yesterday, but nothing for 3+ days ago
    // Gap at 2 days ago → streak is only 2
    const dates = [daysAgo(0), daysAgo(1), daysAgo(5), daysAgo(6)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(2);
  });

  it('returns 0 current streak when last date is 2+ days ago', () => {
    const dates = [daysAgo(3), daysAgo(4), daysAgo(5)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(0);
  });

  it('deduplicates dates', () => {
    const dates = [daysAgo(0), daysAgo(0), daysAgo(1)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(2);
  });

  it('tracks longest streak correctly', () => {
    // 5-day streak starting 10 days ago, gap, then 2-day streak
    const dates = [
      daysAgo(0), daysAgo(1),
      daysAgo(10), daysAgo(11), daysAgo(12), daysAgo(13), daysAgo(14),
    ];
    const result = calculateStreak(dates);
    expect(result.longestStreak).toBe(5);
  });
});

describe('getStreakHeatmapData', () => {
  it('returns requested number of days', () => {
    const result = getStreakHeatmapData([], 30);
    expect(result).toHaveLength(30);
  });

  it('defaults to 90 days', () => {
    const result = getStreakHeatmapData([]);
    expect(result).toHaveLength(90);
  });

  it('marks completed dates correctly', () => {
    const today = daysAgo(0);
    const result = getStreakHeatmapData([today], 7);
    const todayEntry = result.find((r) => r.date === today);
    expect(todayEntry?.completed).toBe(true);
    expect(todayEntry?.count).toBe(1);
  });

  it('increments count for multiple completions on same day', () => {
    const today = daysAgo(0);
    const result = getStreakHeatmapData([today, today], 7);
    const todayEntry = result.find((r) => r.date === today);
    expect(todayEntry?.count).toBe(2);
  });
});

describe('isStreakAtRisk', () => {
  it('returns true when last completion was yesterday', () => {
    expect(isStreakAtRisk(daysAgo(1))).toBe(true);
  });

  it('returns false when last completion was today', () => {
    expect(isStreakAtRisk(daysAgo(0))).toBe(false);
  });

  it('returns false when last completion was 2+ days ago (already broken)', () => {
    expect(isStreakAtRisk(daysAgo(3))).toBe(false);
  });
});

describe('getNextStreakMilestone', () => {
  it('returns first milestone (7) when streak < 7', () => {
    expect(getNextStreakMilestone(3)).toBe(7);
  });

  it('returns next milestone after current streak', () => {
    expect(getNextStreakMilestone(7)).toBe(14);
    expect(getNextStreakMilestone(30)).toBe(50);
    expect(getNextStreakMilestone(100)).toBe(150);
  });

  it('returns streak + 100 when above all milestones', () => {
    expect(getNextStreakMilestone(1000)).toBe(1100);
  });
});
