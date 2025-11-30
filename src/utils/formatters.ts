import { formatDate, formatRelativeTime } from './date';
import { formatFileSize } from './format';

/**
 * Format currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @param locale - The locale to use (default: en-US)
 */
export const formatCurrency = (
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format number in compact notation (e.g., 1.2k, 1M)
 * @param num - The number to format
 * @param locale - The locale to use (default: en-US)
 */
export const formatCompactNumber = (num: number, locale = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num);
};

// Re-export existing formatters for a centralized import
export { formatDate, formatRelativeTime, formatFileSize };
