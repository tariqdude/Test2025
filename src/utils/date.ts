import { logger } from './logger';

/**
 * Format a date with modern Intl.DateTimeFormat
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale = 'en-US'
): string {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    logger.warn('Invalid date provided to formatDate', { date });
    return 'Invalid Date';
  }
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale = 'en-US'
): string {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  const now = new Date();
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);

  // If difference is very small (e.g. less than 10 seconds), return "Just now"
  if (Math.abs(diffInSeconds) < 10) {
    return 'Just now';
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ] as const;

  for (const interval of intervals) {
    const intervalCount = Math.floor(
      Math.abs(diffInSeconds) / interval.seconds
    );
    if (intervalCount >= 1) {
      return rtf.format(
        diffInSeconds < 0 ? -intervalCount : intervalCount,
        interval.label
      );
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Alias for backward compatibility with helpers.ts
 * Note: helpers.ts getRelativeTime only supported past dates ("ago"),
 * but this new implementation supports both past and future.
 */
export const getRelativeTime = (date: Date | string | number) =>
  formatRelativeTime(date);

/**
 * Parse date from various formats
 */
export function parseDate(input: string | number | Date): Date | null {
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string | number = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string | number = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of week (Sunday by default)
 */
export function startOfWeek(
  date: Date | string | number = new Date(),
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return startOfDay(d);
}

/**
 * Get end of week
 */
export function endOfWeek(
  date: Date | string | number = new Date(),
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): Date {
  const start = startOfWeek(date, weekStartsOn);
  start.setDate(start.getDate() + 6);
  return endOfDay(start);
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date | string | number = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  return startOfDay(d);
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date | string | number = new Date()): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  return endOfDay(d);
}

/**
 * Get start of year
 */
export function startOfYear(date: Date | string | number = new Date()): Date {
  const d = new Date(date);
  d.setMonth(0, 1);
  return startOfDay(d);
}

/**
 * Get end of year
 */
export function endOfYear(date: Date | string | number = new Date()): Date {
  const d = new Date(date);
  d.setMonth(11, 31);
  return endOfDay(d);
}

/**
 * Add time to a date
 */
export function addTime(
  date: Date | string | number,
  amount: number,
  unit:
    | 'years'
    | 'months'
    | 'weeks'
    | 'days'
    | 'hours'
    | 'minutes'
    | 'seconds'
    | 'milliseconds'
): Date {
  const d = new Date(date);

  switch (unit) {
    case 'years':
      d.setFullYear(d.getFullYear() + amount);
      break;
    case 'months':
      d.setMonth(d.getMonth() + amount);
      break;
    case 'weeks':
      d.setDate(d.getDate() + amount * 7);
      break;
    case 'days':
      d.setDate(d.getDate() + amount);
      break;
    case 'hours':
      d.setHours(d.getHours() + amount);
      break;
    case 'minutes':
      d.setMinutes(d.getMinutes() + amount);
      break;
    case 'seconds':
      d.setSeconds(d.getSeconds() + amount);
      break;
    case 'milliseconds':
      d.setMilliseconds(d.getMilliseconds() + amount);
      break;
  }

  return d;
}

/**
 * Subtract time from a date
 */
export function subtractTime(
  date: Date | string | number,
  amount: number,
  unit:
    | 'years'
    | 'months'
    | 'weeks'
    | 'days'
    | 'hours'
    | 'minutes'
    | 'seconds'
    | 'milliseconds'
): Date {
  return addTime(date, -amount, unit);
}

/**
 * Get difference between two dates
 */
export function dateDiff(
  date1: Date | string | number,
  date2: Date | string | number,
  unit:
    | 'years'
    | 'months'
    | 'weeks'
    | 'days'
    | 'hours'
    | 'minutes'
    | 'seconds'
    | 'milliseconds' = 'days'
): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = d2.getTime() - d1.getTime();

  switch (unit) {
    case 'years':
      return d2.getFullYear() - d1.getFullYear();
    case 'months':
      return (
        (d2.getFullYear() - d1.getFullYear()) * 12 +
        (d2.getMonth() - d1.getMonth())
      );
    case 'weeks':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    case 'days':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'hours':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'minutes':
      return Math.floor(diffMs / (1000 * 60));
    case 'seconds':
      return Math.floor(diffMs / 1000);
    case 'milliseconds':
      return diffMs;
  }
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string | number): boolean {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string | number): boolean {
  const d = new Date(date);
  const yesterday = subtractTime(new Date(), 1, 'days');
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date | string | number): boolean {
  const d = new Date(date);
  const tomorrow = addTime(new Date(), 1, 'days');
  return (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  return new Date(date).getTime() < Date.now();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  return new Date(date).getTime() > Date.now();
}

/**
 * Check if date is a weekend
 */
export function isWeekend(date: Date | string | number): boolean {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
}

/**
 * Check if date is a weekday
 */
export function isWeekday(date: Date | string | number): boolean {
  return !isWeekend(date);
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get number of days in a year
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Get the week number of a date (ISO week)
 */
export function getWeekNumber(date: Date | string | number): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get the quarter of a date (1-4)
 */
export function getQuarter(date: Date | string | number): 1 | 2 | 3 | 4 {
  return (Math.floor(new Date(date).getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(
  date1: Date | string | number,
  date2: Date | string | number
): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

/**
 * Check if two dates are in the same month
 */
export function isSameMonth(
  date1: Date | string | number,
  date2: Date | string | number
): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
  );
}

/**
 * Check if two dates are in the same year
 */
export function isSameYear(
  date1: Date | string | number,
  date2: Date | string | number
): boolean {
  return new Date(date1).getFullYear() === new Date(date2).getFullYear();
}

/**
 * Check if a date is between two dates
 */
export function isBetween(
  date: Date | string | number,
  start: Date | string | number,
  end: Date | string | number,
  inclusive = true
): boolean {
  const d = new Date(date).getTime();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();

  return inclusive ? d >= s && d <= e : d > s && d < e;
}

/**
 * Get age from birthdate
 */
export function getAge(birthDate: Date | string | number): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Get an array of dates between two dates
 */
export function getDateRange(
  start: Date | string | number,
  end: Date | string | number
): Date[] {
  const dates: Date[] = [];
  const current = startOfDay(start);
  const endDate = startOfDay(end);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Get closest date from an array
 */
export function getClosestDate(
  targetDate: Date | string | number,
  dates: (Date | string | number)[]
): Date | null {
  if (dates.length === 0) return null;

  const target = new Date(targetDate).getTime();
  let closest = new Date(dates[0]);
  let minDiff = Math.abs(target - closest.getTime());

  for (const date of dates) {
    const d = new Date(date);
    const diff = Math.abs(target - d.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = d;
    }
  }

  return closest;
}

/**
 * Format time only (HH:mm:ss)
 */
export function formatTime(
  date: Date | string | number,
  includeSeconds = false,
  use24Hour = true
): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  };

  if (includeSeconds) {
    options.second = '2-digit';
  }

  return new Intl.DateTimeFormat('en-US', options).format(d);
}

/**
 * Get timezone offset in hours
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset() / -60;
}

/**
 * Convert date to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date | string | number): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Parse ISO date string
 */
export function fromISODateString(isoString: string): Date {
  return new Date(isoString + 'T00:00:00');
}
