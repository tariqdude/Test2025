/**
 * String manipulation utilities
 */

/**
 * Convert string to slug format
 */
export const slugify = (text: string): string => {
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
 */
export const truncate = (
  text: string,
  maxLength: number,
  suffix = '...'
): string => {
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
