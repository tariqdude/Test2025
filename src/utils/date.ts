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
