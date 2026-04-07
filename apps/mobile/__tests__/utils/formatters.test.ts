import {
  formatNumber,
  formatWeight,
  formatCalories,
  formatMacro,
  formatCurrency,
  formatCurrencyDetailed,
  formatPercentage,
  formatCompactNumber,
  formatDuration,
  formatTimerDisplay,
  formatRestTimer,
  formatDate,
  formatDateShort,
  formatTime,
  formatDayOfWeek,
  formatRelativeTime,
  formatCountdown,
  formatVolume,
  formatSetDisplay,
  formatOz,
  getGradeColor,
  ordinal,
} from '../../utils/formatters';

describe('formatNumber', () => {
  it('formats integers with no decimals by default', () => {
    expect(formatNumber(1234)).toBe('1,234');
  });

  it('formats with specified decimal places', () => {
    expect(formatNumber(1234.567, 2)).toBe('1,234.57');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatWeight', () => {
  it('formats weight with one decimal and lbs suffix', () => {
    expect(formatWeight(185)).toBe('185.0 lbs');
  });

  it('formats decimal weight', () => {
    expect(formatWeight(185.5)).toBe('185.5 lbs');
  });

  it('formats large weight with comma', () => {
    expect(formatWeight(1200)).toBe('1,200.0 lbs');
  });
});

describe('formatCalories', () => {
  it('formats calories with cal suffix', () => {
    expect(formatCalories(2500)).toBe('2,500 cal');
  });

  it('rounds decimal calories', () => {
    expect(formatCalories(2500.7)).toBe('2,501 cal');
  });

  it('formats zero calories', () => {
    expect(formatCalories(0)).toBe('0 cal');
  });
});

describe('formatMacro', () => {
  it('formats grams with one decimal and g suffix', () => {
    expect(formatMacro(180)).toBe('180.0g');
  });

  it('formats decimal grams', () => {
    expect(formatMacro(23.5)).toBe('23.5g');
  });
});

describe('formatCurrency', () => {
  it('formats as USD with no decimals', () => {
    expect(formatCurrency(50)).toBe('$50');
  });

  it('formats large amounts with commas', () => {
    expect(formatCurrency(1500)).toBe('$1,500');
  });
});

describe('formatCurrencyDetailed', () => {
  it('formats with decimal cents', () => {
    const result = formatCurrencyDetailed(49.99);
    expect(result).toBe('$49.99');
  });
});

describe('formatPercentage', () => {
  it('formats percentage with % suffix', () => {
    expect(formatPercentage(75)).toBe('75%');
  });

  it('formats with decimals', () => {
    expect(formatPercentage(75.5, 1)).toBe('75.5%');
  });
});

describe('formatCompactNumber', () => {
  it('formats millions with M suffix', () => {
    expect(formatCompactNumber(1500000)).toBe('1.5M');
  });

  it('formats thousands with K suffix', () => {
    expect(formatCompactNumber(2500)).toBe('2.5K');
  });

  it('formats small numbers without suffix', () => {
    expect(formatCompactNumber(500)).toBe('500');
  });

  it('formats exact million', () => {
    expect(formatCompactNumber(1000000)).toBe('1.0M');
  });

  it('formats exact thousand', () => {
    expect(formatCompactNumber(1000)).toBe('1.0K');
  });
});

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('formats hours only', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('formats zero minutes', () => {
    expect(formatDuration(0)).toBe('0m');
  });
});

describe('formatTimerDisplay', () => {
  it('formats seconds as MM:SS with padding', () => {
    expect(formatTimerDisplay(65)).toBe('01:05');
  });

  it('formats zero', () => {
    expect(formatTimerDisplay(0)).toBe('00:00');
  });

  it('formats large times', () => {
    expect(formatTimerDisplay(600)).toBe('10:00');
  });
});

describe('formatRestTimer', () => {
  it('formats rest timer as M:SS', () => {
    expect(formatRestTimer(90)).toBe('1:30');
  });

  it('returns 0:00 for zero or negative', () => {
    expect(formatRestTimer(0)).toBe('0:00');
    expect(formatRestTimer(-5)).toBe('0:00');
  });
});

describe('formatDate', () => {
  it('formats ISO date string to readable date', () => {
    expect(formatDate('2025-03-15')).toBe('Mar 15, 2025');
  });

  it('formats another date', () => {
    expect(formatDate('2024-12-25')).toBe('Dec 25, 2024');
  });
});

describe('formatDateShort', () => {
  it('formats short date without year', () => {
    expect(formatDateShort('2025-03-15')).toBe('Mar 15');
  });
});

describe('formatRelativeTime', () => {
  it('returns a string containing "ago" for past dates', () => {
    const result = formatRelativeTime('2020-01-01T00:00:00Z');
    expect(result).toContain('ago');
  });
});

describe('formatCountdown', () => {
  it('returns "Today!" for today\'s date', () => {
    const today = new Date().toISOString().split('T')[0]!;
    const result = formatCountdown(today);
    expect(result.days).toBe(0);
    expect(result.label).toBe('Today!');
  });

  it('returns "days ago" for past dates', () => {
    const result = formatCountdown('2020-01-01');
    expect(result.label).toBe('days ago');
    expect(result.days).toBeGreaterThan(0);
  });

  it('returns "day left" for 1 day in future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]!;
    const result = formatCountdown(tomorrowStr);
    expect(result.days).toBe(1);
    expect(result.label).toBe('day left');
  });

  it('returns "days left" for multiple days in future', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const futureStr = future.toISOString().split('T')[0]!;
    const result = formatCountdown(futureStr);
    expect(result.days).toBe(10);
    expect(result.label).toBe('days left');
  });
});

describe('formatVolume', () => {
  it('formats volume over 1000 with K suffix', () => {
    expect(formatVolume(5000)).toBe('5.0K lbs');
  });

  it('formats volume under 1000 normally', () => {
    expect(formatVolume(750)).toBe('750 lbs');
  });
});

describe('formatSetDisplay', () => {
  it('formats weight x reps', () => {
    expect(formatSetDisplay(225, 8)).toContain('225');
    expect(formatSetDisplay(225, 8)).toContain('8');
  });
});

describe('formatOz', () => {
  it('formats ounces', () => {
    expect(formatOz(64)).toBe('64 oz');
  });
});

describe('getGradeColor', () => {
  it('returns green for A grades', () => {
    expect(getGradeColor('A+')).toBe('#22C55E');
    expect(getGradeColor('A')).toBe('#22C55E');
  });

  it('returns blue for B grades', () => {
    expect(getGradeColor('B')).toBe('#3B82F6');
  });

  it('returns default for unknown grade', () => {
    expect(getGradeColor('Z')).toBe('#94A3B8');
  });
});

describe('ordinal', () => {
  it('handles 1st', () => {
    expect(ordinal(1)).toBe('1st');
  });

  it('handles 2nd', () => {
    expect(ordinal(2)).toBe('2nd');
  });

  it('handles 3rd', () => {
    expect(ordinal(3)).toBe('3rd');
  });

  it('handles 4th', () => {
    expect(ordinal(4)).toBe('4th');
  });

  it('handles 11th (special case)', () => {
    expect(ordinal(11)).toBe('11th');
  });

  it('handles 12th (special case)', () => {
    expect(ordinal(12)).toBe('12th');
  });

  it('handles 13th (special case)', () => {
    expect(ordinal(13)).toBe('13th');
  });

  it('handles 21st', () => {
    expect(ordinal(21)).toBe('21st');
  });

  it('handles 22nd', () => {
    expect(ordinal(22)).toBe('22nd');
  });

  it('handles 100th', () => {
    expect(ordinal(100)).toBe('100th');
  });
});
