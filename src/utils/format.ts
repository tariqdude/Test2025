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

/**
 * Format currency with localization
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
 * Format percentage
 */
export const formatPercent = (
  value: number,
  decimals = 0,
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format number with compact notation (1K, 1M, etc.)
 */
export const formatCompact = (num: number, locale = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
};

/**
 * Format number with units (e.g., "1.5K downloads")
 */
export const formatWithUnit = (
  value: number,
  unit: string,
  options: {
    compact?: boolean;
    decimals?: number;
    locale?: string;
  } = {}
): string => {
  const { compact = true, decimals = 1, locale = 'en-US' } = options;

  if (compact) {
    return `${formatCompact(value, locale)} ${unit}`;
  }

  return `${formatNumber(value, { maximumFractionDigits: decimals }, locale)} ${unit}`;
};

/**
 * Format ordinal numbers (1st, 2nd, 3rd, etc.)
 */
export const formatOrdinal = (num: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = Math.abs(num);
  const suffix =
    suffixes[
      value % 100 >= 11 && value % 100 <= 13 ? 0 : Math.min(value % 10, 4)
    ] || 'th';
  return `${num}${suffix}`;
};

/**
 * Format phone number (US format)
 */
export const formatPhoneUS = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Format credit card number with spaces
 */
export const formatCreditCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
};

/**
 * Format SSN (Social Security Number)
 */
export const formatSSN = (ssn: string): string => {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 9) return ssn;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
};

/**
 * Format ZIP code
 */
export const formatZipCode = (zip: string): string => {
  const cleaned = zip.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cleaned.slice(0, 5);
};

/**
 * Format bytes per second (bandwidth)
 */
export const formatBandwidth = (bytesPerSecond: number): string => {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
  let unitIndex = 0;
  let value = bytesPerSecond;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Format milliseconds as readable time
 */
export const formatMilliseconds = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000)
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
};

/**
 * Format list with proper grammar (e.g., "a, b, and c")
 */
export const formatList = (
  items: string[],
  options: {
    conjunction?: 'and' | 'or';
    oxfordComma?: boolean;
    locale?: string;
  } = {}
): string => {
  const { conjunction = 'and', oxfordComma = true, locale = 'en-US' } = options;

  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(` ${conjunction} `);

  // Use Intl.ListFormat if available
  if (typeof Intl !== 'undefined' && Intl.ListFormat) {
    return new Intl.ListFormat(locale, {
      style: 'long',
      type: conjunction === 'and' ? 'conjunction' : 'disjunction',
    }).format(items);
  }

  // Fallback
  const lastItem = items.pop();
  const separator = oxfordComma ? `, ${conjunction} ` : ` ${conjunction} `;
  return items.join(', ') + separator + lastItem;
};

/**
 * Format number as words (English, up to 999)
 */
export const formatNumberWords = (num: number): string => {
  if (num < 0 || num > 999 || !Number.isInteger(num)) {
    return String(num);
  }

  const ones = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  if (num === 0) return 'zero';
  if (num < 20) return ones[num];
  if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 ? '-' + ones[num % 10] : '');
  }

  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;
  return (
    ones[hundreds] +
    ' hundred' +
    (remainder ? ' ' + formatNumberWords(remainder) : '')
  );
};

/**
 * Format boolean as human-readable text
 */
export const formatBoolean = (
  value: boolean,
  options: {
    style?: 'yes-no' | 'true-false' | 'on-off' | 'enabled-disabled';
    capitalize?: boolean;
  } = {}
): string => {
  const { style = 'yes-no', capitalize = true } = options;

  const formats = {
    'yes-no': value ? 'yes' : 'no',
    'true-false': value ? 'true' : 'false',
    'on-off': value ? 'on' : 'off',
    'enabled-disabled': value ? 'enabled' : 'disabled',
  };

  const result = formats[style];
  return capitalize ? result.charAt(0).toUpperCase() + result.slice(1) : result;
};

/**
 * Format array of objects as table (for console/logging)
 */
export const formatTable = (
  data: Record<string, unknown>[],
  columns?: string[]
): string => {
  if (data.length === 0) return '';

  const cols = columns || Object.keys(data[0]);
  const rows = data.map(row => cols.map(col => String(row[col] ?? '')));

  const widths = cols.map((col, i) =>
    Math.max(col.length, ...rows.map(row => row[i].length))
  );

  const separator = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
  const headerRow =
    '| ' + cols.map((col, i) => col.padEnd(widths[i])).join(' | ') + ' |';
  const bodyRows = rows.map(
    row =>
      '| ' + row.map((cell, i) => cell.padEnd(widths[i])).join(' | ') + ' |'
  );

  return [separator, headerRow, separator, ...bodyRows, separator].join('\n');
};

/**
 * Format JSON with syntax highlighting (returns HTML)
 */
export const formatJsonHtml = (obj: unknown, indent = 2): string => {
  const json = JSON.stringify(obj, null, indent);

  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span style="color:#9cdcfe">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color:#ce9178">"$1"</span>')
    .replace(/: (\d+)/g, ': <span style="color:#b5cea8">$1</span>')
    .replace(/: (true|false)/g, ': <span style="color:#569cd6">$1</span>')
    .replace(/: (null)/g, ': <span style="color:#569cd6">$1</span>');
};

/**
 * Format bytes to human-readable with IEC units (KiB, MiB, etc.)
 */
export const formatBytesIEC = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    'Bytes',
    'KiB',
    'MiB',
    'GiB',
    'TiB',
    'PiB',
    'EiB',
    'ZiB',
    'YiB',
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format coordinate (latitude/longitude)
 */
export const formatCoordinate = (
  value: number,
  type: 'lat' | 'lng'
): string => {
  const direction =
    type === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';

  const absValue = Math.abs(value);
  const degrees = Math.floor(absValue);
  const minutes = Math.floor((absValue - degrees) * 60);
  const seconds = ((absValue - degrees) * 60 - minutes) * 60;

  return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
};

/**
 * Format temperature
 */
export const formatTemperature = (
  celsius: number,
  unit: 'C' | 'F' | 'K' = 'C'
): string => {
  switch (unit) {
    case 'F':
      return `${((celsius * 9) / 5 + 32).toFixed(1)}°F`;
    case 'K':
      return `${(celsius + 273.15).toFixed(1)}K`;
    default:
      return `${celsius.toFixed(1)}°C`;
  }
};
