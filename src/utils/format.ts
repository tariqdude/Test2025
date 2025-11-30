/**
 * Formatting utilities
 */

/**
 * Format numbers with proper localization
 */
export const formatNumber = (
  num: number,
  options: Intl.NumberFormatOptions = {},
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, options).format(num);
};

/**
 * Format file sizes in human-readable format
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
