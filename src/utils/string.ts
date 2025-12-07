/**
 * String manipulation utilities
 * @module utils/string
 * @description Comprehensive string manipulation functions for text processing,
 * formatting, validation, and transformation. All functions handle null/undefined
 * inputs gracefully and return sensible defaults.
 */

/**
 * Convert string to URL-friendly slug format
 * @param text - The input string to slugify
 * @returns A lowercase, hyphenated string safe for URLs, or empty string for falsy input
 * @example slugify('Hello World!') // 'hello-world'
 * @example slugify(null) // ''
 */
export const slugify = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/'/g, '') // Remove apostrophes
    .replace(/[\s\W_]+/g, '-') // Replace spaces, non-word chars, and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Truncate text with proper word boundaries
 * @param text - The text to truncate
 * @param maxLength - Maximum length including suffix
 * @param suffix - Suffix to append when truncated (default: '...')
 * @returns Truncated text with suffix, or empty string for falsy input
 * @example truncate('Hello World', 8) // 'Hello...'
 */
export const truncate = (
  text: string | null | undefined,
  maxLength: number,
  suffix = '...'
): string => {
  if (!text) return '';
  if (maxLength < 1) return suffix;
  if (text.length <= maxLength) return text;

  let truncated = text.substring(0, maxLength - suffix.length);

  // If the next character in original text is a space, we didn't cut a word in half
  // Or if the truncated text ends with a space (unlikely due to substring but possible if original had multiple spaces)
  if (text[truncated.length] === ' ' || truncated.endsWith(' ')) {
    return truncated.trimEnd() + suffix;
  }

  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + suffix;
  }

  return truncated + suffix;
};

/**
 * Capitalize first letter of the string
 */
export const capitalizeFirst = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Capitalize first letter of each word (Title Case)
 */
export const titleCase = (text: string): string => {
  if (!text) return text;
  return text.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
};

/**
 * Extract initials from a name
 */
export const getInitials = (name: string, maxInitials = 2): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, maxInitials)
    .join('');
};

/**
 * Sanitize input by removing HTML tags
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input.replace(/[<>]/g, '').trim();
};

/**
 * Escape HTML special characters to prevent XSS
 */
export const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Convert string to camelCase
 */
export const camelCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^[A-Z]/, char => char.toLowerCase());
};

/**
 * Convert string to snake_case
 */
export const snakeCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
};

/**
 * Convert string to kebab-case
 */
export const kebabCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

/**
 * Convert string to PascalCase
 */
export const pascalCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^[a-z]/, char => char.toUpperCase());
};

/**
 * Simple pluralization (English)
 */
export const pluralize = (
  word: string,
  count: number,
  plural?: string
): string => {
  if (count === 1) return word;
  if (plural) return plural;

  // Handle common English pluralization rules
  if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) {
    return word.slice(0, -1) + 'ies';
  }
  if (/(?:s|x|z|ch|sh)$/i.test(word)) {
    return word + 'es';
  }
  return word + 's';
};

/**
 * Count words in a string
 */
export const wordCount = (text: string): number => {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
};

/**
 * Reverse a string
 */
export const reverseString = (str: string): string => {
  if (!str) return '';
  return [...str].reverse().join('');
};

/**
 * Mask sensitive data (e.g., emails, phone numbers, credit cards)
 */
export const maskString = (
  str: string,
  visibleStart = 3,
  visibleEnd = 3,
  maskChar = '*'
): string => {
  if (!str) return '';
  if (str.length <= visibleStart + visibleEnd) {
    return maskChar.repeat(str.length);
  }
  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const masked = maskChar.repeat(str.length - visibleStart - visibleEnd);
  return start + masked + end;
};

/**
 * Normalize whitespace (collapse multiple spaces, trim)
 */
export const normalizeWhitespace = (str: string): string => {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
};

/**
 * Strip all HTML tags from a string
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
};

/**
 * Extract all numbers from a string
 */
export const extractNumbers = (str: string): number[] => {
  if (!str) return [];
  const matches = str.match(/-?\d+\.?\d*/g);
  return matches ? matches.map(Number) : [];
};

/**
 * Extract all email addresses from a string
 */
export const extractEmails = (str: string): string[] => {
  if (!str) return [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return str.match(emailRegex) || [];
};

/**
 * Extract all URLs from a string
 */
export const extractUrls = (str: string): string[] => {
  if (!str) return [];
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  return str.match(urlRegex) || [];
};

/**
 * Check if string is all uppercase
 */
export const isUpperCase = (str: string): boolean => {
  if (!str) return false;
  return str === str.toUpperCase() && str !== str.toLowerCase();
};

/**
 * Check if string is all lowercase
 */
export const isLowerCase = (str: string): boolean => {
  if (!str) return false;
  return str === str.toLowerCase() && str !== str.toUpperCase();
};

/**
 * Pad string to a specified length with a custom character
 */
export const padString = (
  str: string,
  length: number,
  char = ' ',
  position: 'start' | 'end' | 'both' = 'end'
): string => {
  if (!str) str = '';
  if (str.length >= length) return str;

  const padding = char.repeat(Math.ceil((length - str.length) / char.length));

  switch (position) {
    case 'start':
      return (padding + str).slice(-length);
    case 'end':
      return (str + padding).slice(0, length);
    case 'both': {
      const totalPadding = length - str.length;
      const leftPadding = Math.floor(totalPadding / 2);
      const rightPadding = totalPadding - leftPadding;
      return char.repeat(leftPadding) + str + char.repeat(rightPadding);
    }
  }
};

/**
 * Count occurrences of a substring in a string
 */
export const countOccurrences = (
  str: string,
  substring: string,
  caseSensitive = true
): number => {
  if (!str || !substring) return 0;

  const searchStr = caseSensitive ? str : str.toLowerCase();
  const searchSubstr = caseSensitive ? substring : substring.toLowerCase();

  let count = 0;
  let pos = 0;

  while ((pos = searchStr.indexOf(searchSubstr, pos)) !== -1) {
    count++;
    pos += searchSubstr.length;
  }

  return count;
};

/**
 * Check if string is a palindrome
 */
export const isPalindrome = (str: string): boolean => {
  if (!str) return false;
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === [...cleaned].reverse().join('');
};

/**
 * Generate a random string of specified length
 * @param length - Desired length of the output string (must be positive)
 * @param charset - Characters to use (default: alphanumeric)
 * @returns Random string of specified length
 * @throws {RangeError} If length is negative
 */
export const randomString = (
  length: number,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string => {
  if (length < 0) throw new RangeError('Length must be non-negative');
  if (length === 0 || !charset) return '';

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * Wrap text at specified width
 */
export const wrapText = (text: string, width: number): string => {
  if (!text || width <= 0) return text || '';

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
};

/**
 * Convert string to sentence case (first letter uppercase, rest lowercase)
 */
export const sentenceCase = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Remove accents/diacritics from a string
 */
export const removeAccents = (str: string): string => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Check if string contains only alphanumeric characters
 */
export const isAlphanumeric = (str: string): boolean => {
  if (!str) return false;
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * Levenshtein distance between two strings (edit distance)
 */
export const levenshteinDistance = (a: string, b: string): number => {
  if (!a) return b?.length || 0;
  if (!b) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Calculate similarity percentage between two strings
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Similarity percentage (0-100)
 */
export const stringSimilarity = (a: string, b: string): number => {
  if (!a && !b) return 100;
  if (!a || !b) return 0;

  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 100;

  const distance = levenshteinDistance(a, b);
  return Math.round(((maxLength - distance) / maxLength) * 100);
};

/**
 * Convert a number to ordinal form (1st, 2nd, 3rd, etc.)
 * @param n - The number to convert
 * @returns The ordinal string representation
 * @example toOrdinal(1) // '1st'
 * @example toOrdinal(22) // '22nd'
 */
export const toOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * Highlight search terms in text by wrapping them with a tag
 * @param text - The source text
 * @param searchTerms - Terms to highlight (string or array)
 * @param tag - HTML tag to wrap matches (default: 'mark')
 * @returns Text with highlighted terms
 */
export const highlightTerms = (
  text: string,
  searchTerms: string | string[],
  tag = 'mark'
): string => {
  if (!text || !searchTerms) return text;

  const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  const escapedTerms = terms
    .filter(t => t.trim())
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escapedTerms.length === 0) return text;

  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  return text.replace(regex, `<${tag}>$1</${tag}>`);
};

/**
 * Convert bytes to human-readable format
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Human-readable string (e.g., '1.5 MB')
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return '-' + formatBytes(-bytes, decimals);

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Parse a template string with variables
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object containing variable values
 * @returns Parsed string with variables replaced
 * @example parseTemplate('Hello {{name}}!', { name: 'World' }) // 'Hello World!'
 */
export const parseTemplate = (
  template: string,
  variables: Record<string, string | number | boolean>
): string => {
  if (!template) return '';

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return key in variables ? String(variables[key]) : `{{${key}}}`;
  });
};

/**
 * Compress consecutive whitespace and normalize line endings
 * @param text - Input text
 * @returns Normalized text
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
