import {
  calculateStreak,
  getStreakHeatmapData,
  isStreakAtRisk,
  getNextStreakMilestone,
} from '../../services/calculations/streaks';
import { format, subDays } from 'date-fns';

function dateStr(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
}

describe('calculateStreak', () => {
  it('returns zero streak for empty data', () => {
    const result = calculateStreak([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.isActiveToday).toBe(false);
    expect(result.streakStartDate).toBeNull();
  });

  it('calculates current streak with consecutive days including today', () => {
    const dates = [dateStr(0), dateStr(1), dateStr(2), dateStr(3)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(4);
    expect(result.isActiveToday).toBe(true);
  });

  it('calculates current streak starting from yesterday (not today)', () => {
    const dates = [dateStr(1), dateStr(2), dateStr(3)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(3);
    expect(result.isActiveToday).toBe(false);
  });

  it('returns zero streak when last activity was 2+ days ago', () => {
    const dates = [dateStr(3), dateStr(4), dateStr(5)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(0);
  });

  it('detects a broken streak with a missed day', () => {
    // Today, yesterday, 2 days ago, then skip 3 days ago, 4 days ago
    const dates = [dateStr(0), dateStr(1), dateStr(2), dateStr(4), dateStr(5)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(3); // only today, yesterday, 2 days ago
  });

  it('calculates longest streak correctly', () => {
    // Old streak of 5 + current streak of 2
    const dates = [
      dateStr(0), dateStr(1), // current: 2
      dateStr(10), dateStr(11), dateStr(12), dateStr(13), dateStr(14), // old: 5
    ];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
  });

  it('handles duplicate dates', () => {
    const dates = [dateStr(0), dateStr(0), dateStr(1), dateStr(1), dateStr(2)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(3);
  });

  it('handles single day (today only)', () => {
    const result = calculateStreak([dateStr(0)]);
    expect(result.currentStreak).toBe(1);
    expect(result.isActiveToday).toBe(true);
  });

  it('handles single day (yesterday only)', () => {
    const result = calculateStreak([dateStr(1)]);
    expect(result.currentStreak).toBe(1);
    expect(result.isActiveToday).toBe(false);
  });

  it('sets streakStartDate correctly', () => {
    const dates = [dateStr(0), dateStr(1), dateStr(2)];
    const result = calculateStreak(dates);
    expect(result.streakStartDate).toBe(dateStr(2));
  });

  it('longest streak equals current streak when current is longest', () => {
    const dates = [dateStr(0), dateStr(1), dateStr(2), dateStr(3), dateStr(4)];
    const result = calculateStreak(dates);
    expect(result.longestStreak).toBe(5);
    expect(result.longestStreak).toBe(result.currentStreak);
  });
});

describe('getStreakHeatmapData', () => {
  it('generates heatmap data for the specified number of days', () => {
    const result = getStreakHeatmapData([], 30);
    expect(result).toHaveLength(30);
  });

  it('defaults to 90 days when not specified', () => {
    const result = getStreakHeatmapData([]);
    expect(result).toHaveLength(90);
  });

  it('marks completed days correctly', () => {
    const dates = [dateStr(0), dateStr(2)];
    const result = getStreakHeatmapData(dates, 7);
    const todayEntry = result.find((d) => d.date === dateStr(0));
    const twoDaysAgoEntry = result.find((d) => d.date === dateStr(2));
    const yesterdayEntry = result.find((d) => d.date === dateStr(1));
    expect(todayEntry?.completed).toBe(true);
    expect(twoDaysAgoEntry?.completed).toBe(true);
    expect(yesterdayEntry?.completed).toBe(false);
  });

  it('counts multiple completions on the same day', () => {
    const dates = [dateStr(0), dateStr(0), dateStr(0)];
    const result = getStreakHeatmapData(dates, 7);
    const todayEntry = result.find((d) => d.date === dateStr(0));
    expect(todayEntry?.count).toBe(3);
  });

  it('returns entries ordered from oldest to newest', () => {
    const result = getStreakHeatmapData([], 7);
    expect(result[0]!.date < result[6]!.date).toBe(true);
  });
});

describe('isStreakAtRisk', () => {
  it('returns true when last completion was yesterday', () => {
    expect(isStreakAtRisk(dateStr(1))).toBe(true);
  });

  it('returns false when last completion was today', () => {
    expect(isStreakAtRisk(dateStr(0))).toBe(false);
  });

  it('returns false when last completion was 2+ days ago (already broken)', () => {
    expect(isStreakAtRisk(dateStr(3))).toBe(false);
  });
});

describe('getNextStreakMilestone', () => {
  it('returns 7 for streak of 3', () => {
    expect(getNextStreakMilestone(3)).toBe(7);
  });

  it('returns 14 for streak of 7', () => {
    expect(getNextStreakMilestone(7)).toBe(14);
  });

  it('returns 30 for streak of 21', () => {
    expect(getNextStreakMilestone(21)).toBe(30);
  });

  it('returns 100 for streak of 75', () => {
    expect(getNextStreakMilestone(75)).toBe(100);
  });

  it('returns 365 for streak of 200', () => {
    expect(getNextStreakMilestone(200)).toBe(365);
  });

  it('returns 1000 for streak of 500', () => {
    expect(getNextStreakMilestone(500)).toBe(1000);
  });

  it('returns currentStreak + 100 when past all milestones', () => {
    expect(getNextStreakMilestone(1000)).toBe(1100);
    expect(getNextStreakMilestone(1500)).toBe(1600);
  });
});
