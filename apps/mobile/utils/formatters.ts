import { format, formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';

// Number formatting
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatWeight(lbs: number): string {
  return `${formatNumber(lbs, 1)} lbs`;
}

export function formatCalories(cal: number): string {
  return `${formatNumber(Math.round(cal))} cal`;
}

export function formatMacro(grams: number): string {
  return `${formatNumber(grams, 1)}g`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDetailed(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatPercentage(value: number, decimals = 0): string {
  return `${formatNumber(value, decimals)}%`;
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return formatNumber(value);
}

// Duration formatting
export function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatRestTimer(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Date formatting
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), 'h:mm a');
}

export function formatDayOfWeek(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE');
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function formatCountdown(targetDate: string): { days: number; label: string } {
  const days = differenceInDays(parseISO(targetDate), new Date());
  if (days < 0) return { days: Math.abs(days), label: 'days ago' };
  if (days === 0) return { days: 0, label: 'Today!' };
  if (days === 1) return { days: 1, label: 'day left' };
  return { days, label: 'days left' };
}

// Workout formatting
export function formatVolume(totalVolume: number): string {
  if (totalVolume >= 1000) {
    return `${(totalVolume / 1000).toFixed(1)}K lbs`;
  }
  return `${formatNumber(totalVolume)} lbs`;
}

export function formatSetDisplay(weight: number, reps: number): string {
  return `${formatNumber(weight)} × ${reps}`;
}

export function formatOz(oz: number): string {
  return `${formatNumber(oz)} oz`;
}

// Grade formatting
export function getGradeColor(grade: string): string {
  const gradeColors: Record<string, string> = {
    'A+': '#10B981', A: '#10B981',
    'B+': '#3B82F6', B: '#3B82F6',
    'C+': '#F59E0B', C: '#F59E0B',
    'D+': '#F97316', D: '#F97316',
    F: '#EF4444',
  };
  return gradeColors[grade] ?? '#94A3B8';
}

// Date input formatting — auto-inserts / as the user types MM/DD/YYYY
export function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').substring(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Converts MM/DD/YYYY display value to YYYY-MM-DD for database storage
export function dateInputToISO(formatted: string): string {
  const match = formatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  const [, mm, dd, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

// Converts YYYY-MM-DD ISO date to MM/DD/YYYY for display in inputs
export function isoToDateInput(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const [, yyyy, mm, dd] = match;
  return `${mm}/${dd}/${yyyy}`;
}

// Ordinal suffix
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th');
}
