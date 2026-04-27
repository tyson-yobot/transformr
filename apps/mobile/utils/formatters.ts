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
  return gradeColors[grade] ?? '#9B8FC0';
}

// Currency input formatting — auto-inserts commas as the user types whole-dollar amounts
export function formatCurrencyInput(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length === 0) return '';
  return Number(digits).toLocaleString('en-US');
}

// Strips commas from a formatted currency string to get the raw numeric value
export function parseCurrencyInput(formatted: string): string {
  return formatted.replace(/,/g, '');
}

// Date input formatting — auto-inserts / as the user types MM/DD/YYYY
export function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').substring(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Auto-formats time input as HH:MM — strips non-digits, inserts colon after 2 digits
export function formatTimeInput(text: string): string {
  const digits = text.replace(/\D/g, '').substring(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

// Converts 24-hour HH:MM to 12-hour h:MM AM/PM display
export function to12Hour(time24: string): string {
  const match = time24.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time24;
  let hours = parseInt(match[1] ?? '0', 10);
  const minutes = match[2] ?? '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${minutes} ${ampm}`;
}

// Converts 12-hour h:MM AM/PM to 24-hour HH:MM for storage
export function to24Hour(time12: string): string {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12;
  let hours = parseInt(match[1] ?? '0', 10);
  const minutes = match[2] ?? '00';
  const period = (match[3] ?? 'AM').toUpperCase();
  if (period === 'AM' && hours === 12) hours = 0;
  else if (period === 'PM' && hours !== 12) hours += 12;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
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
