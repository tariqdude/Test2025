/**
 * Common utility functions used across the application
 */

/**
 * Generate a simple hash checksum for content
 * Uses djb2 algorithm for fast string hashing
 * @param content - The string content to hash
 * @returns Hexadecimal hash string
 * @example
 * ```ts
 * const hash = generateChecksum('Hello World');
 * // Returns something like '1a2b3c4d'
 * ```
 */
export function generateChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Generate a unique ID with optional prefix
 * @param prefix - Optional prefix for the ID
 * @returns Unique string ID
 */
export function generateUniqueId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Check if code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if code is running in a Node.js environment
 */
export function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
}

/**
 * Safe JSON parse that returns null on failure
 * @param json - JSON string to parse
 * @returns Parsed object or null if invalid
 */
export function safeJsonParse<T = unknown>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Safe JSON stringify that handles circular references
 * @param value - Value to stringify
 * @param space - Indentation spaces
 * @returns JSON string or null if failed
 */
export function safeJsonStringify(
  value: unknown,
  space?: number
): string | null {
  const seen = new WeakSet();
  try {
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) {
            return '[Circular]';
          }
          seen.add(val);
        }
        return val;
      },
      space
    );
  } catch {
    return null;
  }
}

/**
 * Normalize a file path for cross-platform compatibility
 * @param filePath - Path to normalize
 * @returns Normalized path with forward slashes
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Get file extension from a path
 * @param filePath - File path
 * @returns Extension including the dot, or empty string
 */
export function getFileExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  const lastSlash = Math.max(
    filePath.lastIndexOf('/'),
    filePath.lastIndexOf('\\')
  );
  if (lastDot > lastSlash && lastDot !== -1) {
    return filePath.slice(lastDot);
  }
  return '';
}

/**
 * Check if a value is a plain object
 * @param value - Value to check
 * @returns True if plain object
 */
export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Deep clone an object using structured clone when available
 * @param value - Value to clone
 * @returns Deep cloned value
 */
export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}
