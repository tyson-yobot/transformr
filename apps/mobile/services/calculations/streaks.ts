// Streak calculation logic

import { differenceInCalendarDays, subDays, format, parseISO, startOfDay } from 'date-fns';

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  streakStartDate: string | null;
}

export function calculateStreak(completionDates: string[]): StreakResult {
  if (completionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, isActiveToday: false, streakStartDate: null };
  }

  // Deduplicate and sort dates descending
  const uniqueDates = [...new Set(
    completionDates.map((d) => format(startOfDay(parseISO(d)), 'yyyy-MM-dd'))
  )].sort().reverse();

  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const yesterday = format(subDays(startOfDay(new Date()), 1), 'yyyy-MM-dd');

  const isActiveToday = uniqueDates[0] === today;

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = isActiveToday ? today : yesterday;

  for (const date of uniqueDates) {
    if (date === checkDate) {
      currentStreak++;
      checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
    } else if (date < checkDate) {
      break;
    }
  }

  // If streak doesn't include today or yesterday, it's broken
  if (!isActiveToday && uniqueDates[0] !== yesterday) {
    currentStreak = 0;
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  const sortedAsc = [...uniqueDates].reverse();

  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = sortedAsc[i - 1]!;
    const curr = sortedAsc[i]!;
    const diff = differenceInCalendarDays(parseISO(curr), parseISO(prev));

    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  const streakStartDate = currentStreak > 0
    ? format(subDays(startOfDay(new Date()), currentStreak - (isActiveToday ? 0 : 1)), 'yyyy-MM-dd')
    : null;

  return { currentStreak, longestStreak, isActiveToday, streakStartDate };
}

export function getStreakHeatmapData(
  completionDates: string[],
  days: number = 90,
): Array<{ date: string; completed: boolean; count: number }> {
  const dateMap = new Map<string, number>();
  for (const d of completionDates) {
    const key = format(startOfDay(parseISO(d)), 'yyyy-MM-dd');
    dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
  }

  const result: Array<{ date: string; completed: boolean; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const count = dateMap.get(date) ?? 0;
    result.push({ date, completed: count > 0, count });
  }
  return result;
}

export function isStreakAtRisk(lastCompletionDate: string): boolean {
  const last = startOfDay(parseISO(lastCompletionDate));
  const today = startOfDay(new Date());
  return differenceInCalendarDays(today, last) === 1;
}

export function getNextStreakMilestone(currentStreak: number): number {
  const milestones = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365, 500, 1000];
  return milestones.find((m) => m > currentStreak) ?? currentStreak + 100;
}
