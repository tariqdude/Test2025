/**
 * Regular Expression Utilities
 * @module utils/regex
 * @description Pattern builders, validators, and regex utilities for
 * common use cases like email, URL, phone, etc.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Regex match result with groups
 */
export interface MatchResult {
  match: string;
  index: number;
  groups: Record<string, string>;
  input: string;
}

/**
 * Pattern options
 */
export interface PatternOptions {
  /** Case insensitive */
  ignoreCase?: boolean;
  /** Global matching */
  global?: boolean;
  /** Multiline mode */
  multiline?: boolean;
  /** Unicode mode */
  unicode?: boolean;
  /** Dot matches newline */
  dotAll?: boolean;
}

// ============================================================================
// Common Patterns
// ============================================================================

/**
 * Pre-defined regex patterns
 */
export const patterns = {
  // Basic patterns
  digits: /^\d+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphabetic: /^[a-zA-Z]+$/,
  whitespace: /^\s+$/,
  nonWhitespace: /^\S+$/,

  // Email patterns
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  emailStrict:
    /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,

  // URL patterns
  url: /^https?:\/\/[^\s<>"{}|\\^`[\]]+$/,
  urlStrict:
    /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,
  domain: /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,

  // Phone patterns
  phone: /^\+?[0-9\s\-().]+$/,
  phoneUS:
    /^(?:\+1\s?)?(?:\([0-9]{3}\)|[0-9]{3})[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}$/,
  phoneIntl: /^\+[1-9]\d{1,14}$/,

  // ID patterns
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  uuidV4:
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  // Date/Time patterns
  isoDate: /^\d{4}-\d{2}-\d{2}$/,
  isoDateTime:
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?$/,
  time24h: /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/,
  time12h: /^(?:0?[1-9]|1[0-2]):[0-5]\d(?::[0-5]\d)?\s?(?:AM|PM|am|pm)$/,

  // Credit card patterns
  creditCard:
    /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/,
  visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
  mastercard: /^5[1-5][0-9]{14}$/,
  amex: /^3[47][0-9]{13}$/,

  // Network patterns
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  macAddress: /^(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/,

  // Code patterns
  hexColor: /^#?(?:[0-9a-fA-F]{3}){1,2}$/,
  hexColorAlpha: /^#?(?:[0-9a-fA-F]{3,4}){1,2}$/,
  semver:
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,

  // Password patterns
  passwordStrong:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  passwordMedium: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/,

  // File patterns
  filename: /^[^\\/:*?"<>|]+$/,
  fileExtension: /\.([a-zA-Z0-9]+)$/,

  // HTML/XML
  htmlTag: /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g,
  htmlComment: /<!--[\s\S]*?-->/g,

  // Social
  hashtag: /#[a-zA-Z_][a-zA-Z0-9_]*/g,
  mention: /@[a-zA-Z_][a-zA-Z0-9_]*/g,
  twitter: /^@[a-zA-Z_][a-zA-Z0-9_]{0,14}$/,
} as const;

// ============================================================================
// Pattern Builder
// ============================================================================

/**
 * Fluent regex builder
 */
export class PatternBuilder {
  private parts: string[] = [];
  private flags = '';

  /**
   * Add a literal string (escaped)
   */
  literal(str: string): this {
    this.parts.push(escapeRegex(str));
    return this;
  }

  /**
   * Add a raw pattern
   */
  raw(pattern: string): this {
    this.parts.push(pattern);
    return this;
  }

  /**
   * Add digit pattern
   */
  digit(count?: number | { min: number; max?: number }): this {
    this.parts.push(this.quantify('\\d', count));
    return this;
  }

  /**
   * Add word character pattern
   */
  word(count?: number | { min: number; max?: number }): this {
    this.parts.push(this.quantify('\\w', count));
    return this;
  }

  /**
   * Add whitespace pattern
   */
  whitespace(count?: number | { min: number; max?: number }): this {
    this.parts.push(this.quantify('\\s', count));
    return this;
  }

  /**
   * Add any character pattern
   */
  any(count?: number | { min: number; max?: number }): this {
    this.parts.push(this.quantify('.', count));
    return this;
  }

  /**
   * Add character class
   */
  charClass(chars: string, negated = false): this {
    const escaped = chars.replace(/[\]\\^-]/g, '\\$&');
    this.parts.push(`[${negated ? '^' : ''}${escaped}]`);
    return this;
  }

  /**
   * Add range
   */
  range(start: string, end: string): this {
    this.parts.push(`[${start}-${end}]`);
    return this;
  }

  /**
   * Add optional pattern
   */
  optional(pattern: string | PatternBuilder): this {
    const p = typeof pattern === 'string' ? pattern : pattern.toString();
    this.parts.push(`(?:${p})?`);
    return this;
  }

  /**
   * Add group
   */
  group(pattern: string | PatternBuilder, name?: string): this {
    const p = typeof pattern === 'string' ? pattern : pattern.toString();
    if (name) {
      this.parts.push(`(?<${name}>${p})`);
    } else {
      this.parts.push(`(${p})`);
    }
    return this;
  }

  /**
   * Add non-capturing group
   */
  nonCapturing(pattern: string | PatternBuilder): this {
    const p = typeof pattern === 'string' ? pattern : pattern.toString();
    this.parts.push(`(?:${p})`);
    return this;
  }

  /**
   * Add lookahead
   */
  lookahead(pattern: string | PatternBuilder, negative = false): this {
    const p = typeof pattern === 'string' ? pattern : pattern.toString();
    this.parts.push(`(?${negative ? '!' : '='}${p})`);
    return this;
  }

  /**
   * Add lookbehind
   */
  lookbehind(pattern: string | PatternBuilder, negative = false): this {
    const p = typeof pattern === 'string' ? pattern : pattern.toString();
    this.parts.push(`(?<${negative ? '!' : '='}${p})`);
    return this;
  }

  /**
   * Add alternative patterns
   */
  or(...patterns: Array<string | PatternBuilder>): this {
    const alts = patterns.map(p => (typeof p === 'string' ? p : p.toString()));
    this.parts.push(`(?:${alts.join('|')})`);
    return this;
  }

  /**
   * Add start anchor
   */
  startOfLine(): this {
    this.parts.push('^');
    return this;
  }

  /**
   * Add end anchor
   */
  endOfLine(): this {
    this.parts.push('$');
    return this;
  }

  /**
   * Add word boundary
   */
  wordBoundary(): this {
    this.parts.push('\\b');
    return this;
  }

  /**
   * Repeat pattern
   */
  repeat(
    pattern: string | PatternBuilder,
    count: number | { min: number; max?: number }
  ): this {
    const p = typeof pattern === 'string' ? pattern : pattern.toString();
    this.parts.push(this.quantify(`(?:${p})`, count));
    return this;
  }

  /**
   * Zero or more
   */
  zeroOrMore(pattern: string | PatternBuilder, lazy = false): this {
    const p = typeof pattern === 'string' ? pattern : pattern.toString();
    this.parts.push(`(?:${p})*${lazy ? '?' : ''}`);
    return this;
  }

  /**
   * One or more
   */
  oneOrMore(pattern: string | PatternBuilder, lazy = false): this {
    const p = typeof pattern === 'string' ? pattern : pattern.toString();
    this.parts.push(`(?:${p})+${lazy ? '?' : ''}`);
    return this;
  }

  /**
   * Set flags
   */
  withFlags(options: PatternOptions): this {
    let f = '';
    if (options.global) f += 'g';
    if (options.ignoreCase) f += 'i';
    if (options.multiline) f += 'm';
    if (options.unicode) f += 'u';
    if (options.dotAll) f += 's';
    this.flags = f;
    return this;
  }

  /**
   * Build the regex
   */
  build(): RegExp {
    return new RegExp(this.parts.join(''), this.flags);
  }

  /**
   * Get pattern string
   */
  toString(): string {
    return this.parts.join('');
  }

  private quantify(
    base: string,
    count?: number | { min: number; max?: number }
  ): string {
    if (count === undefined) return base;
    if (typeof count === 'number') {
      return `${base}{${count}}`;
    }
    if (count.max === undefined) {
      return `${base}{${count.min},}`;
    }
    return `${base}{${count.min},${count.max}}`;
  }
}

/**
 * Create a new pattern builder
 */
export function pattern(): PatternBuilder {
  return new PatternBuilder();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create regex from string with flags
 */
export function createRegex(pattern: string, flags = ''): RegExp {
  return new RegExp(pattern, flags);
}

/**
 * Test if string matches pattern
 */
export function test(pattern: RegExp | string, str: string): boolean {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  return regex.test(str);
}

/**
 * Match pattern and return results
 */
export function match(pattern: RegExp | string, str: string): MatchResult[] {
  const regex =
    typeof pattern === 'string'
      ? new RegExp(pattern, 'g')
      : pattern.global
        ? pattern
        : new RegExp(pattern.source, pattern.flags + 'g');

  const results: MatchResult[] = [];
  let m: RegExpExecArray | null;

  while ((m = regex.exec(str)) !== null) {
    results.push({
      match: m[0],
      index: m.index,
      groups: m.groups ? { ...m.groups } : {},
      input: str,
    });
  }

  return results;
}

/**
 * Get first match
 */
export function matchFirst(
  pattern: RegExp | string,
  str: string
): MatchResult | null {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  const m = regex.exec(str);

  if (!m) return null;

  return {
    match: m[0],
    index: m.index,
    groups: m.groups ? { ...m.groups } : {},
    input: str,
  };
}

/**
 * Replace with callback
 */
export function replaceWith(
  pattern: RegExp | string,
  str: string,
  replacer: (match: MatchResult) => string
): string {
  const regex =
    typeof pattern === 'string'
      ? new RegExp(pattern, 'g')
      : pattern.global
        ? pattern
        : new RegExp(pattern.source, pattern.flags + 'g');

  return str.replace(regex, (m, ...args) => {
    const groups =
      typeof args[args.length - 1] === 'object' ? args[args.length - 1] : {};
    const index =
      typeof args[args.length - 2] === 'number'
        ? args[args.length - 2]
        : args[0];

    return replacer({
      match: m,
      index: typeof index === 'number' ? index : 0,
      groups: groups || {},
      input: str,
    });
  });
}

/**
 * Split string by pattern
 */
export function split(
  pattern: RegExp | string,
  str: string,
  limit?: number
): string[] {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  return str.split(regex, limit);
}

/**
 * Count matches
 */
export function countMatches(pattern: RegExp | string, str: string): number {
  return match(pattern, str).length;
}

/**
 * Extract all capture groups
 */
export function extractGroups(
  pattern: RegExp | string,
  str: string
): Record<string, string>[] {
  return match(pattern, str).map(m => m.groups);
}

/**
 * Check if pattern is valid
 */
export function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Combine patterns with OR
 */
export function combineOr(...patterns: Array<RegExp | string>): RegExp {
  const combined = patterns
    .map(p => (typeof p === 'string' ? p : p.source))
    .join('|');
  return new RegExp(`(?:${combined})`);
}

/**
 * Combine patterns sequentially
 */
export function combineSequence(...patterns: Array<RegExp | string>): RegExp {
  const combined = patterns
    .map(p => (typeof p === 'string' ? p : p.source))
    .join('');
  return new RegExp(combined);
}

/**
 * Create pattern for exact match
 */
export function exact(str: string, options?: PatternOptions): RegExp {
  const escaped = escapeRegex(str);
  let flags = '';
  if (options?.ignoreCase) flags += 'i';
  return new RegExp(`^${escaped}$`, flags);
}

/**
 * Create pattern for word match
 */
export function word(str: string, options?: PatternOptions): RegExp {
  const escaped = escapeRegex(str);
  let flags = '';
  if (options?.global) flags += 'g';
  if (options?.ignoreCase) flags += 'i';
  return new RegExp(`\\b${escaped}\\b`, flags);
}

/**
 * Create pattern for starts with
 */
export function startsWith(str: string, options?: PatternOptions): RegExp {
  const escaped = escapeRegex(str);
  let flags = '';
  if (options?.ignoreCase) flags += 'i';
  if (options?.multiline) flags += 'm';
  return new RegExp(`^${escaped}`, flags);
}

/**
 * Create pattern for ends with
 */
export function endsWith(str: string, options?: PatternOptions): RegExp {
  const escaped = escapeRegex(str);
  let flags = '';
  if (options?.ignoreCase) flags += 'i';
  if (options?.multiline) flags += 'm';
  return new RegExp(`${escaped}$`, flags);
}

/**
 * Create pattern for contains
 */
export function contains(str: string, options?: PatternOptions): RegExp {
  const escaped = escapeRegex(str);
  let flags = '';
  if (options?.global) flags += 'g';
  if (options?.ignoreCase) flags += 'i';
  return new RegExp(escaped, flags);
}

// ============================================================================
// Validators
// ============================================================================

/**
 * Validate email
 */
export function isEmail(str: string, strict = false): boolean {
  return strict ? patterns.emailStrict.test(str) : patterns.email.test(str);
}

/**
 * Validate URL
 */
export function isUrl(str: string, strict = false): boolean {
  return strict ? patterns.urlStrict.test(str) : patterns.url.test(str);
}

/**
 * Validate UUID
 */
export function isUuid(str: string, version?: 4): boolean {
  return version === 4 ? patterns.uuidV4.test(str) : patterns.uuid.test(str);
}

/**
 * Validate IP address
 */
export function isIpAddress(str: string, version?: 4 | 6): boolean {
  if (version === 4) return patterns.ipv4.test(str);
  if (version === 6) return patterns.ipv6.test(str);
  return patterns.ipv4.test(str) || patterns.ipv6.test(str);
}

/**
 * Validate hex color
 */
export function isHexColor(str: string, withAlpha = false): boolean {
  return withAlpha
    ? patterns.hexColorAlpha.test(str)
    : patterns.hexColor.test(str);
}

/**
 * Validate semantic version
 */
export function isSemver(str: string): boolean {
  return patterns.semver.test(str);
}

/**
 * Validate phone number
 */
export function isPhone(str: string, format?: 'us' | 'intl'): boolean {
  if (format === 'us') return patterns.phoneUS.test(str);
  if (format === 'intl') return patterns.phoneIntl.test(str);
  return patterns.phone.test(str);
}

/**
 * Validate credit card
 */
export function isCreditCard(
  str: string,
  type?: 'visa' | 'mastercard' | 'amex'
): boolean {
  const normalized = str.replace(/\s|-/g, '');
  if (type === 'visa') return patterns.visa.test(normalized);
  if (type === 'mastercard') return patterns.mastercard.test(normalized);
  if (type === 'amex') return patterns.amex.test(normalized);
  return patterns.creditCard.test(normalized);
}

/**
 * Check password strength
 */
export function checkPasswordStrength(
  password: string
): 'weak' | 'medium' | 'strong' {
  if (patterns.passwordStrong.test(password)) return 'strong';
  if (patterns.passwordMedium.test(password)) return 'medium';
  return 'weak';
}

// ============================================================================
// Extractors
// ============================================================================

/**
 * Extract emails from text
 */
export function extractEmails(text: string): string[] {
  const regex = new RegExp(patterns.email.source, 'gi');
  return text.match(regex) || [];
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const regex = new RegExp(patterns.url.source, 'gi');
  return text.match(regex) || [];
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  return text.match(patterns.hashtag) || [];
}

/**
 * Extract mentions from text
 */
export function extractMentions(text: string): string[] {
  return text.match(patterns.mention) || [];
}

/**
 * Extract numbers from text
 */
export function extractNumbers(text: string): number[] {
  const matches = text.match(/-?\d+\.?\d*/g);
  return matches ? matches.map(Number).filter(n => !isNaN(n)) : [];
}

/**
 * Extract words from text
 */
export function extractWords(text: string): string[] {
  return text.match(/\b[a-zA-Z]+\b/g) || [];
}

// ============================================================================
// Named Capture Groups Helper
// ============================================================================

/**
 * Parse string with named pattern
 */
export function parseWith<T extends Record<string, string>>(
  pattern: RegExp,
  str: string
): T | null {
  const match = pattern.exec(str);
  if (!match?.groups) return null;
  return match.groups as T;
}

/**
 * Create parser for format string
 * @example
 * const parser = createParser('{year}-{month}-{day}');
 * parser.parse('2024-01-15'); // { year: '2024', month: '01', day: '15' }
 */
export function createParser(format: string): {
  pattern: RegExp;
  parse: (str: string) => Record<string, string> | null;
} {
  // Convert format placeholders to named groups
  const escapedFormat = format.replace(
    /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
    (_match, name) => `(?<${name}>[^{}]+?)`
  );

  const pattern = new RegExp(
    `^${escapeRegex(escapedFormat).replace(/\\\(\\\?<[^>]+>[^)]+\\\)/g, m => {
      // Unescape the named groups
      return m
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\?/g, '?');
    })}$`
  );

  // Actually build correct pattern
  const parts: string[] = [];
  let lastIndex = 0;
  const placeholderRegex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  let m: RegExpExecArray | null;

  while ((m = placeholderRegex.exec(format)) !== null) {
    if (m.index > lastIndex) {
      parts.push(escapeRegex(format.slice(lastIndex, m.index)));
    }
    parts.push(`(?<${m[1]}>.+?)`);
    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < format.length) {
    parts.push(escapeRegex(format.slice(lastIndex)));
  }

  const finalPattern = new RegExp(`^${parts.join('')}$`);

  return {
    pattern: finalPattern,
    parse: (str: string): Record<string, string> | null => {
      const match = finalPattern.exec(str);
      return match?.groups ? { ...match.groups } : null;
    },
  };
}

// ============================================================================
// Export Default
// ============================================================================

export const regex = {
  // Patterns
  patterns,

  // Builder
  pattern,
  PatternBuilder,

  // Utilities
  escapeRegex,
  createRegex,
  test,
  match,
  matchFirst,
  replaceWith,
  split,
  countMatches,
  extractGroups,
  isValidRegex,
  combineOr,
  combineSequence,
  exact,
  word,
  startsWith,
  endsWith,
  contains,

  // Validators
  isEmail,
  isUrl,
  isUuid,
  isIpAddress,
  isHexColor,
  isSemver,
  isPhone,
  isCreditCard,
  checkPasswordStrength,

  // Extractors
  extractEmails,
  extractUrls,
  extractHashtags,
  extractMentions,
  extractNumbers,
  extractWords,

  // Parsing
  parseWith,
  createParser,
};
